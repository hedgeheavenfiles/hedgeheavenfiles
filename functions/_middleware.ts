interface Env {
  ASSETS: Fetcher;
  SECRET_KEY: string;
}

// Configuration
const DIFFICULTY = 3;
const ALLOW_AGENTS = ["google", "bingbot", "yahoo", "duckduckbot", "discordbot", "whatsapp", "curl", "mastodon", "twitterbot", "applebot", "telegrambot", "slackbot", "linkedinbot"];
const BLOCK_AGENTS = ["gptbot", "claudebot", "claudeweb", "anthropic-ai", "ccbot", "bytespider", "gemini-ai", "google-extended", "chatgpt-user", "oai-searchbot", "claude-user"]; 
const CHALLENGE_TTL = 5 * 60 * 1000;

// UI Strings
const STRINGS = {
  title: "Making sure you are not a bot!",
  heading: "Making sure you are not a bot!",
  description: "Please wait a moment while we ensure the security of your connection.",
  btn_start: "I am human",
  btn_calculating: "Calculating...",
  btn_verifying: "Verifying...",
  btn_success: "Success!",
  btn_retry: "Retry",
  btn_error: "Error",
};

// Image URLs
const IMG_CHECK   = "https://anakama.xyz/assets/anubis/pensive.webp";
const IMG_SUCCESS = "https://anakama.xyz/assets/anubis/happy.webp";
const IMG_FAILED  = "https://anakama.xyz/assets/anubis/reject.webp";

// Crypto Utils
async function sign(msg: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verify(msg: string, sig: string, key: string): Promise<boolean> {
  const expected = await sign(msg, key);
  return expected === sig;
}

async function checkPoW(challenge: string, nonce: string, response: string, difficulty: number): Promise<boolean> {
  const msg = challenge + String(nonce);
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(msg));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const calculated = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  if (calculated !== response) return false;
  const prefix = "0".repeat(difficulty);
  if (!calculated.startsWith(prefix)) return false;
  return true;
}

function safeRedirect(path: string): string {
  try {
    if (path.startsWith('/') && !path.startsWith('//')) return path;
  } catch (_) {}
  return '/';
}

const GENERATE_HTML = (challenge: string, originalPath: string, domain: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta name="robots" content="noindex,nofollow">
<meta property="og:locale" content="en">
<link rel="icon" href="/favicon.png" type="image/png" />
<title>${STRINGS.title}</title>
<link rel="preload" href="${IMG_CHECK}" as="image" />
<link rel="preload" href="${IMG_SUCCESS}" as="image" />
<link rel="preload" href="${IMG_FAILED}" as="image" />
<meta name="robots" content="noindex,nofollow">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f9f5d7; color: #000000; font-family: Geist, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; gap: 16px; }
.box { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 40px 32px; max-width: 380px; width: 100%; }
.domain-badge { display: flex; align-items: center; gap: 6px; background: #fbf1c7; border: 1px solid #b16286; border-radius: 20px; padding: 5px 14px; font-size: 0.78rem; color: #b16286; letter-spacing: 0.03em; }
.domain-badge::before { content: ''; display: inline-block; width: 6px; height: 6px; background: #b16286; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.mascot { width: 100%; max-width: 256px; height: auto; display: block; }
h1 { font-family: Podkova, serif; font-size: 1.25rem; font-weight: bold; color: #000000; text-align: center; }
p { font-size: 0.85rem; color: #000000; opacity: 0.6; text-align: center; max-width: 300px; line-height: 1.6; }
button { background: #fbf1c7; color: #000000; border: 1px solid #b16286; padding: 11px 32px; border-radius: 4px; font-family: Geist, sans-serif; font-size: 0.9rem; cursor: pointer; width: 100%; }
button:hover:not(:disabled) { background: #b16286; color: #f9f5d7; }
button:disabled { opacity: 0.5; cursor: default; }
footer { position: fixed; bottom: 16px; font-size: 0.75rem; color: #000000; opacity: 0.3; text-align: center; }
footer a { color: #000000; opacity: 0.5; }
#progress { border-radius: 1rem; display: none; height: 2rem; margin: 1rem 0 2rem; outline: #b16286 solid 4px; outline-offset: 2px; overflow: hidden; width: min(20rem, 90%); }
.bar-inner { background-color: #b16286; height: 100%; width: 0; transition: width .25s ease-in; }
a, a:active, a:visited { background-color: #fbf1c7; color: #b16286; }
</style>
</head>
<body>
<div class="box">
<div class="domain-badge">${domain}</div>
<img src="${IMG_CHECK}" class="mascot" id="mascot-img" alt="Guard">
<h1>${STRINGS.heading}</h1>
<p>${STRINGS.description}</p>
<button id="verify-btn">${STRINGS.btn_start}</button>
</div>
<script>
const CHALLENGE = ${JSON.stringify(challenge)};
const DIFFICULTY = ${DIFFICULTY};
const ORIGINAL_PATH = ${JSON.stringify(originalPath)};
const IMG_CHECK   = ${JSON.stringify(IMG_CHECK)};
const IMG_SUCCESS = ${JSON.stringify(IMG_SUCCESS)};
const IMG_FAILED  = ${JSON.stringify(IMG_FAILED)};
const S = {
  calculating: ${JSON.stringify(STRINGS.btn_calculating)},
  verifying:   ${JSON.stringify(STRINGS.btn_verifying)},
  success:     ${JSON.stringify(STRINGS.btn_success)},
  retry:       ${JSON.stringify(STRINGS.btn_retry)},
  error:       ${JSON.stringify(STRINGS.btn_error)},
};
const btn = document.getElementById('verify-btn');
const img = document.getElementById('mascot-img');

function setMascot(src) {
  img.src = src;
}

const WORKER_CODE = \`
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
self.onmessage = async (e) => {
  const { challenge, difficulty, startNonce, step } = e.data;
  const prefix = "0".repeat(difficulty);
  let nonce = startNonce;
  while (true) {
    const hash = await sha256(challenge + nonce);
    if (hash.startsWith(prefix)) {
      self.postMessage({ found: true, nonce, hash });
      return;
    }
    nonce += step;
  }
};
\`;

function createWorker() {
  const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

function mine() {
  btn.disabled = true; btn.innerText = S.calculating;
  setMascot(IMG_CHECK);
  const numWorkers = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);
  const workers = [];
  let done = false;
  for (let i = 0; i < numWorkers; i++) {
    const worker = createWorker();
    workers.push(worker);
    worker.postMessage({ challenge: CHALLENGE, difficulty: DIFFICULTY, startNonce: i, step: numWorkers });
    worker.onmessage = (e) => {
      if (done) return;
      done = true;
      workers.forEach(w => w.terminate());
      submit(e.data.nonce, e.data.hash);
    };
  }
}

function submit(nonce, response) {
  btn.innerText = S.verifying;
  const fd = new FormData();
  fd.append('nonce', nonce);
  fd.append('response', response);
  fd.append('verify', 'true');
  fd.append('original_path', ORIGINAL_PATH);
  fetch(window.location.href, { method: 'POST', body: fd }).then(async res => {
    if (res.ok) {
      const data = await res.json();
      setMascot(IMG_SUCCESS);
      btn.innerText = S.success;
      setTimeout(() => { window.location.href = data.redirect; }, 500);
    } else {
      setMascot(IMG_FAILED);
      btn.innerText = S.retry; btn.disabled = false;
    }
  }).catch(() => {
    setMascot(IMG_FAILED);
    btn.innerText = S.error; btn.disabled = false;
  });
}

document.addEventListener('DOMContentLoaded', mine);
</script>
<footer>
<p>Unofficial, serverless version of <a href="https://anubis.techaro.lol/">Anubis</a>.</p>
<p>Mascot design by <a href="https://bsky.app/profile/celphase.bsky.social">CELPHASE</a>.</p>
<p>Copyright Anubis © 2026 Techaro.</p>
</footer>
</body>
</html>
`;

export const onRequest: PagesFunction<Env> = async (context) => {
  const SECRET_KEY = context.env.SECRET_KEY;

  if (!SECRET_KEY) {
    return new Response("SECURITY ERROR: SECRET_KEY is not set in environment variables", { status: 500 });
  }

  const { request, next } = context;
  const url = new URL(request.url);
  const ua = (request.headers.get("User-Agent") || "").toLowerCase();

  // 1. Pass static assets
  if (
    url.pathname.match(
      /\.(png|jpg|jpeg|gif|webp|avif|heic|heif|ico|svg|bmp|tiff|tif|css|js|mjs|jsx|ts|tsx|map|json|xml|rss|atom|txt|pdf|csv|yaml|yml|toml|woff|woff2|ttf|otf|eot|mp4|webm|ogv|mov|avi|mkv|m4v|mp3|wav|ogg|flac|aac|m4a|opus|zip|tar|gz|7z|wasm|md|markdown|htaccess|webmanifest)$/i
    )
  ) {
    return next();
  }

  // 2. Pass and block bots
  if (ALLOW_AGENTS.some(b => ua.includes(b))) return next();
  if (BLOCK_AGENTS.some(b => ua.includes(b))) return new Response("Access Denied", { status: 403 });

  // 3. Check Cookie
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("anubis_solved=true")) return next();

  // 4. Handle POST
  if (request.method === "POST") {
    try {
      const fd = await request.formData();
      if (!fd.has('verify')) return new Response("Bad Request", { status: 400 });

      const nonce = fd.get("nonce") as string;
      const response = fd.get("response") as string;
      const originalPath = safeRedirect(fd.get("original_path") as string || "/");

      const cStr = cookie.split(';').find(c => c.trim().startsWith('anubis_challenge='));
      if (!cStr) return new Response("Expired", { status: 403 });

      const rawCookie = decodeURIComponent(cStr.trim().split('=').slice(1).join('='));
      const dotIndex1 = rawCookie.indexOf('.');
      const dotIndex2 = rawCookie.indexOf('.', dotIndex1 + 1);
      if (dotIndex1 === -1 || dotIndex2 === -1) return new Response("Invalid Challenge", { status: 403 });
      const challenge = rawCookie.slice(0, dotIndex1);
      const timestamp = rawCookie.slice(dotIndex1 + 1, dotIndex2);
      const sig = rawCookie.slice(dotIndex2 + 1);

      if (!await verify(challenge + '.' + timestamp, sig, SECRET_KEY)) return new Response("Invalid Signature", { status: 403 });

      const issuedAt = parseInt(timestamp, 10);
      if (isNaN(issuedAt) || Date.now() - issuedAt > CHALLENGE_TTL) {
        return new Response("Challenge Expired", { status: 403 });
      }

      if (!await checkPoW(challenge, nonce, response, DIFFICULTY)) return new Response("POW Failed", { status: 403 });

      const headers = new Headers();
      headers.append("Set-Cookie", "anubis_solved=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400");
      headers.set("Content-Type", "application/json");

      return new Response(JSON.stringify({ success: true, redirect: originalPath }), { status: 200, headers });
    } catch (e) {
      return new Response("Server Error", { status: 500 });
    }
  }

  // 5. Issue Challenge
  const rnd = crypto.randomUUID().replace(/-/g, '');
  const timestamp = Date.now().toString();
  const payload = rnd + '.' + timestamp;
  const sig = await sign(payload, SECRET_KEY);
  const originalPath = safeRedirect(url.pathname + url.search + url.hash);
  const domain = url.hostname;

  const headers = new Headers();
  headers.set("Content-Type", "text/html");
  headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  headers.set("Set-Cookie", `anubis_challenge=${encodeURIComponent(payload + '.' + sig)}; Path=/; HttpOnly; Secure; SameSite=Lax`);

  return new Response(GENERATE_HTML(rnd, originalPath, domain), { headers });
};