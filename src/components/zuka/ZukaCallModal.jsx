import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:://google.com' },
    { urls: 'stun:://google.com' }
  ]
};

export default function ZukaCallModal({ currentUser, peer, mode = 'audio', incomingOffer = null, onClose }) {
  const [status, setStatus] = useState(incomingOffer ? 'Incoming call...' : 'Calling...');
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(mode !== 'video');
  const [connected, setConnected] = useState(false);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const channelRef = useRef(null);

  const peerName = peer?.full_name || peer?.username || 'ZUKA Member';
  const roomId = [String(currentUser?.id || 'a'), String(peer?.id || 'b')].sort().join('_');

  useEffect(() => {
    let active = true;
    const ch = supabase.channel(`webrtc-room-${roomId}`);
    channelRef.current = ch;

    ch.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      if (!active || !payload || String(payload.from) === String(currentUser?.id)) return;
      const pc = pcRef.current;
      if (payload.type === 'answer' && pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        setStatus('Connected');
        setConnected(true);
      } else if (payload.type === 'candidate' && pc && payload.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch (_) {}
      } else if (payload.type === 'end') {
        cleanup();
        onClose();
      }
    }).subscribe(async (st) => {
      if (st === 'SUBSCRIBED' && !incomingOffer) {
        await startCallAsCaller();
      }
    });

    return () => {
      active = false;
      cleanup();
    };
  }, []);

  function cleanup() {
    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    } catch (_) {}
  }

  async function setupPeerConnection() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === 'video'
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams.at(0)) {
        remoteVideoRef.current.srcObject = e.streams.at(0);
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'candidate', from: currentUser?.id, candidate: e.candidate }
        });
      }
    };
    return pc;
  }

  async function startCallAsCaller() {
    try {
      const pc = await setupPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'offer', from: currentUser?.id, sdp: offer }
      });
      const ringCh = supabase.channel(`ring-${peer.id}`);
      ringCh.subscribe((s) => {
        if (s === 'SUBSCRIBED') {
          ringCh.send({
            type: 'broadcast',
            event: 'incoming-call',
            payload: {
              caller: { id: currentUser?.id, full_name: currentUser?.full_name || currentUser?.username, avatar_url: currentUser?.avatar_url },
              mode,
              offer
            }
          });
          setTimeout(() => supabase.removeChannel(ringCh), 2000);
        }
      });
    } catch (_) {
      setStatus('Microphone/Camera permission needed');
    }
  }

  async function handleAcceptIncoming() {
    try {
      setStatus('Connecting...');
      const pc = await setupPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'answer', from: currentUser?.id, sdp: answer }
      });
      setStatus('Connected');
      setConnected(true);
    } catch (_) {
      setStatus('Could not connect call');
    }
  }

  function handleEndCall() {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type: 'end', from: currentUser?.id }
    });
    cleanup();
    onClose();
  }
  function toggleMic() {
    const next = !micMuted;
    setMicMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !next; });
  }

  function toggleCam() {
    const next = !camOff;
    setCamOff(next);
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !next; });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 95, backgroundColor: '#18191A', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '28px 18px 36px' }}>
      {mode === 'video' && (
        <video ref={remoteVideoRef} autoPlay playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
      )}
      {mode === 'video' && (
        <video ref={localVideoRef} autoPlay muted playsInline style={{ position: 'absolute', top: '20px', right: '16px', width: '104px', height: '148px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #FFFFFF', zIndex: 3, backgroundColor: '#000000' }} />
      )}
      {mode !== 'video' && <audio ref={remoteVideoRef} autoPlay />}

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '36px', textShadow: '0 2px 8px rgba(0,0,0,0.75)' }}>
        <div style={{ width: '92px', height: '92px', borderRadius: '50%', backgroundColor: '#1877F2', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 800, border: '3px solid rgba(255,255,255,0.35)', marginBottom: '14px' }}>
          {peer?.avatar_url ? <img src={peer.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : peerName.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 800 }}>{peerName}</div>
        <div style={{ fontSize: '14px', color: '#B0B3B8', marginTop: '4px' }}>{status}</div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        {incomingOffer && !connected ? (
          <>
            <button type="button" onClick={handleEndCall} style={{ width: '62px', height: '62px', borderRadius: '50%', backgroundColor: '#E41E3F', border: 'none', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PhoneOff size={28} />
            </button>
            <button type="button" onClick={handleAcceptIncoming} style={{ width: '62px', height: '62px', borderRadius: '50%', backgroundColor: '#31A24C', border: 'none', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Phone size={28} />
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={toggleMic} style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: micMuted ? '#FFFFFF' : 'rgba(255,255,255,0.2)', border: 'none', color: micMuted ? '#050505' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {micMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            {mode === 'video' && (
              <button type="button" onClick={toggleCam} style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: camOff ? '#FFFFFF' : 'rgba(255,255,255,0.2)', border: 'none', color: camOff ? '#050505' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {camOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>
            )}
            <button type="button" onClick={handleEndCall} style={{ width: '62px', height: '62px', borderRadius: '50%', backgroundColor: '#E41E3F', border: 'none', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PhoneOff size={28} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
