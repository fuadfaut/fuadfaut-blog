export async function onRequestGet(context) {
  const clientId = context.env.GITHUB_CLIENT_ID;
  if (!clientId) return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });

  const redirectUri = new URL("/api/callback", context.request.url).toString();
  const scope = context.env.GITHUB_SCOPE || "public_repo,user:email";

  const state = cryptoRandomString(24);
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);

  const headers = new Headers({ Location: url.toString() });
  setCookie(headers, "oauth_state", state, { httpOnly: true, sameSite: "Lax", path: "/", maxAge: 300, secure: true });

  return new Response(null, { status: 302, headers });
}

function cryptoRandomString(len) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

function setCookie(headers, name, value, { httpOnly = false, sameSite = "Lax", path = "/", maxAge, secure = false } = {}) {
  let cookie = `${name}=${value}; Path=${path}; SameSite=${sameSite}`;
  if (httpOnly) cookie += "; HttpOnly";
  if (secure) cookie += "; Secure";
  if (maxAge) cookie += `; Max-Age=${maxAge}`;
  headers.append("Set-Cookie", cookie);
}
