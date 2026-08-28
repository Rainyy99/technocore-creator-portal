"use client";

function shorten(str, head = 10, tail = 6) {
  if (!str || str.length <= head + tail + 3) return str;
  return `${str.slice(0, head)}…${str.slice(-tail)}`;
}

export default function ProofCard({ entry }) {
  const { room, seq, did, nonce, ts, text, url } = entry;

  const copyText = () =>
    navigator.clipboard.writeText(
      [`Room: ${room}`, `Sequence: ${seq}`, `DID: ${did}`, `Nonce: ${nonce}`,
       `Timestamp: ${ts}`, url ? `URL: ${url}` : null, `Text: ${text}`]
        .filter(Boolean).join("\n")
    );

  const copyJson = () => navigator.clipboard.writeText(JSON.stringify(entry, null, 2));

  return (
    <div className="proof">
      <div className="proof-header">
        <strong>Room: {room}</strong>
        <span className="proof-badge">✓ Tercatat di Technocore</span>
      </div>
      <div className="proof-row mono"><span className="k">Sequence</span><span className="v">{seq ?? "—"}</span></div>
      <div className="proof-row mono"><span className="k">DID</span><span className="v" title={did}>{shorten(did, 14, 8)}</span></div>
      <div className="proof-row mono"><span className="k">Nonce</span><span className="v">{nonce}</span></div>
      <div className="proof-row mono"><span className="k">Timestamp</span><span className="v">{ts ? new Date(ts).toLocaleString("id-ID") : "—"}</span></div>
      {url && (
        <div className="proof-row">
          <span className="k">Link</span>
          <span className="v"><a href={url} target="_blank" rel="noreferrer" style={{ color: "var(--accent-2)" }}>{shorten(url, 20, 10)}</a></span>
        </div>
      )}
      <div className="proof-text">{text}</div>
      <div className="proof-actions">
        <button className="btn-secondary" onClick={copyText}>Copy Proof</button>
        <button className="btn-secondary" onClick={copyJson}>Copy sebagai JSON</button>
      </div>
    </div>
  );
}
