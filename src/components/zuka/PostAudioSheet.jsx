import React, { useState } from 'react';
import { Music, AlertCircle, ChevronRight, Play, Pause } from 'lucide-react';

export default function PostAudioSheet({ audio, authorName, playing, onTogglePlay, onClose, onReport }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!audio) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 75, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#F0F2F5', width: '100%', maxWidth: '680px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '10px 14px 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ width: '40px', height: '4px', backgroundColor: '#CED0D4', borderRadius: '2px', margin: '0 auto 2px' }} />

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '10px', backgroundColor: '#1877F2', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Music size={24} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#050505', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{audio.title}</div>
              <div style={{ fontSize: '13px', color: '#65676B', marginTop: '2px' }}>Original audio · {authorName}</div>
            </div>
          </div>
          <button type="button" onClick={onTogglePlay} style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#E7F3FF', color: '#1877F2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden' }}>
          <button type="button" onClick={() => setDetailsOpen(!detailsOpen)} style={{ width: '100%', padding: '14px', background: 'none', border: 'none', borderBottom: '1px solid #F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#050505', fontWeight: 600, fontSize: '15px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Music size={20} /> View audio details</span>
            <ChevronRight size={18} color="#65676B" />
          </button>
          {detailsOpen && (
            <div style={{ padding: '10px 14px', backgroundColor: '#F7F8FA', fontSize: '13px', color: '#65676B', borderBottom: '1px solid #F0F2F5' }}>
              Track: <strong>{audio.title}</strong> · Uploaded by <strong>{authorName}</strong>
            </div>
          )}
          <button type="button" onClick={() => { onClose(); if (onReport) onReport(); }} style={{ width: '100%', padding: '14px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#050505', fontWeight: 600, fontSize: '15px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><AlertCircle size={20} /> Report audio</span>
            <ChevronRight size={18} color="#65676B" />
          </button>
        </div>
      </div>
    </div>
  );
}
