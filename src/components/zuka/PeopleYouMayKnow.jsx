import React, { useEffect, useState } from "react";
import { UserPlus, UserCheck, X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ZukaBadge from "./ZukaBadge";

export default function PeopleYouMayKnow({ userProfile, onOpenUserProfile }) {
  const [candidates, setCandidates] = useState([]);
  const [pendingMap, setPendingMap] = useState({});
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("zuka_pymk_dismissed") || "[]"); } catch (_) { return []; }
  });
  useEffect(() => {
    if (!userProfile?.id) return;
    let alive = true;
    (async () => {
      try {
        const [{ data: profs }, { data: allRels }] = await Promise.all([
          supabase.from("profiles").select("id, username, full_name, avatar_url, verified, is_verified, verified_badge").limit(40),
          supabase.from("friendships").select("id, requester_id, addressee_id, status").limit(500)
        ]);
        if (!alive || !Array.isArray(profs)) return;
        const myId = String(userProfile.id);
        const rels = Array.isArray(allRels) ? allRels : [];
        const myFriendIds = new Set();
        const excludeIds = new Set([myId, ...dismissed.map(String)]);
        const initialPending = {};
        for (const r of rels) {
          const req = String(r.requester_id), add = String(r.addressee_id);
          if (r.status === "accepted") {
            if (req === myId) { myFriendIds.add(add); excludeIds.add(add); }
            if (add === myId) { myFriendIds.add(req); excludeIds.add(req); }
          } else if (r.status === "pending") {
            if (req === myId) initialPending[add] = r.id;
            if (add === myId) excludeIds.add(req);
          }
        }
        const friendsOfMap = {};
        for (const r of rels) {
          if (r.status !== "accepted") continue;
          const a = String(r.requester_id), b = String(r.addressee_id);
          (friendsOfMap[a] = friendsOfMap[a] || new Set()).add(b);
          (friendsOfMap[b] = friendsOfMap[b] || new Set()).add(a);
        }
        const list = [...profs].sort((a, b) => Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned)))
          .filter((p) => p?.id && !excludeIds.has(String(p.id)) && (p.full_name || p.username))
          .map((p) => {
            const tf = friendsOfMap[String(p.id)] || new Set();
            let mutual = 0;
            for (const fid of myFriendIds) if (tf.has(fid)) mutual++;
            return { ...p, mutualCount: mutual };
          })
          .sort((a, b) => b.mutualCount - a.mutualCount)
          .slice(0, 15);
        setPendingMap(initialPending);
        setCandidates(list);
      } catch (_) {}
    })();
    return () => { alive = false; };
  }, [userProfile?.id]);

  const visible = candidates.filter((c) => !dismissed.includes(String(c.id)));
  if (!userProfile?.id || visible.length === 0) return null;

  async function toggleRequest(person) {
    const pid = String(person.id), existingRelId = pendingMap[pid];
    if (existingRelId) {
      setPendingMap((prev) => { const n = { ...prev }; delete n[pid]; return n; });
      if (!String(existingRelId).startsWith("tmp-")) await supabase.from("friendships").delete().eq("id", existingRelId);
      return;
    }
    const tmpId = "tmp-" + Date.now();
    setPendingMap((prev) => ({ ...prev, [pid]: tmpId }));
    const { data } = await supabase.from("friendships").insert({ requester_id: userProfile.id, addressee_id: person.id, status: "pending" }).select().single();
    if (data?.id) setPendingMap((prev) => ({ ...prev, [pid]: data.id }));
  }

  function dismissPerson(id) {
    const next = [...dismissed, String(id)];
    setDismissed(next);
    try { localStorage.setItem("zuka_pymk_dismissed", JSON.stringify(next)); } catch (_) {}
  }
  return (
    <div style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid #E4E6EB", borderBottom: "1px solid #E4E6EB", margin: "8px 0", padding: "12px 0 6px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px 10px" }}>
        <span style={{ fontSize: "17px", fontWeight: 700, color: "#050505" }}>People You May Know</span>
      </div>
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "0 14px 8px", scrollbarWidth: "none" }}>
        {visible.map((person) => {
          const name = person.full_name || person.username || "ZUKA User";
          const isSent = Boolean(pendingMap[String(person.id)]);
          const isVerified = Boolean(person.verified || person.is_verified || person.verified_badge);
          return (
            <div key={person.id} style={{ width: "205px", minWidth: "205px", borderRadius: "10px", border: "1px solid #CED0D4", backgroundColor: "#FFFFFF", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "relative", width: "100%", height: "205px", backgroundColor: "#E4E6EB", cursor: "pointer" }} onClick={() => onOpenUserProfile && onOpenUserProfile(person.id)}>
                {person.avatar_url ? (
                  <img src={person.avatar_url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "52px", fontWeight: 700, color: "#1877F2", backgroundColor: "#E7F3FF" }}>{name.charAt(0).toUpperCase()}</div>
                )}
                <button type="button" onClick={(e) => { e.stopPropagation(); dismissPerson(person.id); }} aria-label="Dismiss" style={{ position: "absolute", top: "8px", right: "8px", width: "30px", height: "30px", borderRadius: "50%", border: "none", backgroundColor: "rgba(0,0,0,0.48)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} /></button>
              </div>
              <div style={{ padding: "10px 10px 12px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", gap: "8px" }}>
                <div>
                  <div onClick={() => onOpenUserProfile && onOpenUserProfile(person.id)} style={{ fontSize: "16px", fontWeight: 700, color: "#050505", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
                    {isVerified && <ZukaBadge size={14} />}
                  </div>
                  {person.mutualCount > 0 && <div style={{ fontSize: "13px", color: "#65676B", marginTop: "2px" }}>{person.mutualCount} mutual {person.mutualCount === 1 ? "friend" : "friends"}</div>}
                </div>
                <button type="button" onClick={() => toggleRequest(person)} style={{ width: "100%", height: "36px", borderRadius: "6px", border: "none", backgroundColor: isSent ? "#E4E6EB" : "#E7F3FF", color: isSent ? "#050505" : "#1877F2", fontSize: "15px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}>
                  {isSent ? <><UserCheck size={16} /> Cancel request</> : <><UserPlus size={16} /> Add friend</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("zuka:navigate-tab", { detail: "friends" }))} style={{ width: "100%", border: "none", backgroundColor: "transparent", padding: "8px 0 4px", fontSize: "15px", fontWeight: 600, color: "#65676B", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer" }}>
        <span>See all</span><ChevronRight size={16} />
      </button>
    </div>
  );
}
