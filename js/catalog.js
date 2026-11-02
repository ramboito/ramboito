// ===================================================
// 해밀푸드 (Hamil Food) — 상품 데이터 (취급상품·온라인주문 공용)
// ===================================================
// unit: 판매 단위 / unitKg: 1단위당 중량(kg)
// price: 1단위당 판매가(원). null이면 "가격 문의"로 표시되고 합계에서 제외됩니다.
window.HAMIL_PRODUCTS = [
  {
    key: "sundae",
    name: "순대",
    emoji: "🍥",
    category: "순대",
    desc: "국내산 당면과 야채로 속을 꽉 채운 수제 순대",
    code: "HM-SND-01",
    unit: "봉",
    unitKg: 1,
    storage: "냉동보관(-18℃ 이하)",
    shelfLife: "제조일로부터 180일",
    price: null,
    sizes: ["대", "중", "소"],
  },
  {
    key: "tteok",
    name: "떡볶이 떡",
    emoji: "🍡",
    category: "떡류",
    desc: "쫄깃한 식감의 즉석 떡볶이용 가래떡",
    code: "HM-TTK-01",
    unit: "봉",
    unitKg: 1,
    storage: "냉동보관(-18℃ 이하)",
    shelfLife: "제조일로부터 180일",
    price: null,
    sizes: ["대", "중", "소"],
  },
  {
    key: "jeonbyeong",
    name: "메밀전병",
    emoji: "🌯",
    category: "전·부침",
    desc: "메밀 반죽에 야채소를 채워 부친 전통 전병",
    code: "HM-MBJ-01",
    unit: "팩",
    unitKg: 0.5,
    storage: "냉동보관(-18℃ 이하)",
    shelfLife: "제조일로부터 120일",
    price: null,
    sizes: ["대", "중", "소"],
  },
  {
    key: "mandu",
    name: "만두",
    emoji: "🥟",
    category: "만두",
    desc: "고기와 야채가 듬뿍 들어간 수제 만두",
    code: "HM-MDU-01",
    unit: "봉",
    unitKg: 1,
    storage: "냉동보관(-18℃ 이하)",
    shelfLife: "제조일로부터 180일",
    price: null,
    sizes: ["대", "중", "소"],
  },
];

window.HamilCatalog = {
  formatWeight(kg) {
    if (kg <= 0) return "0kg";
    return kg >= 1 ? `${Number(kg.toFixed(2))}kg` : `${Math.round(kg * 1000)}g`;
  },
  formatPrice(won) {
    return `${won.toLocaleString("ko-KR")}원`;
  },
  // 1봉 = 1kg 처럼 판매 단위와 중량의 관계를 한 줄로 표시
  unitLabel(p) {
    return `1${p.unit} = ${this.formatWeight(p.unitKg)}`;
  },
};
