// ===================================================
// 해밀푸드 (Hamil Food) — 카카오 오픈빌더 "주문하기" 스킬
// Firebase Admin SDK / firebase-functions에 의존하지 않는 순수 로직만 모아서
// (admin 초기화 없이도) 단위 테스트할 수 있게 분리했습니다.
// ===================================================

/** 오픈빌더 파라미터 이름(한글)과 영문 대체 키를 함께 지원합니다. */
function readParam(params, koKey, enKey) {
  const raw = params[koKey] ?? params[enKey] ?? "";
  return String(raw).trim();
}

function kakaoText(text, quickReplies) {
  const template = { outputs: [{ simpleText: { text } }] };
  if (quickReplies && quickReplies.length) {
    template.quickReplies = quickReplies.map((label) => ({
      label,
      action: "message",
      messageText: label,
    }));
  }
  return { version: "2.0", template };
}

/**
 * 오픈빌더 스킬 요청 body를 받아 Firestore에 저장할 주문 문서와,
 * 사용자에게 보낼 응답(카카오 스킬 응답 JSON)을 함께 만들어 돌려줍니다.
 * Firestore 접근은 하지 않습니다 (호출부에서 처리).
 */
function buildOrderResult(body) {
  const params = (body && body.action && body.action.params) || {};

  const name = readParam(params, "이름", "name");
  const phone = readParam(params, "연락처", "phone");
  const items = readParam(params, "상품", "items");
  const address = readParam(params, "주소", "address");

  const missing = [];
  if (!name) missing.push("이름");
  if (!phone) missing.push("연락처");
  if (!items) missing.push("주문 상품");

  if (missing.length) {
    return {
      ok: false,
      response: kakaoText(
        `${missing.join(", ")} 정보를 확인하지 못해 주문 접수에 실패했어요. "주문하기"라고 다시 말씀해 주시겠어요?`
      ),
    };
  }

  const rawText = [`이름: ${name}`, `연락처: ${phone}`, address ? `배송지: ${address}` : null, `상품: ${items}`]
    .filter(Boolean)
    .join("\n");

  const order = {
    rawText,
    name,
    phone,
    address,
    items,
    memo: "",
    status: "신규",
    source: "kakao-bot",
  };

  const summary =
    `주문이 접수되었어요! 🙌\n\n` +
    `주문자: ${name}\n` +
    `연락처: ${phone}\n` +
    (address ? `배송지: ${address}\n` : "") +
    `상품: ${items}\n\n` +
    `확인 후 순서대로 준비해 드릴게요. 감사합니다!`;

  return { ok: true, order, response: kakaoText(summary) };
}

const ERROR_RESPONSE = kakaoText("주문 접수 중 오류가 발생했어요. 잠시 후 다시 시도해 주시거나 매장으로 연락해 주세요.");

module.exports = { buildOrderResult, kakaoText, ERROR_RESPONSE };
