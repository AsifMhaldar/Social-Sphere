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

  const servers = {
    iceServers: [
      { urls: "stun:stun.relay.metered.ca:80" },
      {
        urls: "turn:global.relay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turns:global.relay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
    ],
  };

  // =================================
  // INITIAL START
  // =================================
  useEffect(() => {
    if (!isOpen) return;

    if (incomingOffer) {
      setIsRinging(true);

      if (ringtoneRef.current) {
        ringtoneRef.current.play().catch(() => {});
      }
    } else {
      startOutgoingCall();
    }

    return () => cleanup();
  }, [isOpen]);

  // =================================
  // CALLER
  // =================================
  const startOutgoingCall = async () => {
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }

      peerConnection.current = new RTCPeerConnection(servers);

      // 🔥 ADD TRACKS (important)
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket()?.emit("iceCandidate", {
            toUserId: typeof friend === "string" ? friend : friend._id,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current.connectionState;
        console.log("Connection state:", state);

        if (state === "disconnected" || state === "failed") {
          endCall();
        }
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      getSocket()?.emit("callUser", {
        toUserId: typeof friend === "string" ? friend : friend._id,
        offer,
        callType,
      });

      setIsRinging(true);

      // 🔥 Call timeout (30 sec)
      setTimeout(() => {
        if (!callAccepted) {
          console.log("Call timeout");
          endCall();
        }
      }, 30000);

    } catch (err) {
      console.error("Outgoing call error:", err);
    }
  };

  // =================================
  // RECEIVER
  // =================================
  const acceptCall = async () => {
    try {
      setCallAccepted(true);
      setIsRinging(false);

      if (ringtoneRef.current) ringtoneRef.current.pause();

      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }

      peerConnection.current = new RTCPeerConnection(servers);

      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket()?.emit("iceCandidate", {
            toUserId: typeof friend === "string" ? friend : friend._id,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current.connectionState;
        console.log("Receiver state:", state);

        if (state === "failed" || state === "disconnected") {
          endCall();
        }
      };

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(incomingOffer)
      );

      for (const candidate of pendingCandidates.current) {
        await peerConnection.current.addIceCandidate(candidate);
      }

      pendingCandidates.current = [];

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      getSocket()?.emit("answerCall", {
        toUserId: typeof friend === "string" ? friend : friend._id,
        answer,
      });

      startTimer();

    } catch (err) {
      console.error("Accept call error:", err);
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

        if (!peerConnection.current.remoteDescription) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );

          for (const candidate of pendingCandidates.current) {
            await peerConnection.current.addIceCandidate(candidate);
          }

          pendingCandidates.current = [];
        }

        setCallAccepted(true);
        setIsRinging(false);
        startTimer();

      } catch (err) {
        console.log("Answer error:", err);
      }
    });

    socket.on("iceCandidate", async (data) => {
      const candidate = data?.candidate;
      if (!candidate || !peerConnection.current) return;

      const iceCandidate = new RTCIceCandidate(candidate);

      if (peerConnection.current.remoteDescription) {
        await peerConnection.current.addIceCandidate(iceCandidate);
      } else {
        pendingCandidates.current.push(iceCandidate);
      }
    });

    socket.on("callEnded", () => {
      cleanup();
      onClose();
    });

    return () => {
      socket.off("callAnswered");
      socket.off("iceCandidate");
      socket.off("callEnded");
    };
  }, []);

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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // =================================
  // CLEANUP
  // =================================
  const cleanup = () => {
    clearInterval(timerRef.current);

    setCallTimer(0);
    setCallAccepted(false);
    setIsRinging(false);

    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

    if (peerConnection.current) {
      peerConnection.current.ontrack = null;
      peerConnection.current.onicecandidate = null;
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
  };

  const endCall = () => {
    getSocket()?.emit("endCall", {
      toUserId: typeof friend === "string" ? friend : friend._id,
    });

    cleanup();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-50">

      <audio
        ref={ringtoneRef}
        src="https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg"
        loop
      />

      {isRinging && !callAccepted && (
        <>
          <h2 className="text-xl mb-6">
            {incomingOffer ? "Incoming Call..." : "Calling..."}
          </h2>

          {incomingOffer && (
            <div className="flex gap-6">
              <button
                onClick={acceptCall}
                className="bg-green-600 px-6 py-3 rounded-full"
              >
                Accept
              </button>

              <button
                onClick={endCall}
                className="bg-red-600 px-6 py-3 rounded-full"
              >
                Reject
              </button>
            </div>
          )}
        </>
      )}

      {callAccepted && (
        <>
          <h2 className="mb-4 text-lg">{formatTime()}</h2>

          {callType === "video" && (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                className="w-3/4 rounded-xl mb-4"
              />

              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-32 absolute bottom-20 right-10 rounded-lg border"
              />
            </>
          )}

          <button
            onClick={endCall}
            className="bg-red-600 px-6 py-3 rounded-full"
          >
            End Call
          </button>
        </>
      )}
    </div>
  );
}