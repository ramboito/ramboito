// ===================================================
// 해밀푸드 (Hamil Food) — 상품 카탈로그 (취급상품·온라인주문 공용)
// ===================================================
// 품목 추가/수정은 아래 BRANDS 목록만 고치면 두 페이지에 함께 반영됩니다.
// 형식: [품목명, 규격]  — 규격 예: "800g*20봉" (1봉 800g, 1박스 20봉)

(function () {
  // ---------------------------------------------------
  // ① 상품별 상세 정보 (가격·사진·설명) — 품목코드로 입력
  // ---------------------------------------------------
  // 품목코드는 온라인주문 화면에 표시되는 코드입니다 (예: JY-01).
  //  price    : 1봉(1개) 판매가 (원, 부가세 포함)
  //  boxPrice : 1박스 가격 (생략하면 봉 가격 × 입수로 계산)
  //  images   : 사진 경로 목록 — assets/products 폴더에 올리고 경로를 적어주세요
  //  desc     : 상세 설명 (줄바꿈은 \n)
  //  storage / origin / maker : 보관방법·원산지·제조원 (생략 시 기본 문구)
  // 값을 비워두면 상세페이지에 "가격 문의", "사진 준비중"으로 표시됩니다.
  const PRODUCT_INFO = {
    // 입력 예시 (앞의 // 를 지우면 적용됩니다)
    // "JY-01": {
    //   price: 3500,
    //   boxPrice: 65000,
    //   images: ["assets/products/JY-01-1.jpg", "assets/products/JY-01-2.jpg"],
    //   desc: "쫄깃한 식감의 쌀떡볶이 떡입니다.\n해동 후 바로 조리할 수 있습니다.",
    //   origin: "쌀(국산)",
    // },
  };

  // ---------------------------------------------------
  // ② 배송 정책 — 모든 상품 상세페이지·주문서에 공통 적용
  // ---------------------------------------------------
  // ※ 현재 금액·조건은 화면 구성을 위한 임시값입니다. 실제 정책으로 바꿔주세요.
  const SHIPPING = {
    cutoff: "평일 오후 2시까지 주문 확인 시 당일 출고 (주말·공휴일 휴무)",
    methods: [
      {
        id: "courier",
        name: "냉동 택배",
        fee: 5000,
        freeOver: 100000,
        summary: "전국 · 아이스박스+아이스팩 포장",
        notes: ["주문 1건 기준 배송비입니다. 박스 수가 많으면 추가될 수 있습니다.", "제주·도서산간 지역은 추가 배송비가 발생합니다."],
      },
      {
        id: "direct",
        name: "냉동탑차 직배송",
        fee: 0,
        minOrder: 100000,
        summary: "인근 지역 사업자 거래처 · 정해진 요일 배송",
        notes: ["배송 가능 지역과 요일은 주문 확인 후 안내드립니다."],
      },
      {
        id: "pickup",
        name: "방문 수령",
        fee: 0,
        summary: "청룡길 156-104, 해밀푸드빌딩 · 평일 09:00–18:00",
        notes: ["주문 확인 연락을 받으신 뒤 방문해 주세요."],
      },
    ],
    returns: [
      "냉동식품 특성상 단순 변심에 의한 교환·반품은 어렵습니다.",
      "상품 하자·오배송·해동 상태로 도착한 경우 수령 당일 사진과 함께 연락 주시면 교환 또는 환불해 드립니다.",
      "받으신 즉시 냉동(-18℃ 이하) 보관해 주세요.",
    ],
  };

  const CATEGORY_EMOJI = {
    "순대·편육": "🥓", "햄·소시지": "🌭", "어묵": "🍢", "떡·떡볶이": "🍡", "만두·전병": "🥟",
    "면·육수·소스": "🍜", "튀김·전·간식": "🍤", "과일·디저트": "🍍", "기타": "📦",
  };

  const BRANDS = [
    {
      name: "진영식품", short: "진영", slug: "JY",
      items: [
        ["[진영]쌀떡볶이(800g소/중)", "800g*20봉"],
        ["[진영]쌀떡볶이(소/중/대/못/뭇소)", "1.5k*10봉"],
        ["[진영]밀떡볶이", "3k*5봉"],
        ["[진영]떡국 1.4k", "1.4k*8봉"],
        ["[진영]떡국 3k", "3k*5봉"],
        ["[진영]건조떡볶이(3kg)", "3kg*5봉"],
        ["[진영]건조떡볶이(해밀/건조옷)", "1.5k*10봉"],
        ["[진영]가래떡(4k)", "4k"],
        ["[진영]가래떡(2kg)", "2kg(23가닥)"],
      ],
    },
    {
      name: "사조오양", short: "오양", slug: "OY",
      items: [
        ["[오양]일반반찬소세지", "1kg*10봉"],
        ["[오양]미니스틱후랑크", "1kg*10봉"],
        ["[오양]베이컨/소(냉동)", "500g*20봉"],
        ["[오양]베이컨/대(냉동)", "1kg*10봉"],
        ["[오양]불고기맛후랭크", "1kg*10봉"],
        ["[오양]불고기구이(슬라이스)", "1kg*10봉"],
        ["[오양]부대찌개모둠햄", "1k*10봉"],
        ["[오양]백미반찬소세지", "1kg(2열-50장)*10봉"],
        ["[오양]알말이", "70g*30개"],
        ["[오양]마늘", "1k*10봉"],
        ["[오양]산적(750g)", "450g*20봉"],
        ["[오양]수제모둠소세지", "750g(25g*30장)*20봉"],
        ["[오양]숯불모둠소세지", "385g7개20봉"],
        ["[오양]숯불갈비맛산적구이", "1kg*8봉"],
        ["[오양]야채봉(순중)", "4kg*4봉"],
        ["[오양]오륙도바큘러스(생)", "1250g*10봉"],
        ["[오양]오륙도상전", "950g*16봉"],
        ["[오양]오륙도상전1k", "1kg*15봉"],
        ["[오양]오색모둠전", "800g*16봉"],
        ["[오양]오색모둠전(상보)", "800g33개10봉"],
        ["[오양]요리베이컨(30g)", "800g*16봉"],
        ["[오양]요리베이컨(냉동)", "1kg*10봉"],
        ["[오양]즉석스모크", "1kg*10봉"],
        ["[오양]치즈스틱", "1kg*10봉"],
        ["[오양]치킨너겟", "1kg*10봉"],
        ["[오양]치킨탕수육", "1kg*10봉"],
        ["[오양]치킨텐더", "1kg*10봉"],
        ["[오양]칼집요리비엔나", "1kg*10봉"],
        ["[오양]하이비엔나(국산)", "1kg*10봉"],
        ["[오양]해물완자", "1kg*10봉"],
        ["[오양]후레쉬스모크햄", "1kg*10봉"],
      ],
    },
    {
      name: "한울", short: "한울", slug: "HU",
      items: [
        ["[한울]후루룩우동", "1kg*10봉"],
        ["[한울]만두", "1k*10봉"],
        ["[한울]메밀단 4kg", "1.5kg*10봉"],
        ["[한울]별단단 2kg", "2kg*10봉"],
        ["[한울]별단단(진공)", "1.5kg*10봉"],
        ["[한울]비빔단(전용)", "1.4k*8봉"],
        ["[한울]별담단(소/중/대/못/뭇소) 2kg", "2kg*10봉"],
        ["[한울]밀방별담단/소/중/대/못/뭇소 4kg", "4kg*5봉"],
        ["[한울]김치미 4kg", "5kg*3봉"],
        ["[한울]떡국 3kg", "3kg*3봉"],
        ["[한울]떡국 5kg", "5kg*3봉"],
        ["[한울]가래 1.5k", "1.4kg10봉 / 1.5k10봉"],
        ["[한울]가래 3k", "3k*5봉"],
        ["[한울]냉동누들우동떡볶이", "4k"],
        ["[한울]떡국", "2kg(23가닥)"],
        ["[한울]미니", "1k"],
        ["[한울]1k미니", "1k"],
      ],
    },
    {
      name: "별가", short: "별가", slug: "BG",
      items: [
        ["[별가]가래(2k-24개)", "2k(21줄)"],
        ["[별가]가래(5k)", "5k(40cm-20개)"],
        ["[별가]가래떡(반진공)", "2k"],
        ["[별가]가래떡(미니/밀건조중)", "1.5kg*10봉"],
        ["[별가]밀떡볶이(미니/밀건조중)", "3k*5봉"],
        ["[별가]밀떡볶이(미니)", "2k"],
        ["[별가]밀떡볶이(절단)", "5k / 3k*6봉"],
        ["[별가]밀떡볶이(소/중/대/못/뭇소)", "1.4k*10봉"],
        ["[별가]쌀떡볶이(9mm/미니/소/중/대)", "2k*5봉"],
        ["[별가]쌀떡볶이(1kg)", "2k*5봉"],
        ["[별가]물엿(건조/건조옷)", "3.75k*5봉"],
        ["[별가]물엿(건조)", "5k"],
        ["[별가]물엿", "5k"],
        ["[별가]수제비/냉동", "1.2k*15봉"],
        ["[별가]수제비/냉장", "1k*10봉"],
        ["[별가]사리(소)", "1k*10봉"],
        ["[별가]후루룩밀떡볶이/밀칼 2k", "800g*20봉"],
        ["[별가]후루룩떡볶이/밀칼 2k", "1.5k*10봉"],
        ["[별가]후루룩우동2k", "1k*10봉"],
        ["[별가]200배사라(25장)", "2k*6봉"],
        ["[별가]꼬치어묵", "2k*6봉"],
        ["[별가]대디스코", "1k*10봉"],
        ["[별가]명조알이", "2k*6봉"],
        ["[별가]사라아어묵", "1250g(50g*25장)"],
        ["[별가]볼어묵", "800g*20봉"],
        ["[별가]상보어묵", "800g*20봉"],
        ["[별가]오뎅이", "800g(32g*25장)"],
      ],
    },
    {
      name: "삼진", short: "삼진", slug: "SJ",
      items: [
        ["[삼진]치킨까스 180g", "180g(10개)*4봉"],
        ["[삼진]후라이드용꼬치-G", "100g(10장)*12봉"],
        ["[삼진]호박바-중", "1k*12봉"],
        ["[삼진]치킨피칸론(8)", "802g*15봉"],
        ["[삼진]전통모둠", "900g*10개"],
        ["[삼진]오뎅이", "320g*35봉"],
        ["[삼진]순중어묵", "800g*20봉"],
        ["[삼진]상보어묵", "800g(25개)"],
        ["[삼진]볼어묵", "800g(32g*25장)"],
        ["[삼진]사라어묵", "800g*25봉"],
        ["[삼진]디스코", "800g*16봉"],
        ["[삼진]대디스코", "1kg*16봉"],
        ["[삼진]꼬치어묵", "800g*20봉"],
      ],
    },
    {
      name: "아하", short: "아하", slug: "AH",
      items: [
        ["[아하]왕만두", "1500g(30개)*12각"],
        ["[아하]꼬물이만두", "1.2kg(약22말)*6봉"],
        ["[아하]왕제법군만두", "1.2k*6봉"],
        ["[아하]왕수제물만두", "1.4k6봉50ea"],
        ["[아하]피자왕만두 1.4k", "1.2k*6봉"],
        ["[아하]김치왕만두/김치손만두 1.2k", "1.4k*6봉"],
        ["[아하]김치만두/김치손만두 2.8k", "2.8k(100개)"],
        ["[아하]메밀왕만두/곤드레전병/감자전병/메밀왕전병 1.4k", "1.35k(9g,135말)*6봉"],
        ["[아하]감자고기왕만두/감자김치전병 1.4k", "1.35kg(90말)*6봉"],
        ["[아하]수제비/만두", "1.4kg(70g,20알)*6봉"],
      ],
    },
    {
      name: "면사랑", short: "면사랑", slug: "MS",
      items: [
        ["[면사랑]생칼국수(실온2M)", "1kg*10ea"],
        ["[면사랑]소면(냉동)", "3kg*4봉"],
        ["[면사랑]쇠고기조미육수", "340g30봉 / 300g5ea*8봉"],
        ["[면사랑]이사채밀면/이름야채밀면", "1k(25g/5.5cm*40ea)"],
        ["[면사랑]우동면(1인식)", "1k(40g/9cm*25)"],
        ["[면사랑]우동면(2인식)", "230g*40"],
        ["[면사랑]우동면(5인식)", "230g*40"],
        ["[면사랑]우동면(냉동)", "230g*40"],
        ["[면사랑]우동면(전문점)", "230g5ea8봉"],
        ["[면사랑]중화면(전문점)", "250g*12봉"],
        ["[면사랑]중화면1인식(냉동)", "250g*12봉"],
        ["[면사랑]짜장소스", "230g5ea8봉 / 230g*40ea"],
        ["[면사랑]지장소스", "230g*40"],
        ["[면사랑]생면(전문점)", "1.5kg*8봉"],
        ["[면사랑]메밀국수", "2kg*6봉"],
        ["[면사랑]육수수카5kg", "5k*2ea"],
        ["[면사랑]물냉면장", "1.8l"],
        ["[면사랑]프.냉면장", "1.8L*6"],
        ["[면사랑]프.우동면(5인식)", "250g*5ea"],
        ["[면사랑]프.우동면(냉동)", "250g5ea6봉"],
        ["[면사랑]프.중화면", "250g5ea6봉"],
        ["[면사랑]프.중화면(냉동)", "250g*5ea"],
        ["[면사랑]냉동왕만두", "300g*30봉"],
        ["[면사랑]해물왕육수1.8L", "1k(40g*25개)"],
        ["[면사랑]우주집채낙지만두", "1k*10봉"],
        ["[면사랑]단호박고로케", "2.8k(70개)*2봉"],
        ["[면사랑]미니비아", "1k*10봉"],
        ["[면사랑]새우감자고로케", "1k20개10봉(12~14cm)"],
        ["[면사랑]고구마튀김", "2k*5봉(50ea)"],
        ["[면사랑]김말이", "2k*5봉(50ea)"],
        ["[면사랑]야채튀김", "1k(30개)*10봉 / 1.6kg"],
        ["[면사랑]미니매콤김말이-냉동", "1.2k(20~24ea)*6봉"],
        ["[면사랑]냉동김말이", "180g(10장)*6봉"],
        ["[면사랑]순살돈까스", "150g(10장)"],
        ["[면사랑]180g치즈돈까스", "180g(10장)"],
      ],
    },
    {
      name: "맘모스", short: "맘모스", slug: "MM",
      items: [
        ["[맘모스]치킨까스", "1k*5봉"],
        ["[맘모스]치킨한판", "1k*10봉"],
        ["[맘모스]알밥스테이크", "1.5kg(60g*25개)"],
        ["[맘모스]명품떡갈비", "1kg(50개)*10봉"],
        ["[맘모스]미트볼", "1kg*10봉"],
        ["[맘모스]순살닭강정", "2.25k(45g*50ea)*4봉"],
        ["[맘모스]야채고로케커피(카주)", "1kg30개5봉"],
        ["[맘모스]치킨고로케", "1kg*10봉"],
        ["[맘모스]치킨너겟", "1.2k(20개)*10봉"],
        ["[맘모스]치킨스틱", "1.2k(50달)"],
        ["[맘모스]피카츄돈까스", "100g10장10봉"],
        ["[맘모스]함박스테이크", "100g10장12봉"],
        ["[맘모스]해물동그랑땡", "2kg*6봉"],
      ],
    },
    {
      name: "달솔", short: "달솔", slug: "DS",
      items: [
        ["[달솔]1k편육", "약300g*10봉"],
        ["[달솔]500g편육", "2k"],
        ["[달솔]간", "2k*7봉"],
        ["[달솔]간하파", "400g"],
        ["[달솔]곱창슬라이스 1k", "2k*10봉"],
        ["[달솔]곱창슬라이스 2kg", "1k*10봉"],
        ["[달솔]누드순대.막대", "2k*20봉"],
        ["[달솔]머리/냉동머리", "1k*20봉"],
        ["[달솔]머리슬라이스(냉동)", "2K*5EA"],
        ["[달솔]머리슬라이스순대(2kg)", "2kg*10봉"],
        ["[달솔]오소리감투", "약300g*봉"],
        ["[달솔]진공순대 1k", "2k"],
        ["[달솔]진공순대파(900g)", "2k(반관)"],
        ["[달솔]냉동동쪽맛살", "1k*10봉"],
        ["[달솔]냉동꽃무늬슬라이스", "1k*10봉"],
        ["[달솔]빅스모크햄", "1k*4봉"],
        ["[달솔]선합(냉장)", "1k*8봉"],
        ["[달솔]선합(냉동)", "1k*10봉"],
        ["[달솔]오징어링", "400g*10봉"],
        ["[달솔]와사비쌈무", "1k*10봉"],
        ["[달솔]주부초밥빵", "1k*10봉"],
        ["[달솔]진어묵(분홍)", "1k*10봉"],
        ["[달솔]진어묵(백색)", "3kg*4팩"],
        ["[달솔]참피온소세지(1kg)", "1k*10봉"],
        ["[달솔]해물동그랑땡", "1k*10봉"],
        ["[달솔]미니전병", "1k*12봉"],
        ["[달솔]미니냉면(김치)", "1.8kg(75알)*5"],
        ["[달솔]금물이/100g치킨", "1.8kg30g60개*5봉"],
        ["[달솔]밥떡", "2kg*4봉"],
        ["[달솔]만두", "1k(107개)"],
      ],
    },
    {
      name: "사조대림", short: "대림", slug: "DR",
      items: [
        ["[대림]오징어링", "160g*30봉"],
        ["[대림]주부초밥빵", "3kg*4팩"],
        ["[대림]참피온온소세지(1kg)", "1kg*10봉"],
        ["[대림]전어묵(매(원색))", "1kg*12봉"],
        ["[대림]전어묵(백색)", "1k*10봉"],
        ["[대림]참피온소세지(1kg)", "1k*10봉"],
        ["[대림]미니족발", "1kg*12봉"],
        ["[대림]한우족발", "1k*10봉"],
        ["[대림]와사비쌈무", "160g*30봉"],
        ["[대림]어묵역전글400g", "320g*30봉"],
        ["[대림]선합(상(가타))", "1kg*10봉"],
        ["[대림]선합(생장)", "1k*10봉"],
        ["[대림]선합(냉장)", "400g*10봉"],
        ["[대림]빅스모크햄", "1k*10ea"],
        ["[대림]냉동부부슬라이스", "1k*10봉"],
        ["[대림]라이스찰치즈볼", "1k*8봉"],
        ["[대림]냉동꽃무늬슬라이스", "2kg*6봉"],
        ["[대림]해물동그랑땡", "2k*4봉"],
        ["[대림]미니전병", "1k(100개)"],
        ["[대림]미니냉면(김치)", "1k(107개)"],
        ["[대림]미니냉면", "1.35k(100장) / 1.35k30g60개*5봉"],
        ["[대림]쌀가루", "1.2k(20가)"],
        ["[대림]미니전병", "1.8kg30g60개*5봉"],
      ],
    },
    {
      name: "랜시", short: "랜시", slug: "RS",
      items: [
        ["[랜시]냉동리치(중국산)", "1k*10pk"],
        ["[랜시]냉동파인애플(베트남산)", "900g(30개)*10봉"],
        ["[랜시]단호박고로케", "1k*10봉"],
        ["[랜시]팥부단(냉동)", "400g20개10팩"],
        ["[랜시]새우볼", "1.2k(20개-60g)"],
        ["[랜시]생선까스", "2.5kg50장50g"],
        ["[랜시]야채춘권", "1.08k(72개)*12각"],
        ["[랜시]유탕고구마(7kg)", "20g357개10봉"],
      ],
    },
  ];

  // 품목명 키워드로 자동 분류 (위에서부터 먼저 맞는 분류 적용)
  const CATEGORY_RULES = [
    ["순대·편육", /순대|편육|머리|곱창|오소리|^간/],
    ["햄·소시지", /소세지|소시지|후랑크|후랭크|베이컨|비엔나|햄|스모크|산적|떡갈비|미트볼|족발|불고기|스테이크/],
    ["어묵", /어묵|오뎅|디스코|맛살|사라|슬라이스|오륙도|호박바|전통모둠|야채봉/],
    ["떡·떡볶이", /떡|가래|단단|담단|메밀단|비빔단|김치미|^미니$|^1k미니$/],
    ["만두·전병", /만두|전병/],
    ["면·육수·소스", /면|우동|국수|육수|소스|냉면장|사리|수제비/],
    ["튀김·전·간식", /까스|너겟|텐더|고로케|튀김|김말이|치즈|탕수육|닭강정|치킨|춘권|동그랑땡|전$|모둠전|상전|완자|피칸|링|새우볼|꼬치/],
    ["과일·디저트", /리치|파인애플|팥|고구마/],
  ];
  const CATEGORY_ORDER = [...CATEGORY_RULES.map((r) => r[0]), "기타"];

  const UNIT_ALIASES = { 봉: "봉", 팩: "팩", pk: "팩", 각: "각", ea: "개", 개: "개" };

  // "800g" / "1.5k" / "1.8L" → { amount, base: "g" | "ml" }
  function parseAmount(text) {
    const m = text.match(/(\d+(?:\.\d+)?)\s*(kg|k|g|ml|l)(?![a-z])/i);
    if (!m) return null;
    const v = parseFloat(m[1]);
    const u = m[2].toLowerCase();
    if (u === "kg" || u === "k") return { amount: v * 1000, base: "g" };
    if (u === "g") return { amount: v, base: "g" };
    if (u === "l") return { amount: v * 1000, base: "ml" };
    return { amount: v, base: "ml" };
  }

  // "800g*20봉", "1kg(50개)*10봉", "2kg(23가닥)"처럼 1개 중량이 분명한 규격만 중량을 계산
  const SIMPLE_SPEC = /^\s*약?\s*\d+(?:\.\d+)?\s*(?:kg|k|g|ml|l)\s*(?:\([^)]*\))?\s*(?:\*\s*\d+\s*(?:봉|팩|각|pk|ea|개)?)?\s*(?:\([^)]*\))?\s*$/i;

  // 규격에서 1개 중량과 박스 입수(예: 20봉)를 추출. 여러 규격(" / ")이면 첫 번째 기준.
  function parseSpec(spec) {
    const first = spec.split(/\s+\/\s+/)[0];
    const amount = SIMPLE_SPEC.test(first) ? parseAmount(first) : null;
    const approx = /^\s*약/.test(first);

    let boxCount = null;
    let unit = "개";
    const packMatches = [...first.matchAll(/(\d+)\s*(봉|팩|각|pk)/gi)];
    if (packMatches.length) {
      const last = packMatches[packMatches.length - 1];
      boxCount = parseInt(last[1], 10);
      unit = UNIT_ALIASES[last[2].toLowerCase()] || "봉";
    } else {
      const star = first.match(/\*\s*(\d+)\s*(ea|개)?\s*$/i);
      if (star) {
        boxCount = parseInt(star[1], 10);
        unit = "개";
      } else if (/봉/.test(first)) {
        unit = "봉";
      }
    }
    return { amount, approx, boxCount: boxCount > 1 ? boxCount : null, unit };
  }

  function formatAmount(amount, base) {
    if (amount == null) return "";
    if (base === "ml") return amount >= 1000 ? `${Number((amount / 1000).toFixed(2))}L` : `${Math.round(amount)}ml`;
    return amount >= 1000 ? `${Number((amount / 1000).toFixed(2))}kg` : `${Math.round(amount)}g`;
  }

  // 한글 초성 (예: "만두" → "ㅁㄷ")
  const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
  function chosung(str) {
    let out = "";
    for (const ch of str) {
      const code = ch.charCodeAt(0) - 0xac00;
      out += code >= 0 && code <= 11171 ? CHO[Math.floor(code / 588)] : ch;
    }
    return out;
  }
  const normalize = (s) => s.toLowerCase().replace(/[\s\[\]()·.\-_/*]/g, "");

  const items = [];
  BRANDS.forEach((brand) => {
    brand.items.forEach(([rawName, spec], i) => {
      const name = rawName.replace(/^\[[^\]]+\]/, "").trim();
      const category = (CATEGORY_RULES.find(([, re]) => re.test(name)) || ["기타"])[0];
      const parsed = parseSpec(spec);

      // 괄호 안에 "/"로 나열된 값은 선택 옵션으로 (예: 소/중/대)
      const optGroup = name.match(/\(([^()]*\/[^()]*)\)/);
      const options = optGroup ? optGroup[1].split("/").map((o) => o.trim()).filter(Boolean) : null;

      const code = `${brand.slug}-${String(i + 1).padStart(2, "0")}`;
      items.push({
        id: code,
        code,
        brand: brand.short,
        brandName: brand.name,
        name,
        spec,
        category,
        options,
        unit: parsed.unit,
        unitAmount: parsed.amount ? parsed.amount.amount : null,
        amountBase: parsed.amount ? parsed.amount.base : "g",
        approx: parsed.approx,
        boxCount: parsed.boxCount,
        nameText: normalize(name),
        nameCho: chosung(normalize(name)),
        searchText: normalize(`${brand.name}${brand.short}${name}${spec}${spec.replace(/(\d)\s*k(?!g)/gi, "$1kg")}${category}${code}`),
        searchCho: chosung(normalize(`${brand.short}${name}`)),
        emoji: CATEGORY_EMOJI[category] || "📦",
        ...pickInfo(PRODUCT_INFO[code], parsed.boxCount),
      });
    });
  });

  // PRODUCT_INFO 값을 정리 (잘못된 값은 무시)
  function pickInfo(info, boxCount) {
    const num = (v) => (typeof v === "number" && v > 0 ? Math.round(v) : null);
    info = info || {};
    const price = num(info.price);
    return {
      price,
      boxPrice: boxCount ? num(info.boxPrice) || (price ? price * boxCount : null) : null,
      images: Array.isArray(info.images) ? info.images.filter((x) => typeof x === "string" && x) : [],
      desc: typeof info.desc === "string" ? info.desc : "",
      storage: info.storage || "냉동 보관 (-18℃ 이하)",
      origin: info.origin || "상품 포장지 표기 참조",
      maker: info.maker || "",
    };
  }

  const formatWon = (n) => `${Math.round(n).toLocaleString("ko-KR")}원`;

  const isChosungQuery = (q) => /^[ㄱ-ㅎ]+$/.test(q);

  window.HamilCatalog = {
    items,
    brands: BRANDS.map((b) => ({ short: b.short, name: b.name, count: b.items.length })),
    categories: CATEGORY_ORDER.filter((c) => items.some((it) => it.category === c)),
    byId: (id) => items.find((it) => it.id === id),

    search(query, { category = "전체", brand = "전체" } = {}) {
      const q = normalize(query || "");
      const terms = (query || "").trim().split(/\s+/).map(normalize).filter(Boolean);
      const matched = items.filter((it) => {
        if (category !== "전체" && it.category !== category) return false;
        if (brand !== "전체" && it.brand !== brand) return false;
        if (!q) return true;
        if (isChosungQuery(q)) return it.searchCho.includes(q);
        return terms.every((t) => it.searchText.includes(t) || (isChosungQuery(t) && it.searchCho.includes(t)));
      });
      if (!q) return matched;
      // 품목명에 검색어가 직접 들어간 상품을 먼저 보여줌
      if (isChosungQuery(q)) {
        // 초성 검색: 초성이 가리키는 글자가 흔한 단어일수록 앞으로 (ㅅㄷ → 순대 > 순살돈까스)
        const freq = (it) => {
          const pos = it.nameCho.indexOf(q);
          if (pos < 0) return -1;
          const word = it.nameText.slice(pos, pos + q.length);
          return items.filter((x) => x.nameText.includes(word)).length;
        };
        return matched
          .map((it, i) => ({ it, i, f: freq(it), st: it.nameCho.startsWith(q) ? 0 : 1 }))
          .sort((a, b) => b.f - a.f || a.st - b.st || a.i - b.i)
          .map((x) => x.it);
      }
      const score = (it) =>
        it.nameText.startsWith(q) ? 0 : it.nameText.includes(q) ? 1 : 2 + terms.filter((t) => !it.nameText.includes(t)).length;
      return matched
        .map((it, i) => ({ it, i, s: score(it) }))
        .sort((a, b) => a.s - b.s || a.i - b.i)
        .map((x) => x.it);
    },

    // 1개 단위 설명: "1봉 = 800g"
    unitLabel(it) {
      if (!it.unitAmount) return `${it.unit} 단위 판매`;
      return `1${it.unit} = ${it.approx ? "약 " : ""}${formatAmount(it.unitAmount, it.amountBase)}`;
    },
    // 박스 설명: "1박스 = 20봉 (16kg)"
    boxLabel(it) {
      if (!it.boxCount) return "";
      const total = it.unitAmount ? ` (${formatAmount(it.unitAmount * it.boxCount, it.amountBase)})` : "";
      return `1박스 = ${it.boxCount}${it.unit}${total}`;
    },
    // 주문 수량 → 낱개 수 / 총 중량
    describeQty(it, qty, mode) {
      const pieces = mode === "box" && it.boxCount ? qty * it.boxCount : qty;
      const head = mode === "box" && it.boxCount ? `${qty}박스 (${pieces}${it.unit})` : `${qty}${it.unit}`;
      const weight = it.unitAmount ? formatAmount(it.unitAmount * pieces, it.amountBase) : "";
      return { head, weight, pieces };
    },
    // 주문 수량 → 금액 (가격 미입력 시 null)
    linePrice(it, qty, mode) {
      if (mode === "box" && it.boxCount) return it.boxPrice ? it.boxPrice * qty : null;
      return it.price ? it.price * qty : null;
    },
    // 수령 방법별 배송비 (상품금액을 모르면 null → "확인 후 안내")
    shippingFee(methodId, subtotal, allPriced) {
      const m = SHIPPING.methods.find((x) => x.id === methodId);
      if (!m) return null;
      if (!m.fee) return 0;
      if (m.freeOver && allPriced && subtotal >= m.freeOver) return 0;
      if (m.freeOver && !allPriced) return null;
      return m.fee;
    },
    shipping: SHIPPING,
    formatWon,
    formatAmount,
  };
})();
