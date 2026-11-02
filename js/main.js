// ===================================================
// 해밀푸드 (Hamil Food) — 공통 스크립트
// ===================================================

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initMobileNav();
  initActiveNav();
  initReveal();
  initCounters();
  initContactForm();
  initCatalog();
  initOrderForm();
});

/* 헤더: 스크롤 시 그림자 */
function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const toggleScrolled = () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  toggleScrolled();
  window.addEventListener("scroll", toggleScrolled, { passive: true });
}

/* 모바일 메뉴 토글 */
function initMobileNav() {
  const btn = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-mobile");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => menu.classList.remove("open"));
  });
}

/* 현재 페이지 메뉴 활성화 */
function initActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === path) link.classList.add("active");
  });
}

/* 스크롤 시 등장 애니메이션 */
function initReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
}

/* 통계 숫자 카운트업 */
function initCounters() {
  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseFloat(el.getAttribute("data-counter"));
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = value.toLocaleString("ko-KR") + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => observer.observe(el));
}

/* 문의 폼 처리 (백엔드 연동 전: 메일 클라이언트로 전달) */
function initContactForm() {
  const form = document.querySelector("#contact-form");
  const status = document.querySelector("#form-status");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.querySelector("#field-name").value.trim();
    const company = form.querySelector("#field-company").value.trim();
    const phone = form.querySelector("#field-phone").value.trim();
    const email = form.querySelector("#field-email").value.trim();
    const category = form.querySelector("#field-category").value;
    const message = form.querySelector("#field-message").value.trim();

    if (!name || !phone || !email || !message) {
      showStatus(status, "필수 항목을 모두 입력해 주세요.", false);
      return;
    }

    const subject = encodeURIComponent(`[해밀푸드 문의] ${category} - ${name}`);
    const body = encodeURIComponent(
      `담당자명: ${name}\n` +
        `회사명: ${company || "-"}\n` +
        `연락처: ${phone}\n` +
        `이메일: ${email}\n` +
        `문의 유형: ${category}\n\n` +
        `문의 내용:\n${message}`
    );

    window.location.href = `mailto:info@hamilfood.co.kr?subject=${subject}&body=${body}`;
    showStatus(status, "메일 작성 화면으로 이동합니다. 전송을 완료해 주세요.", true);
    form.reset();
  });
}

/* 취급상품: 상품 검색·카테고리 필터 */
function initCatalog() {
  const grid = document.querySelector("#catalog-grid");
  const products = window.HAMIL_PRODUCTS;
  if (!grid || !products) return;

  const C = window.HamilCatalog;
  const searchInput = document.querySelector("#catalog-search");
  const chipGroup = document.querySelector("#catalog-chips");
  const emptyEl = document.querySelector("#catalog-empty");
  let activeCategory = "전체";

  const categories = ["전체", ...new Set(products.map((p) => p.category))];
  chipGroup.innerHTML = categories
    .map((c) => `<button type="button" class="chip${c === activeCategory ? " active" : ""}" data-category="${c}">${c}</button>`)
    .join("");

  const render = () => {
    const q = searchInput.value.trim().toLowerCase();
    const matched = products.filter((p) => {
      const inCategory = activeCategory === "전체" || p.category === activeCategory;
      const haystack = `${p.name} ${p.code} ${p.category} ${p.desc}`.toLowerCase();
      return inCategory && (!q || haystack.includes(q));
    });

    grid.innerHTML = matched
      .map(
        (p) => `
        <div class="card catalog-card">
          <div class="order-photo" role="img" aria-label="${p.name} (임시 이미지)"><span>${p.emoji}</span></div>
          <span class="tag-pill">${p.category}</span>
          <h3>${p.name}</h3>
          <p class="catalog-code">${p.code}</p>
          <ul class="spec-list">
            <li><span>판매단위</span><strong>${C.unitLabel(p)}</strong></li>
            <li><span>보관</span><strong>${p.storage}</strong></li>
          </ul>
          <p class="shop-price">${p.price ? `${C.formatPrice(p.price)} <small>/ 1${p.unit}</small>` : "가격 문의"}</p>
          <a href="order.html?add=${p.key}" class="btn btn-primary btn-sm" style="width:100%;">주문하기</a>
        </div>`
      )
      .join("");
    emptyEl.hidden = matched.length > 0;
  };

  searchInput.addEventListener("input", render);
  chipGroup.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    activeCategory = chip.dataset.category;
    chipGroup.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
    render();
  });
  render();
}

/* 온라인주문: 쇼핑형 장바구니 (무게 → 봉 수 자동 환산) */
function initOrderForm() {
  const form = document.querySelector("#order-form");
  const grid = document.querySelector("#shop-grid");
  const products = window.HAMIL_PRODUCTS;
  if (!form || !grid || !products) return;

  const C = window.HamilCatalog;
  const status = document.querySelector("#order-status");
  const KG_PRESETS = [1, 2, 3, 5];
  const cart = Object.fromEntries(products.map((p) => [p.key, { qty: 0, size: "" }]));

  grid.innerHTML = products
    .map(
      (p) => `
      <div class="card order-item" id="item-${p.key}" data-key="${p.key}">
        <div class="order-photo" role="img" aria-label="${p.name} (임시 이미지)"><span>${p.emoji}</span></div>
        <h3>${p.name}</h3>
        <p class="order-desc">${p.desc}</p>
        <ul class="spec-list">
          <li><span>품목코드</span><strong>${p.code}</strong></li>
          <li><span>판매단위</span><strong>${C.unitLabel(p)}</strong></li>
          <li><span>보관방법</span><strong>${p.storage}</strong></li>
          <li><span>유통기한</span><strong>${p.shelfLife}</strong></li>
        </ul>
        <p class="shop-price">${p.price ? `${C.formatPrice(p.price)} <small>/ 1${p.unit}</small>` : "가격 문의 <small>(주문 확인 후 안내)</small>"}</p>
        ${
          p.sizes
            ? `<div class="field" style="margin-bottom:14px;">
                <label for="size-${p.key}">사이즈</label>
                <select id="size-${p.key}" data-role="size">
                  <option value="">사이즈 선택</option>
                  ${p.sizes.map((s) => `<option value="${s}">${s}</option>`).join("")}
                </select>
              </div>`
            : ""
        }
        <div class="field" style="margin-bottom:14px;">
          <label>무게로 담기</label>
          <div class="kg-chips">
            ${KG_PRESETS.map((kg) => `<button type="button" data-kg="${kg}">${kg}kg</button>`).join("")}
          </div>
        </div>
        <div class="qty-row">
          <div class="stepper">
            <button type="button" data-step="-1" aria-label="${p.name} 수량 줄이기">−</button>
            <input type="number" min="0" step="1" value="0" data-role="qty" aria-label="${p.name} 수량(${p.unit})" />
            <button type="button" data-step="1" aria-label="${p.name} 수량 늘리기">+</button>
          </div>
          <span class="qty-hint" data-role="hint">0${p.unit}</span>
        </div>
      </div>`
    )
    .join("");

  const cartList = document.querySelector("#order-cart-list");
  const cartCount = document.querySelector("#order-cart-count");
  const cartTotal = document.querySelector("#order-cart-total");
  const cartBar = document.querySelector("#cart-bar");
  const cartBarText = document.querySelector("#cart-bar-text");

  /* 주문 정보 입력란이 화면에 보일 때는 하단 장바구니 바를 숨김 */
  let formInView = false;
  const orderInfo = document.querySelector("#order-info");
  if (orderInfo && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      formInView = entry.isIntersecting;
      render();
    }).observe(orderInfo);
  }

  const lineOf = (p) => {
    const { qty, size } = cart[p.key];
    return {
      p,
      qty,
      size,
      kg: qty * p.unitKg,
      subtotal: p.price ? p.price * qty : null,
    };
  };

  const render = () => {
    products.forEach((p) => {
      const card = grid.querySelector(`[data-key="${p.key}"]`);
      const { qty } = cart[p.key];
      card.querySelector('[data-role="qty"]').value = qty;
      card.querySelector('[data-role="hint"]').textContent =
        qty > 0 ? `${qty}${p.unit} · 총 ${C.formatWeight(qty * p.unitKg)}` : `0${p.unit}`;
      card.classList.toggle("in-cart", qty > 0);
    });

    const lines = products.map(lineOf).filter((l) => l.qty > 0);
    cartCount.textContent = `${lines.length}개`;
    document.body.classList.toggle("has-cart-bar", lines.length > 0);

    if (lines.length === 0) {
      cartList.innerHTML = `<li class="muted">장바구니가 비어 있습니다. 위에서 무게나 수량을 골라 상품을 담아주세요.</li>`;
      cartTotal.innerHTML = "";
      cartBar.hidden = true;
      document.body.classList.remove("has-cart-bar");
      return;
    }

    cartList.innerHTML = lines
      .map(
        (l) => `
        <li>
          <span>${l.p.name}${l.size ? ` · ${l.size}` : ""}</span>
          <strong>${l.qty}${l.p.unit} (${C.formatWeight(l.kg)})</strong>
          <em>${l.subtotal !== null ? C.formatPrice(l.subtotal) : "가격 문의"}</em>
          <button type="button" class="cart-remove" data-remove="${l.p.key}" aria-label="${l.p.name} 빼기">✕</button>
        </li>`
      )
      .join("");

    const totalKg = lines.reduce((sum, l) => sum + l.kg, 0);
    const allPriced = lines.every((l) => l.subtotal !== null);
    const totalWon = lines.reduce((sum, l) => sum + (l.subtotal || 0), 0);
    cartTotal.innerHTML = `
      <span>총 중량 ${C.formatWeight(totalKg)}</span>
      <strong>${allPriced ? `합계 ${C.formatPrice(totalWon)}` : "합계 금액은 주문 확인 후 안내"}</strong>`;

    cartBar.hidden = formInView;
    cartBarText.textContent = `장바구니 ${lines.length}개 · ${C.formatWeight(totalKg)}`;
  };

  const setQty = (key, qty) => {
    cart[key].qty = Math.max(0, Math.min(999, Math.floor(Number(qty) || 0)));
    render();
  };

  grid.addEventListener("click", (e) => {
    const card = e.target.closest("[data-key]");
    if (!card) return;
    const key = card.dataset.key;
    const p = products.find((x) => x.key === key);

    const stepBtn = e.target.closest("[data-step]");
    if (stepBtn) setQty(key, cart[key].qty + Number(stepBtn.dataset.step));

    const kgBtn = e.target.closest("[data-kg]");
    if (kgBtn) setQty(key, Math.ceil(Number(kgBtn.dataset.kg) / p.unitKg));
  });

  grid.addEventListener("input", (e) => {
    const card = e.target.closest("[data-key]");
    if (!card) return;
    if (e.target.dataset.role === "qty") setQty(card.dataset.key, e.target.value);
    if (e.target.dataset.role === "size") cart[card.dataset.key].size = e.target.value;
    if (e.target.dataset.role === "size") render();
  });

  cartList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (btn) setQty(btn.dataset.remove, 0);
  });

  /* 취급상품 페이지에서 "주문하기"로 들어온 경우 해당 상품 1단위를 담아둠 */
  const addKey = new URLSearchParams(window.location.search).get("add");
  if (addKey && cart[addKey]) {
    cart[addKey].qty = 1;
    requestAnimationFrame(() =>
      document.querySelector(`#item-${addKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  }
  render();

  /* 라디오형 선택(주문 유형·결제 방법) 활성 표시 */
  const bindChoice = (name, onChange) => {
    const radios = form.querySelectorAll(`input[name="${name}"]`);
    const update = () => {
      radios.forEach((r) => r.closest(".pay-option")?.classList.toggle("active", r.checked));
      onChange(form.querySelector(`input[name="${name}"]:checked`)?.value);
    };
    radios.forEach((r) => r.addEventListener("change", update));
    update();
    return update;
  };

  const payDetails = form.querySelectorAll(".pay-detail");
  const updatePay = bindChoice("pay-method", (selected) => {
    payDetails.forEach((d) => (d.hidden = d.id !== `pay-detail-${selected}`));
  });
  const businessRow = document.querySelector("#business-row");
  const updateBuyer = bindChoice("buyer-type", (selected) => {
    businessRow.hidden = selected !== "사업자";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const val = (sel) => form.querySelector(sel)?.value.trim() || "";
    const name = val("#order-name");
    const phone = val("#order-phone");
    const address = val("#order-address");
    const company = val("#order-company");
    const note = val("#order-note");
    const buyerType = form.querySelector('input[name="buyer-type"]:checked')?.value || "개인";
    const payMethod = form.querySelector('input[name="pay-method"]:checked')?.value || "-";
    const onsiteType = val("#order-onsite-type");

    const lines = products.map(lineOf).filter((l) => l.qty > 0);
    if (lines.length === 0) {
      showStatus(status, "장바구니에 상품을 1개 이상 담아주세요.", false);
      return;
    }
    const missingSize = lines.find((l) => l.p.sizes && !l.size);
    if (missingSize) {
      showStatus(status, `${missingSize.p.name}의 사이즈를 선택해 주세요.`, false);
      document.querySelector(`#item-${missingSize.p.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!name || !phone || !address) {
      showStatus(status, "주문자명, 연락처, 배송지 주소를 입력해 주세요.", false);
      return;
    }

    const itemText = lines
      .map(
        (l) =>
          `- ${l.p.name}${l.size ? `(${l.size})` : ""} × ${l.qty}${l.p.unit} = ${C.formatWeight(l.kg)}` +
          (l.subtotal !== null ? `, ${C.formatPrice(l.subtotal)}` : "")
      )
      .join("\n");
    const totalKg = lines.reduce((sum, l) => sum + l.kg, 0);
    const payLine = payMethod === "현장결제" ? `${payMethod} (${onsiteType || "카드"})` : payMethod;

    const subject = encodeURIComponent(`[해밀푸드 온라인주문] ${buyerType} - ${name}`);
    const body = encodeURIComponent(
      `주문 유형: ${buyerType}\n` +
        (buyerType === "사업자" ? `상호명: ${company || "-"}\n` : "") +
        `주문자명: ${name}\n` +
        `연락처: ${phone}\n` +
        `배송지: ${address}\n` +
        `결제 방법: ${payLine}\n\n` +
        `주문 상품:\n${itemText}\n총 중량: ${C.formatWeight(totalKg)}\n\n` +
        `비고:\n${note || "-"}`
    );

    window.location.href = `mailto:info@hamilfood.co.kr?subject=${subject}&body=${body}`;
    showStatus(status, "메일 작성 화면으로 이동합니다. 전송을 완료해 주세요.", true);

    form.reset();
    products.forEach((p) => (cart[p.key] = { qty: 0, size: "" }));
    render();
    updatePay();
    updateBuyer();
  });
}

function showStatus(el, message, ok) {
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  el.classList.toggle("ok", ok);
}
