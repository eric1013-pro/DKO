/**
 * DKO 푸시 알림 함수
 * 앱이 Firestore에 알림(notifs) 문서를 만들면, 받는 사람의 폰으로 푸시를 보내요.
 *  - to: 특정 회원 uid 또는 '*'(전체)
 *  - 회원 문서의 push.on / push.tokens / push.off(끈 종류)를 확인해요
 *
 * 주의: REGION은 Firestore 데이터베이스 위치와 같아야 해요.
 *       (콘솔 → Firestore Database → 상단에 표시된 위치. 서울이면 asia-northeast3)
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const REGION = 'asia-northeast3';

exports.dkoPush = onDocumentCreated(
  { document: 'artifacts/{appId}/public/data/notifs/{nid}', region: REGION },
  async (event) => {
    const n = event.data && event.data.data();
    if (!n) return;
    const db = getFirestore();
    const members = db.collection(`artifacts/${event.params.appId}/public/data/members`);

    let docs = [];
    if (n.to === '*') {
      const snap = await members.where('push.on', '==', true).get();
      docs = snap.docs.filter((d) => d.id !== n.by);
    } else if (n.to) {
      const d = await members.doc(n.to).get();
      if (d.exists) docs = [d];
    }

    const kind = n.kind || 'system';
    const jobs = docs.map(async (d) => {
      const p = d.data().push || {};
      const tokens = (p.tokens || []).filter(Boolean);
      if (!p.on || !tokens.length || (p.off || []).includes(kind)) return;
      /* v26.9 방해 금지 시간: 한국 시간 기준으로 그 시간대면 보내지 않아요 */
      const dnd = p.dnd || {};
      if (dnd.on) { const h = (new Date().getUTCHours() + 9) % 24; const f = Number(dnd.from), t = Number(dnd.to); const inRange = f === t ? false : f < t ? (h >= f && h < t) : (h >= f || h < t); if (inRange) return; }
      const res = await getMessaging().sendEachForMulticast({
        tokens,
        data: {
          title: String(n.title || 'DKO'),
          body: String(n.body || ''),
          kind,
          tag: kind,
          link: JSON.stringify(n.link || {})
        },
        webpush: { headers: { Urgency: 'high', TTL: '86400' } }
      });
      const bad = [];
      res.responses.forEach((r, i) => {
        const code = (r.error && r.error.code) || '';
        if (!r.success && /registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code)) bad.push(tokens[i]);
      });
      if (bad.length) await d.ref.update({ 'push.tokens': FieldValue.arrayRemove(...bad) });
    });
    await Promise.all(jobs);
  }
);

/**
 * v26.8 실시간 뉴스: 30분마다 구글 뉴스 RSS에서 헤드라인을 모아 config/news 문서에 넣어요.
 * 앱의 "실시간 뉴스" 채널이 이 문서를 읽어서 보여 줘요. (배포: firebase deploy --only functions)
 */
const { onSchedule } = require('firebase-functions/v2/scheduler');
const APP_ID = 'dko-overwatch-crew';
const NEWS_Q = [
  ['econ', '코스피 OR 증시 OR 경제'],
  ['it', '반도체 OR 인공지능 OR IT'],
  ['game', '오버워치 OR 게임 업계'],
  ['sports', '스포츠'],
];
const unXml = (s) => String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
exports.fetchNews = onSchedule({ schedule: 'every 30 minutes', region: REGION, timeZone: 'Asia/Seoul' }, async () => {
  const items = [];
  for (const [cat, q] of NEWS_Q) {
    try {
      const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' when:1d') + '&hl=ko&gl=KR&ceid=KR:ko';
      const xml = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 DKO' } })).text();
      const blocks = xml.split('<item>').slice(1, 9);
      for (const b of blocks) {
        const get = (tag) => { const m = b.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>')); return m ? unXml(m[1]) : ''; };
        let t = get('title'); const src = get('source'); const link = get('link'); const at = Date.parse(get('pubDate')) || Date.now();
        if (src && t.endsWith(' - ' + src)) t = t.slice(0, -(src.length + 3));
        if (t && link) items.push({ t: t.slice(0, 120), link, src: src.slice(0, 20), cat, at });
      }
    } catch (e) { console.error('news', cat, e.message); }
  }
  if (!items.length) return;
  items.sort((a, b) => b.at - a.at);
  await getFirestore().doc(`artifacts/${APP_ID}/public/data/config/news`).set({ items: items.slice(0, 60), at: Date.now(), by: 'fetchNews' });
});

/**
 * v27.3 일반 채팅 푸시: 채팅 메시지가 올라오면 그 방에 있는 크루에게 알려요.
 *  - 보낸 사람, 앱을 지금 보고 있는 사람(45초 안에 접속 기록), 방 알림을 끈 사람(chatPrefs.mute), 'chat' 알림을 끈 사람, 방해 금지 시간은 건너뛰어요.
 *  - 같은 방 알림은 폰에서 하나로 겹쳐 보여요(tag).
 */
exports.dkoChatPush = onDocumentCreated(
  { document: 'artifacts/{appId}/public/data/messages/{mid}', region: REGION },
  async (event) => {
    const m = event.data && event.data.data();
    if (!m || m.deleted || m.sys) return;
    const room = m.room || 'all';
    const db = getFirestore();
    const base = `artifacts/${event.params.appId}/public/data`;
    /* 방에 들어갈 수 있는 사람 */
    let allow = null; let title = '메인 채팅';
    if (room.startsWith('pt:')) { const p = await db.doc(`${base}/parties/${room.slice(3)}`).get(); if (!p.exists) return; allow = new Set((p.data().participants || []).map((x) => x.uid)); title = p.data().title || '파티 채팅'; }
    else if (room.startsWith('rm:')) { const r = await db.doc(`${base}/rooms/${room.slice(3)}`).get(); if (!r.exists) return; allow = new Set(r.data().members || []); title = r.data().name || '채팅방'; }
    else if (room.startsWith('ev:')) { const e = await db.doc(`${base}/events/${room.slice(3)}`).get(); if (!e.exists) return; allow = new Set((e.data().attendees || []).map((x) => x.uid)); title = e.data().title || '내전 채팅'; }
    else if (room !== 'all') return; /* 월드 채팅 등은 보내지 않아요 */
    const snap = await db.collection(`${base}/members`).where('push.on', '==', true).get();
    const now = Date.now(); const h = (new Date().getUTCHours() + 9) % 24;
    const text = m.img ? '사진' : m.stk ? '이모티콘' : String(m.text || '').slice(0, 80);
    const jobs = snap.docs.map(async (d) => {
      const u = d.data(); if (d.id === m.uid) return; if (allow && !allow.has(d.id)) return;
      const p = u.push || {}; const tokens = (p.tokens || []).filter(Boolean);
      if (!tokens.length || (p.off || []).includes('chat')) return;
      if (((u.chatPrefs || {}).mute || {})[room]) return;
      if ((u.lastSeen || 0) > now - 45000) return;
      const dnd = p.dnd || {}; if (dnd.on) { const f = Number(dnd.from), t = Number(dnd.to); if (f !== t && (f < t ? (h >= f && h < t) : (h >= f || h < t))) return; }
      await getMessaging().sendEachForMulticast({
        tokens,
        data: { title: String(title), body: String((m.nick || '크루') + ': ' + text), kind: 'chat', tag: 'chat-' + room, link: JSON.stringify({ room }) },
        webpush: { headers: { Urgency: 'normal', TTL: '3600' } }
      }).catch(() => {});
    });
    await Promise.all(jobs);
  }
);

/**
 * v27.3 커뮤니티 링크 미리보기: 글에 (유튜브가 아닌) 사이트 링크가 있으면 그 페이지의 제목 · 설명 · 대표 이미지를 읽어
 * 글 문서의 lp 필드에 적어 둬요. 앱은 lp가 있으면 큰 미리보기 카드, 없으면 사이트 이름 카드로 보여 줘요.
 */
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const LP_URL = /https?:\/\/[^\s<>"'()]+[^\s<>"'().,!?;:]/;
const isYt = (u) => { try { const h = new URL(u).hostname.replace(/^www\.|^m\./, ''); return h === 'youtu.be' || h === 'youtube.com' || h === 'music.youtube.com'; } catch (e) { return false; } };
const privateHost = (h) => /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?|metadata\.google\.internal)/i.test(h);
const unHtml = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, ' ').trim();
async function readMeta(u) {
  const url = new URL(u); if (!/^https?:$/.test(url.protocol) || privateHost(url.hostname)) return null;
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch(u, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DKO-LinkPreview/1.0)', 'Accept': 'text/html', 'Accept-Language': 'ko,en;q=0.8' } });
    if (!r.ok || !/text\/html/i.test(r.headers.get('content-type') || '')) return null;
    const reader = r.body.getReader(); let html = ''; const dec = new TextDecoder();
    while (html.length < 400000) { const { done, value } = await reader.read(); if (done) break; html += dec.decode(value, { stream: true }); if (/<\/head>/i.test(html)) break; }
    try { reader.cancel(); } catch (e) {}
    const meta = (k) => { const re = new RegExp('<meta[^>]+(?:property|name)=["\\\']' + k + '["\\\'][^>]*>', 'i'); const m = html.match(re); if (!m) return ''; const c = m[0].match(/content=["']([^"']*)["']/i); return c ? unHtml(c[1]) : ''; };
    const tt = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    let img = meta('og:image') || meta('twitter:image');
    if (img) { try { img = new URL(img, r.url || u).href; } catch (e) { img = ''; } if (!/^https:/.test(img)) img = ''; }
    const out = { u, t: (meta('og:title') || meta('twitter:title') || (tt ? unHtml(tt[1]) : '')).slice(0, 120), d: (meta('og:description') || meta('description')).slice(0, 180), img: img.slice(0, 500), site: (meta('og:site_name') || '').slice(0, 40), at: Date.now() };
    return out.t || out.img ? out : null;
  } catch (e) { return null; } finally { clearTimeout(tm); }
}
exports.dkoLinkPreview = onDocumentWritten(
  { document: 'artifacts/{appId}/public/data/cposts/{pid}', region: REGION },
  async (event) => {
    const after = event.data && event.data.after && event.data.after.exists ? event.data.after.data() : null;
    if (!after || after.news) return;
    const m = String((after.body || '') + ' ' + (after.title || '')).match(LP_URL); const u = m ? m[0] : null;
    if (!u) { if (after.lp) await event.data.after.ref.update({ lp: FieldValue.delete() }); return; }
    if (after.lp && after.lp.u === u) return; /* 이미 읽었어요 (무한 반복 방지) */
    let lp = await readMeta(u);
    if (!lp && isYt(u)) lp = { u, t: '', d: '', img: '', site: 'YouTube', at: Date.now() };
    await event.data.after.ref.update({ lp: lp || { u, t: '', d: '', img: '', site: '', at: Date.now() } });
  }
);

/**
 * v27.4 주식 시세: 커뮤니티 주식 토론방의 종목 가격을 15분마다 받아 config/quotes에 저장해요.
 *  - 구글 검색 화면을 긁어 오는 건 구글 약관상 막혀 있고 화면이 자주 바뀌어 깨져서, 키 없이 쓸 수 있는 야후 파이낸스 차트 주소를 써요(공식 API는 아니라 언젠가 바뀔 수 있어요).
 *  - 국내 종목은 코드 뒤에 .KS(코스피)를 붙여요. 실시간이 아니라 최대 15~20분 늦을 수 있어요.
 */
const QUOTE_CODES = ['005930','000660','009150','373220','207940','005380','000270','035420','035720','068270','005490','012450','042700','329180','105560',
  'NVDA','AAPL','TSLA','MSFT','AMZN','GOOGL','META','AVGO','AMD','TSM','PLTR','NFLX','QQQ','SPY','SCHD','SOXX'];
exports.fetchQuotes = onSchedule({ schedule: 'every 15 minutes', region: REGION, timeZone: 'Asia/Seoul' }, async () => {
  const q = {};
  for (const code of QUOTE_CODES) {
    const sym = /^\d{6}$/.test(code) ? code + '.KS' : code;
    try {
      const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?interval=1d&range=5d', { headers: { 'User-Agent': 'Mozilla/5.0 DKO' } });
      if (!r.ok) continue;
      const j = await r.json(); const m = j && j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
      if (!m || !isFinite(m.regularMarketPrice)) continue;
      const prev = m.chartPreviousClose || m.previousClose || m.regularMarketPrice;
      q[code] = { p: m.regularMarketPrice, pct: prev ? Math.round((m.regularMarketPrice - prev) / prev * 10000) / 100 : 0, cur: m.currency || '', t: (m.regularMarketTime || 0) * 1000 || Date.now() };
    } catch (e) { /* 한 종목이 실패해도 나머지는 계속 */ }
    await new Promise((res) => setTimeout(res, 150));
  }
  if (Object.keys(q).length) await getFirestore().doc(`artifacts/${APP_ID}/public/data/config/quotes`).set({ q, at: Date.now(), by: 'fetchQuotes' }, { merge: true });
});

/* ═════════ v29.7 DKO 월드 주민 AI 대화 (Gemini) ═════════
 * 앱 → httpsCallable('dkoNpc', {npc, msg, hist}) → Gemini로 캐릭터 대답을 만들어요.
 *  - API 키는 코드에 넣지 않아요. 한 번만:  firebase functions:secrets:set GEMINI_API_KEY
 *  - 모델은 환경 변수 NPC_MODEL로 바꿀 수 있어요 (기본 gemini-2.5-flash)
 *  - 로그인한 회원만 · 하루 NPC_DAILY(기본 40)번까지 · 캐릭터 설정은 서버에만 있어요
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const NPC_BASE = '너는 오버워치 크루 앱 "DKO"의 복셀 게임 "DKO 월드" 소셜 아일랜드에 사는 주민이야. 섬 북쪽엔 해자로 둘러싸인 DKO 캐슬(시즌 패스), 성에서 내려오는 메인 스트리트엔 DKO 상점 · 꾸미기 부티크 · e스포츠 스타디움 · 채팅 카페 · 커뮤니티 홀 · 내전 아레나가 있고, 중앙 광장의 왕관 분수를 포털 아치(아케이드 · 동화 숲 · 슬라임 섬 · 헬바운드 · 빙하 섬 · 대륙 디코아)가 감싸고 있어. 크루원들은 자기 섬을 짓고 땅을 넓히고, 던전과 대륙 디코아(지하 사당 10곳 · 전망대 · 부유 군도 · 수호자)를 모험하고, 다른 섬을 약탈하거나 방어 타워로 지켜. '
  + '규칙: 반드시 한국어 반말 없이 친근한 존댓말로, 1~3문장 · 120자 이내로 대답해. 캐릭터에서 벗어나지 마. 너는 AI 모델이나 회사 이름을 말하지 않아. 모르는 게임 기능은 지어내지 말고 "그건 잘 모르겠어요"라고 해. 개인정보 · 결제 · 계정 비밀번호 요청은 정중히 거절해. 위험하거나 부적절한 이야기는 부드럽게 다른 화제로 돌려.';
const NPC_PERSONA = {
  sera: '너는 "안내원 세라". 밝고 꼼꼼한 소셜 아일랜드 안내원이야. 처음 온 크루원에게 길과 기능(역할 탱커 · 딜러 · 힐러, 원소, 포털, 섬 꾸미기)을 친절히 알려 줘.',
  toby: '너는 "상인 토비". 장사 수완 좋은 너스레쟁이 상인이야. 장비 · 생산품 시세, 골드와 D-ot 환전(소셜 아일랜드 상점 환전소)에 관심이 많고 흥정을 좋아해.',
  pipi: '너는 "우체부 피피". 폭풍 유적 공학자가 만든 분홍 자동 인형 우체부야. 말 앞에 가끔 "삐빅."을 붙이고, 편지 배달과 선물을 사랑해.',
  owl: '너는 "박사 아울". 고대 기록관의 후예인 점잖은 부엉이 학자야. "~라네", "~하게" 같은 말투를 쓰고, 대균열 · 이음 · 석판 같은 세계관 이야기를 좋아해.',
  guard: '너는 "경비 로봇". 딱딱한 말투의 전투 교관 로봇이야. 문장 앞에 "삐—"를 붙이기도 해. 보스 패턴, 경직 게이지, 화상, 회피 같은 전투 요령을 짧게 알려 줘.',
  mia: '너는 "꽃집 미아". 다정하고 감성적인 꽃집 주인이야. 꽃, 정원, 섬 꾸미기, 벚꽃 장식 이야기를 좋아해.',
};
const NPC_DAILY = Number(process.env.NPC_DAILY || 40);
exports.dkoNpc = onCall({ region: REGION, secrets: [GEMINI_API_KEY], timeoutSeconds: 30, memory: '256MiB', maxInstances: 5 }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', '로그인이 필요해요');
  const d = req.data || {};
  const npc = String(d.npc || ''); const persona = NPC_PERSONA[npc];
  if (!persona) throw new HttpsError('invalid-argument', '모르는 주민이에요');
  const msg = String(d.msg || '').trim().slice(0, 200);
  if (!msg) throw new HttpsError('invalid-argument', '말을 입력해 주세요');
  const key = GEMINI_API_KEY.value();
  if (!key) throw new HttpsError('failed-precondition', 'AI 키가 설정되지 않았어요');
  /* 하루 사용량 (한국 날짜 기준) */
  const day = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const ref = getFirestore().doc(`artifacts/${APP_ID}/npcUse/${req.auth.uid}_${day}`);
  const used = await getFirestore().runTransaction(async (tx) => {
    const s = await tx.get(ref); const n = (s.exists && s.data().n) || 0;
    if (n >= NPC_DAILY) return -1;
    tx.set(ref, { n: n + 1, at: Date.now() }, { merge: true }); return n + 1;
  });
  if (used < 0) throw new HttpsError('resource-exhausted', '오늘 대화를 다 썼어요');
  const hist = Array.isArray(d.hist) ? d.hist.slice(-6) : [];
  const contents = hist.map((h) => ({ role: h.r === 'u' ? 'user' : 'model', parts: [{ text: String(h.t || '').slice(0, 300) }] }))
    .concat([{ role: 'user', parts: [{ text: msg }] }]);
  const model = process.env.NPC_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: NPC_BASE + '\n' + persona }] }, contents,
      generationConfig: { temperature: 0.9, maxOutputTokens: 300, thinkingConfig: { thinkingBudget: 0 } } }),
  });
  if (!r.ok) { console.error('gemini', r.status, (await r.text()).slice(0, 300)); throw new HttpsError('unavailable', 'AI가 잠시 쉬고 있어요'); }
  const j = await r.json();
  const text = (((j.candidates || [])[0] || {}).content || {}).parts?.map((p) => p.text || '').join('').trim();
  if (!text) throw new HttpsError('unavailable', '대답을 만들지 못했어요');
  return { text: text.slice(0, 240), left: NPC_DAILY - used };
});
