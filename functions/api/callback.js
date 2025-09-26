export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookies = parseCookies(context.request.headers.get("Cookie") || "");
  if (!state || !cookies.oauth_state || state !== cookies.oauth_state) {
    return new Response("Invalid state", { status: 400 });
  }

  const clientId = context.env.GITHUB_CLIENT_ID;
  const clientSecret = context.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return new Response("Missing GitHub OAuth env", { status: 500 });

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: new URL("/api/callback", context.request.url).toString(),
    }),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    return new Response(JSON.stringify(tokenJson), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const token = tokenJson.access_token;

  const html = `
<!doctype html><html><body>
<script>
  (function() {
    var token = ${JSON.stringify(token)};
    // format lama (string) - kompatibel Decap/Netlify CMS
    try { window.opener && window.opener.postMessage('authorization:github:success:' + token, '*'); } catch (e) {}
    // format baru (object)
    try { window.opener && window.opener.postMessage({ token: token }, '*'); } catch (e) {}
    window.close();
  })();
</script>
Sukses login. Kamu boleh menutup tab ini.
</body></html>`;

  const headers = new Headers({ "Content-Type": "text/html" });
  headers.append("Set-Cookie", "oauth_state=; Path=/; Max-Age=0; SameSite=Lax; Secure");
  return new Response(html, { status: 200, headers });
}

function parseCookies(cookieHeader) {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [k, v] = part.trim().split("=");
    acc[k] = decodeURIComponent(v || "");
    return acc;
  }, {});
}
