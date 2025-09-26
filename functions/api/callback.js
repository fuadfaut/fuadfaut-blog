// VERSION: cb-v3
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

  const html = `
<!doctype html><html><body>
<script>
(function () {
  var token = ${JSON.stringify(token)};
  var origin = ${JSON.stringify(origin)};
  // 1) format lama (string)
  try { window.opener && window.opener.postMessage('authorization:github:success:' + token, '*'); } catch(e) {}
  try { window.opener && window.opener.postMessage('authorization:github:success:' + token, origin); } catch(e) {}
  // 2) format object
  try { window.opener && window.opener.postMessage({ token: token }, '*'); } catch(e) {}
  try { window.opener && window.opener.postMessage({ token: token }, origin); } catch(e) {}
  // 3) langsung simpan ke storage opener
  try {
    if (window.opener && window.opener.localStorage) {
      window.opener.localStorage.setItem('decap-cms-user', JSON.stringify({ token: token }));
      window.opener.localStorage.setItem('netlify-cms-user', JSON.stringify({ token: token }));
    }
  } catch(e) {}
  // 4) refresh halaman admin
  try { window.opener && window.opener.location.reload(); } catch(e) {}
  setTimeout(function(){ window.close(); }, 300);
})();
</script>
<pre>Decap callback OK — VERSION cb-v3</pre>
</body></html>`;
  const headers = new Headers({ "Content-Type": "text/html" });
  headers.append("Set-Cookie", "oauth_state=; Path=/; Max-Age=0; SameSite=Lax; Secure");
  return new Response(html, { status: 200, headers });
}

function parseCookies(h) {
  return (h || '').split(';').reduce((acc, part) => {
    const [k, v] = part.trim().split('=');
    if (k) acc[k] = decodeURIComponent(v || "");
    return acc;
  }, {});
}
