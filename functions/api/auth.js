export async function onRequestGet(context) {
  const clientId = context.env.GITHUB_CLIENT_ID;
  if (!clientId) return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });

  const redirectUri = new URL("/api/callback", context.request.url).toString();
  const scope = context.env.GITHUB_SCOPE || "public_repo,user:email";

  // CSRF state
  const state = randomHex(24);

  // Set cookie (agar SELALU terkirim di Brave/Chrome)
  const headers = new Headers();
  setCookie(headers, "oauth_state", state, {
    httpOnly: true,
    sameSite: "None",
    secure: true,
    path: "/",
    maxAge: 300
  });

  // Redirect ke GitHub
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  headers.set("Location", url.toString());
  return new Response(null, { status: 302, headers });
}

function randomHex(len) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

function setCookie(headers, name, value, {
  httpOnly = true, sameSite = "None", secure = true, path = "/", maxAge = 300
} = {}) {
  let c = `${name}=${value}; Path=${path}; SameSite=${sameSite}; Max-Age=${maxAge}`;
  if (httpOnly) c += "; HttpOnly";
  if (secure) c += "; Secure";
  headers.append("Set-Cookie", c);
}

