"use client";

import { useState, useEffect, useMemo } from "react";
import { useIdentity } from "../../lib/IdentityContext";
import { saySigned } from "../../lib/technocore";
import { loadHistory, appendHistory } from "../../lib/storage";
import ProofCard from "../../components/ProofCard";

const CHECKIN_TEXT = "Active Technocore creator — periodic presence check-in from the Creator Portal.";

function computeStreak(history) {
  const checkins = history.filter((h) => h.kind === "checkin").map((h) => new Date(h.ts || h.createdAt).toDateString());
  const uniqueDays = [...new Set(checkins)];
  let streak = 0;
  let cursor = new Date();
  for (;;) {
    const dayStr = cursor.toDateString();
    if (uniqueDays.includes(dayStr)) { streak += 1; cursor.setDate(cursor.getDate() - 1); } else break;
  }
  return streak;
}

export default function CheckinPage() {
  const { hasStoredIdentity, unlocked, unlock, secretKey, did } = useIdentity();
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastCheckin, setLastCheckin] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const h = loadHistory();
    setHistory(h);
    const lastCi = h.find((e) => e.kind === "checkin");
    if (lastCi) setLastCheckin(lastCi);
  }, []);

  const streak = useMemo(() => computeStreak(history), [history]);
  const alreadyToday = lastCheckin && new Date(lastCheckin.ts || lastCheckin.createdAt).toDateString() === new Date().toDateString();

  async function handleCheckin() {
    setError(""); setBusy(true);
    try {
      let key = secretKey; let activeDid = did;
      if (!unlocked) { const res = await unlock(passphrase); key = res.secretKey; activeDid = res.did; }
      const result = await saySigned({ secretKey: key, did: activeDid, room: "lobby", text: CHECKIN_TEXT });
      const p = result.posted || {};
      const entry = {
        kind: "checkin", room: result.room || "lobby",
        seq: p.seq ?? null,
        did: p.from || activeDid,
        nonce: p.nonce ?? result.fallbackNonce,
        ts: p.ts || new Date().toISOString(),
        text: p.text || CHECKIN_TEXT,
        raw: result.raw,
        createdAt: Date.now(),
      };
      const newHistory = appendHistory(entry);
      setHistory(newHistory); setLastCheckin(entry);
    } catch (e) { setError("Check-in gagal: " + e.message); } finally { setBusy(false); }
  }

  if (!hasStoredIdentity) {
    return (<div className="empty"><p>Kamu belum punya identitas.</p><p className="muted">Buka tab Mulai untuk membuat identitas dulu.</p></div>);
  }

  return (
    <div>
      <h1>Check-in Harian</h1>
      <div className="card">
        <div className="streak"><span className="num">{streak}</span><span className="muted">hari berturut-turut</span></div>
        <p className="muted">{alreadyToday ? "Kamu sudah check-in hari ini." : "Belum check-in hari ini."}</p>
      </div>
      {!unlocked && (
        <div className="field">
          <label>Passphrase identitas kamu</label>
          <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder="Masukkan passphrase untuk menandatangani check-in" />
        </div>
      )}
      {error && <div className="status-error">{error}</div>}
      <button className="btn-primary" disabled={busy} onClick={handleCheckin}>{busy ? "Mengirim…" : alreadyToday ? "Check-in Lagi" : "Check-in Hari Ini"}</button>
      {lastCheckin && (<div style={{ marginTop: 20 }}><h2 style={{ fontSize: 16 }}>Check-in terakhir</h2><ProofCard entry={lastCheckin} /></div>)}
    </div>
  );
}
