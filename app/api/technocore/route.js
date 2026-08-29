export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path || !/^\/(r|kv)\//.test(path)) {
    return new Response(JSON.stringify({ error: "Invalid path" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const separator = path.includes("?") ? "&" : "?";
  const upstream = `https://technocore.chat${path}${separator}format=json`;

  try {
    const res = await fetch(upstream, { method: "GET" });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Upstream request failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
