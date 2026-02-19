import React, { useEffect, useRef, useState } from "react";
import { getSocket } from "../socket";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // public STUN
  ],
};

const VideoCall = ({ currentUserId, remoteUserId, onClose }) => {
  const socket = getSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);

  const [incomingCall, setIncomingCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);

  // =============================
  // 📹 Initialize Media
  // =============================
  const initMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localVideoRef.current.srcObject = stream;

    peerConnection.current = new RTCPeerConnection(configuration);

    stream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, stream);
    });

    peerConnection.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          toUserId: remoteUserId,
          candidate: event.candidate,
        });
      }
    };
  };

  // =============================
  // 📞 Start Call (Caller)
  // =============================
  const startCall = async () => {
    await initMedia();

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("callUser", {
      toUserId: remoteUserId,
      offer,
      callType: "video",
    });
  };

  // =============================
  // 📲 Accept Call (Receiver)
  // =============================
  const acceptCall = async () => {
    await initMedia();

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(incomingCall.offer)
    );

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.emit("answerCall", {
      toUserId: incomingCall.fromUserId,
      answer,
    });

    setCallAccepted(true);
  };

  // =============================
  // 🔚 End Call
  // =============================
  const endCall = () => {
    socket.emit("endCall", { toUserId: remoteUserId });

    peerConnection.current?.close();
    peerConnection.current = null;

    localVideoRef.current.srcObject?.getTracks().forEach((t) => t.stop());

    onClose();
  };

  // =============================
  // 🎧 Socket Listeners
  // =============================
  useEffect(() => {
    if (!socket) return;

    socket.on("incomingCall", (data) => {
      setIncomingCall(data);
    });

    socket.on("callAnswered", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      setCallAccepted(true);
    });

    socket.on("iceCandidate", async ({ candidate }) => {
      try {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (err) {
        console.error("ICE error:", err);
      }
    });

    socket.on("callEnded", () => {
      endCall();
    });

    return () => {
      socket.off("incomingCall");
      socket.off("callAnswered");
      socket.off("iceCandidate");
      socket.off("callEnded");
    };
  }, [socket]);

  // =============================
  // UI
  // =============================
  return (
    <div className="video-call-container">
      <div className="videos">
        <video ref={localVideoRef} autoPlay muted playsInline />
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>

      {!incomingCall && !callAccepted && (
        <button onClick={startCall}>Start Call</button>
      )}

      {incomingCall && !callAccepted && (
        <button onClick={acceptCall}>Accept Call</button>
      )}

      <button onClick={endCall}>End Call</button>
    </div>
  );
};

export default VideoCall;
