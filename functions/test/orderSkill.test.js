const test = require("node:test");
const assert = require("node:assert/strict");
const { buildOrderResult } = require("../lib/orderSkill");

function skillBody(params) {
  return { action: { params } };
}

test("모든 필수 파라미터가 있으면 주문을 만들고 요약을 응답한다", () => {
  const result = buildOrderResult(
    skillBody({
      이름: "홍길동",
      연락처: "010-1234-5678",
      상품: "순대 2kg 2개",
      주소: "서울시 강남구 테헤란로 123",
    })
  );

  assert.equal(result.ok, true);
  assert.equal(result.order.name, "홍길동");
  assert.equal(result.order.phone, "010-1234-5678");
  assert.equal(result.order.items, "순대 2kg 2개");
  assert.equal(result.order.address, "서울시 강남구 테헤란로 123");
  assert.equal(result.order.status, "신규");
  assert.equal(result.order.source, "kakao-bot");
  assert.match(result.order.rawText, /이름: 홍길동/);
  assert.match(result.order.rawText, /연락처: 010-1234-5678/);

  const text = result.response.template.outputs[0].simpleText.text;
  assert.match(text, /주문이 접수되었어요/);
  assert.match(text, /홍길동/);
});

test("주소는 선택 항목이라 없어도 주문이 만들어진다", () => {
  const result = buildOrderResult(
    skillBody({ 이름: "김영희", 연락처: "010-2222-3333", 상품: "만두 1kg 1개" })
  );
  assert.equal(result.ok, true);
  assert.equal(result.order.address, "");
  assert.doesNotMatch(result.order.rawText, /배송지/);
});

test("영문 파라미터 키(name/phone/items)도 지원한다", () => {
  const result = buildOrderResult(
    skillBody({ name: "Jane", phone: "010-0000-0000", items: "떡볶이떡 1kg" })
  );
  assert.equal(result.ok, true);
  assert.equal(result.order.name, "Jane");
});

test("필수 파라미터가 비어 있으면 저장하지 않고 안내 메시지를 응답한다", () => {
  const result = buildOrderResult(skillBody({ 이름: "홍길동" }));
  assert.equal(result.ok, false);
  assert.equal(result.order, undefined);
  const text = result.response.template.outputs[0].simpleText.text;
  assert.match(text, /연락처/);
  assert.match(text, /주문 상품/);
});

test("action/params가 아예 없어도 예외 없이 실패 응답을 만든다", () => {
  const result = buildOrderResult({});
  assert.equal(result.ok, false);
  assert.ok(result.response.template.outputs[0].simpleText.text.length > 0);
});

test("공백만 있는 값은 비어있는 것으로 취급한다", () => {
  const result = buildOrderResult(skillBody({ 이름: "   ", 연락처: "010-1234-5678", 상품: "만두 1개" }));
  assert.equal(result.ok, false);
});
