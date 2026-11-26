import MarketplaceOrdersEscrow from "./MarketplaceOrdersEscrow";
import SellerPayoutSettings from "./SellerPayoutSettings";
import MarketplaceCheckoutAndControl from './MarketplaceCheckoutAndControl';
import ZukaBadge from './ZukaBadge';
import React, { useEffect, useState } from 'react';
import { Search, Plus, Bookmark, Share2, X, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CATEGORIES = [
  'All', 'Vehicles', 'Property Rentals', 'Electronics', 'Clothing & Shoes',
  'Home & Garden', 'Furniture', 'Phones & Accessories', 'Sports & Outdoors', 'Free Stuff', 'Services', 'Jobs'
];
const CONDITIONS = ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'];

export default function Marketplace({ userProfile, onMessageSeller, onOpenUserProfile }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableName, setTableName] = useState('marketplace_listings');
  const [viewTab, setViewTab] = useState('browse');
  const [savedIds, setSavedIds] = useState(() => JSON.parse(localStorage.getItem('zuka_mp_saved') || '[]'));
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [inquiryText, setInquiryText] = useState('Hi, is this still available?');
  const [sellOpen, setSellOpen] = useState(false); const [ctrlOpen, setCtrlOpen] = useState(false); const [ctrlItem, setCtrlItem] = useState(null);
  const [boostItem, setBoostItem] = useState(null);
  const [boostDays, setBoostDays] = useState(7);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState('image');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', price: '', currency: 'TZS', category: 'Electronics',
    condition: 'New', location: '', imageUrl: '', description: '', file: null
  });

  useEffect(() => { loadListings(); }, []);

  async function loadListings() {
    setLoading(true);
    let activeTbl = 'marketplace_listings';
    for (const tbl of ['marketplace_listings', 'marketplace_items']) {
      const { error } = await supabase.from(tbl).select('id').limit(1);
      if (!error) { activeTbl = tbl; break; }
    }
    setTableName(activeTbl);
    const { data, error } = await supabase.from(activeTbl).select('*').order('created_at', { ascending: false }).limit(80);
    setListings(!error && Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function toggleSave(id) {
    const sid = String(id);
    const next = savedIds.includes(sid) ? savedIds.filter((x) => x !== sid) : [...savedIds, sid];
    setSavedIds(next);
    localStorage.setItem('zuka_mp_saved', JSON.stringify(next));
  }

  async function handleMarkSold(item) {
    await supabase.from(tableName).update({ status: 'sold' }).eq('id', item.id);
    setListings((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: 'sold' } : x)));
    setSelectedItem((prev) => (prev ? { ...prev, status: 'sold' } : null));
  }

  async function handleDelete(item) {
    await supabase.from(tableName).delete().eq('id', item.id);
    setListings((prev) => prev.filter((x) => x.id !== item.id));
    setSelectedItem(null);
  }

  async function handleSendInquiry() {
    if (!selectedItem || !inquiryText.trim()) return;
    const msg = `[Marketplace: ${selectedItem.title}] ${inquiryText.trim()}`;
    if (userProfile?.id && (selectedItem.user_id || selectedItem.seller_id)) {
      await supabase.from('messages').insert({
        sender_id: userProfile.id,
        receiver_id: selectedItem.user_id || selectedItem.seller_id,
        content: msg
      });
    }
    const sellerId = selectedItem.user_id || selectedItem.seller_id;
    const sellerName = selectedItem.seller_name || 'ZUKA Seller';
    setSelectedItem(null);
    if (onMessageSeller) onMessageSeller(sellerId, sellerName, msg);
  }

  async function handleCreateListing(e) {
    e.preventDefault();
    setSubmitting(true);
    let finalImage = form.imageUrl.trim();
    if (form.file) {
      const cleanName = form.file.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const path = `marketplace/${Date.now()}_${cleanName}`;
      for (const bucket of ['media', 'marketplace', 'public']) {
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, form.file);
        if (!upErr) {
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          if (pub?.publicUrl) { finalImage = pub.publicUrl; break; }
        }
      }
    }
    const payload = {
      title: form.title.trim(), price: Number(form.price || 0), currency: form.currency,
      category: form.category, condition: form.condition, location: form.location.trim(),
      description: form.description.trim(), image_url: finalImage, status: 'active',
      seller_name: userProfile?.full_name || userProfile?.username || 'ZUKA Member'
    };
    if (userProfile?.id) payload.user_id = userProfile.id;
    const { data, error } = await supabase.from(tableName).insert(payload).select().single();
    if (!error && data) {
      setListings((prev) => [data, ...prev]);
    } else {
      setListings((prev) => [{ id: `local-${Date.now()}`, ...payload, created_at: new Date().toISOString() }, ...prev]);
    }
    setSubmitting(false);
    setSellOpen(false);
    setPreviewUrl('');
    setForm({ title: '', price: '', currency: 'TZS', category: 'Electronics', condition: 'New', location: '', imageUrl: '', description: '', file: null });
  }

  const filtered = listings
    .filter((item) => viewTab === 'saved' ? savedIds.includes(String(item.id)) : viewTab === 'selling' ? (userProfile?.id && String(item.user_id || item.seller_id) === String(userProfile.id)) : true)
    .filter((item) => (category === 'All' ? true : item.category === category))
    .filter((item) => (condition === 'All' ? true : item.condition === condition))
    .filter((item) => (minPrice !== '' ? Number(item.price || 0) >= Number(minPrice) : true))
    .filter((item) => (maxPrice !== '' ? Number(item.price || 0) <= Number(maxPrice) : true))
    .filter((item) => !search.trim() || (item.title || '').toLowerCase().includes(search.toLowerCase()) || (item.location || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'price_asc' ? Number(a.price || 0) - Number(b.price || 0) : sortBy === 'price_desc' ? Number(b.price || 0) - Number(a.price || 0) : new Date(b.created_at || 0) - new Date(a.created_at || 0));

  return (
    <div style={{ padding: '12px 10px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Marketplace</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => setSellOpen(true)} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '18px', padding: '8px 14px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <Plus size={16} /> Sell
          </button>
          <button type="button" onClick={() => setShowFilters(!showFilters)} style={{ backgroundColor: '#E4E6EB', color: '#050505', border: 'none', borderRadius: '18px', padding: '8px 12px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <SlidersHorizontal size={16} /> Filters</button><button type="button" onClick={() => { setCtrlItem(null); setCtrlOpen(true); }} style={{ backgroundColor: '#E7F3FF', color: '#1877F2', border: 'none', borderRadius: '18px', padding: '8px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Orders & Payout
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#65676B' }} />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Marketplace" style={{ width: '100%', height: '38px', borderRadius: '20px', border: 'none', backgroundColor: '#FFFFFF', paddingLeft: '36px', paddingRight: '14px', fontSize: '15px', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }} />
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }}>
        {[{ id: 'browse', label: 'Browse all' }, { id: 'saved', label: `Saved (${savedIds.length})` }, { id: 'selling', label: 'Your listings' }].map((t) => (
          <button key={t.id} type="button" onClick={() => setViewTab(t.id)} style={{ padding: '6px 14px', borderRadius: '18px', border: 'none', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', backgroundColor: viewTab === t.id ? '#E7F3FF' : '#E4E6EB', color: viewTab === t.id ? '#1877F2' : '#050505' }}>
            {t.label}
          </button>
        ))}
      </div>
      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px' }}>
        {CATEGORIES.map((cat) => (
          <button key={cat} type="button" onClick={() => setCategory(cat)} style={{ padding: '6px 12px', borderRadius: '16px', border: 'none', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', backgroundColor: category === cat ? '#1877F2' : '#FFFFFF', color: category === cat ? '#FFFFFF' : '#050505' }}>
            {cat}
          </button>
        ))}
      </div>

      {showFilters && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '12px', marginBottom: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }}>
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }}>
            <option value="All">Condition: All</option>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" placeholder="Min price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
          <input type="number" placeholder="Max price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
        </div>
      )}

      {viewTab === "selling" && <div className="mb-4"><SellerPayoutSettings user={userProfile} /><div className="mt-3"><MarketplaceOrdersEscrow userId={userProfile?.id} /></div></div>}
      {loading ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#65676B' }}>Loading Marketplace...</div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '32px 16px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>No listings found</h3>
          <p style={{ fontSize: '14px', color: '#65676B', marginBottom: '14px' }}>List an item for sale on ZUKA Marketplace.</p>
          <button type="button" onClick={() => setSellOpen(true)} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '9px 16px', fontWeight: 600, cursor: 'pointer' }}>+ Create new listing</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {[...filtered].sort((a, b) => Number(Boolean(b.is_boosted)) - Number(Boolean(a.is_boosted))).map((item) => (
            <div key={item.id} onClick={() => setSelectedItem(item)} style={{ cursor: 'pointer' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#E4E6EB' }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#65676B', fontSize: '13px', fontWeight: 600 }}>ZUKA Item</div>
                )}
                {item.status === 'sold' ? <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: '#E41E3F', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, padding: '3px 7px', borderRadius: '4px' }}>SOLD</span> : item.is_boosted && <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(24,119,242,0.92)', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, padding: '3px 7px', borderRadius: '4px' }}>Sponsored</span>}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, marginTop: '6px', lineHeight: 1.2 }}>{Number(item.price || 0) === 0 ? 'Free' : `${item.currency || 'TZS'} ${Number(item.price).toLocaleString()}`}</div>
              <div style={{ fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{item.title}</div>
              <div style={{ fontSize: '13px', color: '#65676B' }}>{item.location}</div>
            </div>
          ))}
        </div>
      )}
      {selectedItem && (
        <div onClick={() => setSelectedItem(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '90dvh', overflowY: 'auto', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E6EB', paddingBottom: '10px', marginBottom: '12px' }}>
              <strong>{selectedItem.title}</strong>
              <button type="button" onClick={() => setSelectedItem(null)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E4E6EB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            {selectedItem.image_url && <img src={selectedItem.image_url} alt={selectedItem.title} style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />}
            <div style={{ fontSize: '22px', fontWeight: 700 }}>{Number(selectedItem.price || 0) === 0 ? 'Free' : `${selectedItem.currency || 'TZS'} ${Number(selectedItem.price).toLocaleString()}`}</div>
            <div style={{ fontSize: '13px', color: '#65676B', marginTop: '4px' }}>{selectedItem.category} &middot; {selectedItem.condition} &middot; {selectedItem.location}</div>
            <p style={{ fontSize: '15px', margin: '12px 0', lineHeight: 1.45 }}>{selectedItem.description || 'No description provided.'}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <button type="button" onClick={() => toggleSave(selectedItem.id)} style={{ backgroundColor: '#E4E6EB', border: 'none', borderRadius: '8px', padding: '8px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><Bookmark size={16} /> {savedIds.includes(String(selectedItem.id)) ? 'Saved' : 'Save'}</button>
              <button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)} style={{ backgroundColor: '#E4E6EB', border: 'none', borderRadius: '8px', padding: '8px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><Share2 size={16} /> Share</button>
  <button type="button" onClick={()=>{setCtrlItem(selectedItem);setSelectedItem(null);setCtrlOpen(true)}} className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold">Buy Now</button>
              {userProfile?.id && String(selectedItem.user_id || selectedItem.seller_id) === String(userProfile.id) && (
                <>
                  {selectedItem.status !== 'sold' && <button type="button" onClick={() => handleMarkSold(selectedItem)} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 12px', fontWeight: 600, cursor: 'pointer' }}>Mark as Sold</button>}
                  <button type="button" onClick={() => handleDelete(selectedItem)} style={{ backgroundColor: '#FFEBE9', color: '#E41E3F', border: 'none', borderRadius: '8px', padding: '8px 12px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                </>
              )}
            </div>
            <div style={{ backgroundColor: '#F0F2F5', padding: '12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}><span onClick={() => { const sid = selectedItem.user_id || selectedItem.seller_id; if (sid && onOpenUserProfile) { setSelectedItem(null); onOpenUserProfile(sid, selectedItem.seller_name); } }} style={{ cursor: 'pointer', color: '#1877F2' }}>Seller: {selectedItem.seller_name || 'ZUKA Member'}</span>{selectedItem.seller_verified && <ZukaBadge size={13} />}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={inquiryText} onChange={(e) => setInquiryText(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
                <button type="button" onClick={handleSendInquiry} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 14px', fontWeight: 600, cursor: 'pointer' }}>Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
{boostItem && (<div onClick={() => setBoostItem(null)} style={{ position: "fixed", inset: 0, zIndex: 70, backgroundColor: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}><div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#FFF", borderRadius: "12px", width: "100%", maxWidth: "400px", padding: "18px" }}><h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700 }}>🚀 Boost Listing</h3><p style={{ margin: "0 0 12px", fontSize: "13px", color: "#65676B" }}>Promote <strong>{boostItem.title}</strong></p><div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>{[3,7,14].map((d) => (<button key={d} type="button" onClick={() => setBoostDays(d)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: boostDays === d ? "2px solid #1877F2" : "1px solid #CED0D4", backgroundColor: boostDays === d ? "#E7F3FF" : "#FFF", fontWeight: 700 }}>{d}d<br/><span style={{ fontSize: "11px" }}>TZS {(d*3000).toLocaleString()}</span></button>))}</div><div style={{ display: "flex", gap: "8px" }}><button type="button" onClick={() => setBoostItem(null)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#E4E6EB", fontWeight: 600 }}>Cancel</button><button type="button" onClick={async () => { try { await supabase.from(tableName).update({ is_boosted: true, boost_expires_at: new Date(Date.now() + boostDays * 86400000).toISOString() }).eq("id", boostItem.id); } catch (_) {} setCtrlItem({ id: "boost-" + boostItem.id, title: "Boost (" + boostDays + "d): " + boostItem.title, price: boostDays * 3000, currency: "TZS", seller_id: "zuka-ads" }); setBoostItem(null); setCtrlOpen(true); }} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#1877F2", color: "#FFF", fontWeight: 700 }}>Pay & Boost</button></div></div></div>)}
      {ctrlOpen && <MarketplaceCheckoutAndControl user={userProfile} item={ctrlItem} onClose={()=>setCtrlOpen(false)} />}
      {sellOpen && (
        <div onClick={() => setSellOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '520px', maxHeight: '90dvh', overflowY: 'auto', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E6EB', paddingBottom: '10px', marginBottom: '12px' }}>
              <strong>Create New Listing</strong>
              <button type="button" onClick={() => setSellOpen(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E4E6EB', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateListing} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" placeholder="Price (0 for Free)" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }}>
                  <option value="TZS">TZS</option>
<option value="USD">USD</option>
<option value="EUR">EUR</option>
<option value="GBP">GBP</option>
<option value="KES">KES</option>
<option value="UGX">UGX</option>
<option value="ZAR">ZAR</option>
<option value="NGN">NGN</option>
<option value="AED">AED</option>
<option value="CAD">CAD</option>
<option value="AUD">AUD</option>
<option value="INR">INR</option>
<option value="CNY">CNY</option>
                </select>
              </div>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }}>
                {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="text" placeholder="Location" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
              <input type="file" accept="image/*,video/*" onChange={(e) => { const f = e.target.files?.[0] || null; setForm({ ...form, file: f }); setPreviewUrl(f ? URL.createObjectURL(f) : ""); setPreviewType(f && f.type.startsWith("video") ? "video" : "image"); }} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #CCD0D5", fontSize: "14px" }} />
              {(previewUrl || form.imageUrl?.trim()) && (
                <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: "1px solid #CED0D4", backgroundColor: "#F0F2F5" }}>
                  {(previewType === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(previewUrl || form.imageUrl)) ? <video src={previewUrl || form.imageUrl} controls playsInline style={{ width: "100%", maxHeight: "220px", objectFit: "cover", display: "block" }} /> : <img src={previewUrl || form.imageUrl} alt="Listing Preview" style={{ width: "100%", maxHeight: "220px", objectFit: "cover", display: "block" }} />}
                  <button type="button" onClick={() => { setPreviewUrl(''); setForm({ ...form, file: null, imageUrl: '' }); }} style={{ position: "absolute", top: "8px", right: "8px", width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.7)", color: "#FFFFFF", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} /></button>
                </div>
              )}
              <input type="url" placeholder="Image URL (optional)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
              <textarea rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CED0D4', fontSize: '14px' }} />
              <button type="submit" disabled={submitting} style={{ backgroundColor: '#1877F2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>{submitting ? 'Publishing...' : 'Publish Listing'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
