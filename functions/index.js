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
