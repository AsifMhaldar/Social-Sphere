import { useEffect, useRef, useState } from "react";
import socket from "../utils/socket";

export default function CallModal({
  user,
  friend,
  callType,
  incomingOffer, // 🔥 IMPORTANT
  isOpen,
  onClose,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const timerRef = useRef(null);
  const ringtoneRef = useRef(null);

  const [callTimer, setCallTimer] = useState(0);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // =============================
  // INITIALIZE CALL
  // =============================
  useEffect(() => {
    if (!isOpen) return;

    if (incomingOffer) {
      // 🔥 RECEIVER SIDE
      setIsRinging(true);
      if (ringtoneRef.current) ringtoneRef.current.play();
    } else {
      // 🔥 CALLER SIDE
      startOutgoingCall();
    }

    return () => cleanup();
  }, [isOpen]);

  // =============================
  // OUTGOING CALL
  // =============================
  const startOutgoingCall = async () => {
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      if (localVideoRef.current)
        localVideoRef.current.srcObject = localStream.current;

      peerConnection.current = new RTCPeerConnection(servers);

      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      peerConnection.current.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("iceCandidate", {
            toUserId: friend._id,
            candidate: event.candidate,
          });
        }
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("callUser", {
        fromUserId: user._id,
        toUserId: friend._id,
        offer,
        callType,
      });

      setIsRinging(true);
    } catch (err) {
      console.error("Call error:", err);
    }
  };

  // =============================
  // ACCEPT CALL (RECEIVER)
  // =============================
  const acceptCall = async () => {
    setCallAccepted(true);
    setIsRinging(false);
    if (ringtoneRef.current) ringtoneRef.current.pause();

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: callType === "video",
      audio: true,
    });

    if (localVideoRef.current)
      localVideoRef.current.srcObject = localStream.current;

    peerConnection.current = new RTCPeerConnection(servers);

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    peerConnection.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          toUserId: friend._id,
          candidate: event.candidate,
        });
      }
    };

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(incomingOffer)
    );

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.emit("answerCall", {
      toUserId: friend._id,
      answer,
    });

    startTimer();
  };

  // =============================
  // SOCKET LISTENERS
  // =============================
  useEffect(() => {
    socket.on("callAccepted", async ({ answer }) => {
      setIsRinging(false);
      setCallAccepted(true);

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      startTimer();
    });

    socket.on("iceCandidate", async ({ candidate }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    });

    socket.on("callEnded", () => {
      cleanup();
      onClose();
    });

    return () => {
      socket.off("callAccepted");
      socket.off("iceCandidate");
      socket.off("callEnded");
    };
  }, []);

  // =============================
  // TIMER
  // =============================
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

  // =============================
  // CLEANUP
  // =============================
  const cleanup = () => {
    clearInterval(timerRef.current);
    setCallTimer(0);
    setCallAccepted(false);
    setIsRinging(false);

    if (peerConnection.current) peerConnection.current.close();

    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
    }
  };

  const endCall = () => {
    socket.emit("endCall", { toUserId: friend._id });
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

      {/* Ringing UI */}
      {isRinging && !callAccepted && (
        <h2 className="text-xl mb-6">
          {incomingOffer ? "Incoming Call..." : "Calling..."}
        </h2>
      )}

      {/* Receiver Accept Button */}
      {incomingOffer && isRinging && !callAccepted && (
        <button
          onClick={acceptCall}
          className="bg-green-600 px-6 py-3 rounded-full mb-4"
        >
          Accept
        </button>
      )}

      {/* Active Call */}
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
