import { useEffect, useRef, useState } from "react";
import socket from "../utils/socket";

export default function CallModal({
  user,
  friend,
  callType,
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
  const [incomingCall, setIncomingCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // =============================
  // OUTGOING CALL
  // =============================
  useEffect(() => {
    if (!isOpen) return;

    startOutgoingCall();

    return () => cleanup();
  }, [isOpen]);

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
  // SOCKET LISTENERS
  // =============================
  useEffect(() => {
    socket.on("incomingCall", ({ fromUserId, offer, callType }) => {
      setIncomingCall({ fromUserId, offer, callType });
      setIsRinging(true);

      if (ringtoneRef.current) {
        ringtoneRef.current.play();
      }
    });

    socket.on("callAnswered", async ({ answer }) => {
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
      socket.off("incomingCall");
      socket.off("callAnswered");
      socket.off("iceCandidate");
      socket.off("callEnded");
    };
  }, []);

  // =============================
  // ACCEPT CALL
  // =============================
  const acceptCall = async () => {
    setCallAccepted(true);
    setIsRinging(false);

    if (ringtoneRef.current) ringtoneRef.current.pause();

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: incomingCall.callType === "video",
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
          toUserId: incomingCall.fromUserId,
          candidate: event.candidate,
        });
      }
    };

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(incomingCall.offer)
    );

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.emit("answerCall", {
      toUserId: incomingCall.fromUserId,
      answer,
    });

    startTimer();
  };

  // =============================
  // REJECT CALL
  // =============================
  const rejectCall = () => {
    socket.emit("endCall", { toUserId: incomingCall.fromUserId });
    cleanup();
    onClose();
  };

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
    setIncomingCall(null);
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

  if (!isOpen && !incomingCall) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-50">
      
      {/* 🔔 Ring Sound */}
      <audio
        ref={ringtoneRef}
        src="https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg"
        loop
      />

      {/* Incoming Call UI */}
      {incomingCall && !callAccepted && (
        <>
          <h2 className="text-xl mb-6">Incoming {incomingCall.callType} Call</h2>

          <div className="flex gap-6">
            <button
              onClick={acceptCall}
              className="bg-green-600 px-6 py-3 rounded-full"
            >
              Accept
            </button>

            <button
              onClick={rejectCall}
              className="bg-red-600 px-6 py-3 rounded-full"
            >
              Reject
            </button>
          </div>
        </>
      )}

      {/* Active Call UI */}
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

      {/* Outgoing Ring UI */}
      {isRinging && !incomingCall && !callAccepted && (
        <h2 className="text-xl">Calling...</h2>
      )}
    </div>
  );
}
