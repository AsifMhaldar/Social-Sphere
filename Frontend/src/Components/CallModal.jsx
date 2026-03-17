import { useEffect, useRef, useState } from "react";
import { getSocket } from "../utils/socket";

export default function CallModal({
  user,
  friend,
  callType,
  incomingOffer,
  isOpen,
  onClose,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const timerRef = useRef(null);
  const ringtoneRef = useRef(null);
  const pendingCandidates = useRef([]);

  const [callTimer, setCallTimer] = useState(0);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [callFailed, setCallFailed] = useState(false);
  const [connectionState, setConnectionState] = useState("new");

  const servers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      {
        urls: "turn:numb.viagenie.ca",
        credential: "muazkh",
        username: "webrtc@live.com"
      }
    ],
    iceCandidatePoolSize: 10,
  };

  // =================================
  // INITIAL SETUP
  // =================================
  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setCallTimer(0);
    setCallAccepted(false);
    setCallFailed(false);
    pendingCandidates.current = [];

    if (incomingOffer) {
      setIsRinging(true);
      playRingtone();
    } else {
      startOutgoingCall();
    }

    return () => cleanup();
  }, [isOpen]);

  // =================================
  // PLAY RINGTONE
  // =================================
  const playRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.play().catch(e => console.log("Ringtone play failed:", e));
    }
  };

  // =================================
  // STOP RINGTONE
  // =================================
  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  // =================================
  // CREATE PEER CONNECTION
  // =================================
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(servers);

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      setConnectionState(pc.connectionState);

      if (pc.connectionState === "connected") {
        setCallAccepted(true);
        stopRingtone();
        startTimer();
      }

      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        handleCallFailure();
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        getSocket()?.emit("iceCandidate", {
          toUserId: friend._id,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  // =================================
  // GET LOCAL STREAM
  // =================================
  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      console.error("Error getting local stream:", err);
      setCallFailed(true);
      throw err;
    }
  };

  // =================================
  // START OUTGOING CALL
  // =================================
  const startOutgoingCall = async () => {
    try {
      // Get local stream
      localStream.current = await getLocalStream();

      // Create peer connection
      peerConnection.current = createPeerConnection();

      // Add tracks to peer connection
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      // Create and set local description
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      // Send offer to receiver
      getSocket()?.emit("callUser", {
        toUserId: friend._id,
        offer,
        callType,
      });

      setIsRinging(true);
      setCallFailed(false);

      // Call timeout (30 seconds)
      setTimeout(() => {
        if (!callAccepted && !callFailed) {
          handleCallFailure("Call timed out");
        }
      }, 30000);

    } catch (err) {
      console.error("Outgoing call error:", err);
      handleCallFailure(err.message);
    }
  };

  // =================================
  // ACCEPT CALL
  // =================================
  const acceptCall = async () => {
    try {
      stopRingtone();

      // Get local stream
      localStream.current = await getLocalStream();

      // Create peer connection
      peerConnection.current = createPeerConnection();

      // Add tracks
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      // Set remote description from incoming offer
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(incomingOffer)
      );

      // Add any pending ICE candidates
      for (const candidate of pendingCandidates.current) {
        try {
          await peerConnection.current.addIceCandidate(candidate);
        } catch (e) {
          console.log("Error adding pending candidate:", e);
        }
      }
      pendingCandidates.current = [];

      // Create and set answer
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      // Send answer to caller
      getSocket()?.emit("answerCall", {
        toUserId: friend._id,
        answer,
      });

      setCallAccepted(true);

    } catch (err) {
      console.error("Accept call error:", err);
      handleCallFailure(err.message);
    }
  };

  // =================================
  // SOCKET EVENTS
  // =================================
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("callAnswered", async ({ answer }) => {
      try {
        if (!peerConnection.current) return;

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        // Add any pending candidates
        for (const candidate of pendingCandidates.current) {
          try {
            await peerConnection.current.addIceCandidate(candidate);
          } catch (e) {
            console.log("Error adding candidate:", e);
          }
        }
        pendingCandidates.current = [];

      } catch (err) {
        console.error("Answer error:", err);
      }
    });

    socket.on("iceCandidate", async (data) => {
      try {
        const candidate = data?.candidate;
        if (!candidate || !peerConnection.current) return;

        const iceCandidate = new RTCIceCandidate(candidate);

        if (peerConnection.current.remoteDescription) {
          await peerConnection.current.addIceCandidate(iceCandidate);
        } else {
          pendingCandidates.current.push(iceCandidate);
        }
      } catch (err) {
        console.log("Error adding ICE candidate:", err);
      }
    });

    socket.on("callEnded", () => {
      handleCallEnd();
    });

    socket.on("callRejected", () => {
      setCallFailed(true);
      stopRingtone();
      setTimeout(() => {
        cleanup();
        onClose();
      }, 2000);
    });

    socket.on("callFailed", ({ reason }) => {
      setCallFailed(true);
      stopRingtone();
      setTimeout(() => {
        cleanup();
        onClose();
      }, 2000);
    });

    return () => {
      socket.off("callAnswered");
      socket.off("iceCandidate");
      socket.off("callEnded");
      socket.off("callRejected");
      socket.off("callFailed");
    };
  }, []);

  // =================================
  // HANDLE CALL FAILURE
  // =================================
  const handleCallFailure = (message = "Call failed") => {
    console.log("Call failed:", message);
    setCallFailed(true);
    stopRingtone();
    
    setTimeout(() => {
      endCall();
    }, 2000);
  };

  // =================================
  // HANDLE CALL END
  // =================================
  const handleCallEnd = () => {
    stopRingtone();
    cleanup();
    onClose();
  };

  // =================================
  // TIMER
  // =================================
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallTimer((prev) => prev + 1);
    }, 1000);
  };

  const formatTime = () => {
    const mins = Math.floor(callTimer / 60);
    const secs = callTimer % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // =================================
  // CLEANUP
  // =================================
  const cleanup = () => {
    clearInterval(timerRef.current);

    stopRingtone();

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStream.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    pendingCandidates.current = [];
  };

  // =================================
  // END CALL
  // =================================
  const endCall = () => {
    getSocket()?.emit("endCall", {
      toUserId: friend._id,
    });

    cleanup();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center text-white z-50">
      <audio
        ref={ringtoneRef}
        src="https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg"
        loop
      />

      {/* Call Failed Message */}
      {callFailed && (
        <div className="text-center mb-4">
          <p className="text-red-500 text-lg">Call Failed</p>
        </div>
      )}

      {/* Ringing State */}
      {isRinging && !callAccepted && !callFailed && (
        <div className="text-center mb-8">
          <h2 className="text-2xl mb-4">
            {incomingOffer ? "Incoming Call..." : "Calling..."}
          </h2>
          <p className="text-gray-400 mb-8">
            {friend.firstName} {friend.lastName}
          </p>

          {incomingOffer ? (
            <div className="flex gap-6">
              <button
                onClick={acceptCall}
                className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-full font-semibold transition-colors"
              >
                Accept
              </button>
              <button
                onClick={endCall}
                className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-semibold transition-colors"
              >
                Reject
              </button>
            </div>
          ) : (
            <button
              onClick={endCall}
              className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Call Connected State */}
      {callAccepted && !callFailed && (
        <>
          {/* Timer */}
          <div className="text-center mb-4">
            <p className="text-2xl font-mono">{formatTime()}</p>
          </div>

          {/* Video Call UI */}
          {callType === "video" ? (
            <div className="relative w-full max-w-4xl mx-auto">
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-auto rounded-lg bg-gray-900"
              />

              {/* Local Video (Picture-in-Picture) */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 w-48 h-36 rounded-lg border-2 border-white bg-gray-800 object-cover"
              />
            </div>
          ) : (
            /* Audio Call UI */
            <div className="text-center mb-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl font-bold">
                  {friend.firstName?.charAt(0)}
                </span>
              </div>
              <p className="text-xl">{friend.firstName} {friend.lastName}</p>
              <p className="text-gray-400">Audio call in progress...</p>
            </div>
          )}

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="mt-6 bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-semibold transition-colors"
          >
            End Call
          </button>
        </>
      )}
    </div>
  );
}