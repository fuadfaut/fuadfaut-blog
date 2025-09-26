// VERSION: cb-v4
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookies = parseCookies(context.request.headers.get("Cookie") || "");
  if (!state || !cookies.oauth_state || state !== cookies.oauth_state) {
    return new Response("Invalid state", { status: 400 });
  }

  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = context.env;
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return new Response("Missing GitHub OAuth env", { status: 500 });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: new URL("/api/callback", context.request.url).toString(),
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    return new Response(JSON.stringify(tokenJson), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const token = tokenJson.access_token;
  const origin = new URL("/", context.request.url).origin;

  const html = `<!doctype html><html><body style="font:14px system-ui;padding:16px">
<h3>Decap callback OK — VERSION cb-v4</h3>
<p>Kalau popup nggak nutup otomatis, copy token ini, buka tab admin dan jalankan snippet di bawah.</p>
<textarea id="t" style="width:100%;height:80px">${token}</textarea>
<pre style="background:#111;color:#0f0;padding:8px;white-space:pre-wrap">
localStorage.setItem('decap-cms-user', JSON.stringify({ token: 'PASTE_TOKEN_DI_SINI' }));
localStorage.setItem('netlify-cms-user', JSON.stringify({ token: 'PASTE_TOKEN_DI_SINI' }));
location.reload();
</pre>
<script>
(function(){
  var token = ${JSON.stringify(token)};
  var origin = ${JSON.stringify(origin)};
  // kirim SEMUA format:
  try { window.opener && window.opener.postMessage('authorization:github:success:' + token, '*'); } catch(e) {}
  try { window.opener && window.opener.postMessage('authorization:github:success:' + token, origin); } catch(e) {}
  try { window.opener && window.opener.postMessage({ token: token }, '*'); } catch(e) {}
  try { window.opener && window.opener.postMessage({ token: token }, origin); } catch(e) {}
  // fallback: set langsung & reload (kalau same-origin)
  try {
    if (window.opener && window.opener.localStorage) {
      window.opener.localStorage.setItem('decap-cms-user', JSON.stringify({ token: token }));
      window.opener.localStorage.setItem('netlify-cms-user', JSON.stringify({ token: token }));
      window.opener.location.reload();
      setTimeout(function(){ window.close(); }, 500);
    }
  } catch(e) {}
})();
</script>
</body></html>`;
  const headers = new Headers({ "Content-Type": "text/html" });
  headers.append("Set-Cookie", "oauth_state=; Path=/; Max-Age=0; SameSite=None; Secure");
  return new Response(html, { status: 200, headers });
}
function parseCookies(h) {
  return (h || '').split(';').reduce((acc, part) => {
    const [k, v] = part.trim().split('=');
    if (k) acc[k] = decodeURIComponent(v || "");
    return acc;
  }, {});
}
