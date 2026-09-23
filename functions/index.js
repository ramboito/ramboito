// ===================================================
// 해밀푸드 (Hamil Food) — 카카오 챗봇 웹훅 (Cloud Functions)
// ===================================================
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { buildOrderResult, ERROR_RESPONSE } = require("./lib/orderSkill");

admin.initializeApp();
const db = admin.firestore();

// 카카오 i 오픈빌더 "주문하기" 스킬의 웹훅 URL로 등록합니다.
// 오픈빌더는 필수 파라미터(이름/연락처/상품, 주소는 선택)를 모두 채운 뒤
// 이 엔드포인트를 한 번 호출하고, 여기서 반환하는 JSON을 사용자에게 그대로 보여줍니다.
exports.kakaoOrderSkill = onRequest({ region: "asia-northeast3", cors: false }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const result = buildOrderResult(req.body || {});

    if (result.ok) {
      await db.collection("kakaoOrders").add({
        ...result.order,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.json(result.response);
  } catch (err) {
    logger.error("kakaoOrderSkill failed", err);
    res.json(ERROR_RESPONSE);
  }
});
