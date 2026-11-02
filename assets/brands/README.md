# 브랜드 로고 폴더

취급상품 페이지의 '브랜드별로 보기'에 표시되는 로고 이미지입니다.

1. 로고 파일을 이 폴더에 올립니다. 파일 이름은 브랜드 코드로 맞춰주세요.
   JY 진영식품 · OY 사조오양 · HU 한울 · BG 별가 · SJ 삼진 · AH 아하 · MS 면사랑 · MM 맘모스 · DS 달솔 · DR 사조대림 · RS 랜시
   예: `assets/brands/JY.png`
2. `js/catalog.js`의 `BRAND_LOOK`에서 해당 브랜드에 `logo: "assets/brands/JY.png"`를 적습니다.

- 배경이 투명한 PNG 또는 SVG, 가로 600px 안팎을 권장합니다.
- 로고가 없는 브랜드는 브랜드 이름판이 대신 표시됩니다.
