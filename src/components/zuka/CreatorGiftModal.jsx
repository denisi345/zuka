import React, { useState } from 'react';
import { X, Sparkles, EyeOff, Eye, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AMOUNTS = Array.of(500, 1000, 2000, 5000, 10000);
const PROVIDERS = ['M-Pesa', 'Mixx by Yas', 'Airtel Money', 'Visa / Mastercard', 'PayPal'];

export default function CreatorGiftModal({ post, currentUserId, isOwner, hideGifts, onTogglePrivacy, onSent, onClose }) {
  const [amount, setAmount] = useState(1000);
  const [provider, setProvider] = useState('M-Pesa');
  const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const handleSend = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 100 || sending) return;
    setSending(true);
    try {
            await supabase.from('creator_tips').insert({ post_id: String(post.id), sender_id: currentUserId || null, receiver_id: post.user_id, amount: Number(amount), provider, phone, message });
      setDone(true); onSent?.();
    } catch {}
    setSending(false);
  };
      setDone(true); onSent?.();
    } catch {}
    setSending(false);
  };
  return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 13800, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', backgroundColor: '#FFF', borderRadius: '18px 18px 0 0', padding: '16px' }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}><div style={{ fontWeight: 700, fontSize: "16px", display: "flex", alignItems: "center", gap: "6px" }}><Sparkles size={18} color="#F59E0B" /><span>Send Creator Gift</span></div><button type="button" onClick={onClose} style={{ border: "none", background: "#F0F2F5", borderRadius: "50%", width: "30px", height: "30px" }}><X size={16} /></button></div>
          <div style={{ fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={18} color="#F59E0B" /><span>Send Creator Gift</span></div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#F0F2F5', borderRadius: '50%', width: '30px', height: '30px' }}><X size={16} /></button>
        </div>
        {isOwner && (
          <button type="button" onClick={onTogglePrivacy} style={{ width: '100%', marginBottom: '12px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #FDE68A', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#92400E' }}>
            <span>{hideGifts ? '✨✨✨✨ Miamala Imefichwa (Gusa kuonyesha namba)' : 'Namba Zinaonekana (Gusa kuficha kwa ✨✨✨✨)'}</span>
            {hideGifts ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {isOwner && (
          <button type="button" onClick={onTogglePrivacy} style={{ width: '100%', marginBottom: '12px', padding: '10px', borderRadius: '10px', border: '1px solid #FDE68A', backgroundColor: '#FFFBEB', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#92400E' }}>
            <span>{hideGifts ? '✨✨✨✨ Hidden (Tap to show count)' : 'Public count (Tap to hide with ✨✨✨✨)'}</span>
            {hideGifts ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={42} color="#16A34A" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 700, fontSize: '16px' }}>Gift Sent Successfully!</div>
                        <button type="button" onClick={onClose} style={{ marginTop: "14px", width: "100%", padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#1877F2", color: "#FFF", fontWeight: 700 }}>Done</button></div>) : (
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>{AMOUNTS.map((v) => <button key={v} type="button" onClick={() => setAmount(v)} style={{ padding: "6px 12px", borderRadius: "999px", border: Number(amount) === v ? "1.5px solid #F59E0B" : "1px solid #CED0D4", backgroundColor: Number(amount) === v ? "#FEF3C7" : "#FFF", fontWeight: 600, fontSize: "13px" }}>{v.toLocaleString()}</button>)}</div>
              {AMOUNTS.map((v) => <button key={v} type="button" onClick={() => setAmount(v)} style={{ padding: '6px 12px', borderRadius: '999px', border: Number(amount) === v ? '1.5px solid #F59E0B' : '1px solid #CED0D4', backgroundColor: Number(amount) === v ? '#FEF3C7' : '#FFF', fontWeight: 600, fontSize: '13px' }}>{v.toLocaleString()}</button>)}
            </div>
                        <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Custom amount" style={{ padding: "10px", borderRadius: "10px", border: "1px solid #CED0D4" }} />
                        <select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ padding: "10px", borderRadius: "10px", border: "1px solid #CED0D4", backgroundColor: "#FFF" }}>{PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
                        <select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ padding: "10px", borderRadius: "10px", border: "1px solid #CED0D4", backgroundColor: "#FFF" }}>{PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone or Account Email" style={{ padding: "10px", borderRadius: "10px", border: "1px solid #CED0D4" }} />
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a note (optional)" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #CED0D4' }} />
                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone or Account Email" style={{ padding: "10px", borderRadius: "10px", border: "1px solid #CED0D4" }} />
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a note (optional)" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #CED0D4' }} />
            <button type="submit" disabled={sending} style={{ padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#F59E0B', color: '#FFF', fontWeight: 700 }}>{sending ? 'Sending...' : 'Send Gift ✨'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Note (optional)" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #CED0D4' }} />
            <button type="submit" disabled={sending} style={{ padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#F59E0B', color: '#FFF', fontWeight: 700 }}>{sending ? 'Sending...' : 'Send Gift ✨'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
