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
  fillCatalogStats();
  initCatalog();
  initOrderForm();
  initProductDetail();
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
  let path = window.location.pathname.split("/").pop() || "index.html";
  if (path === "product.html") path = "order.html"; // 상품 상세는 온라인주문 메뉴로 표시
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

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* 카탈로그 숫자(브랜드 수·품목 수) 표시 */
/* ---------- 장바구니 공용 (온라인주문·상품상세) ---------- */
// cart: [{ id, option, mode: "each" | "box", qty }]
const CART_KEY = "hamil-cart-v1";
const cartLineKey = (l) => `${l.id}|${l.option || ""}|${l.mode}`;
function loadCart(C) {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((l) => C.byId(l.id) && l.qty > 0) : [];
  } catch (e) {
    return [];
  }
}
function storeCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    /* 저장이 막혀 있어도 주문은 가능 */
  }
}
function mergeIntoCart(cart, line) {
  const existing = cart.find((l) => cartLineKey(l) === cartLineKey(line));
  if (existing) existing.qty = Math.min(999, existing.qty + line.qty);
  else cart.push({ ...line });
  return cart;
}

let toastTimer;
function showToast(html) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.innerHTML = html;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 2600);
}

// 상품 사진 (없으면 종류별 아이콘 + "사진 준비중")
function productThumb(it, cls = "") {
  return it.images.length
    ? `<img class="${cls}" src="${escapeHtml(it.images[0])}" alt="${escapeHtml(it.name)}" loading="lazy" />`
    : `<span class="thumb-ph ${cls}" aria-hidden="true">${it.emoji}</span>`;
}
// "1봉 3,500원 · 1박스 65,000원" / "가격 문의"
function priceText(C, it) {
  if (!it.price && !it.boxPrice) return "";
  const parts = [];
  if (it.price) parts.push(`1${it.unit} ${C.formatWon(it.price)}`);
  if (it.boxPrice) parts.push(`1박스 ${C.formatWon(it.boxPrice)}`);
  return parts.join(" · ");
}

function fillCatalogStats() {
  const C = window.HamilCatalog;
  if (!C) return;
  document.querySelectorAll("[data-catalog-stat]").forEach((el) => {
    el.textContent = el.dataset.catalogStat === "brands" ? C.brands.length : C.items.length;
  });
}

/* 취급상품: 브랜드·카테고리 둘러보기 + 검색 → 온라인주문으로 연결 */
function initCatalog() {
  const C = window.HamilCatalog;
  const brandGrid = document.querySelector("#catalog-brands");
  const catGrid = document.querySelector("#catalog-categories");
  if (!C || (!brandGrid && !catGrid)) return;

  if (brandGrid) {
    brandGrid.innerHTML = C.brands
      .map(
        (b) => `
        <a class="browse-card" href="order.html?brand=${encodeURIComponent(b.short)}">
          <strong>${escapeHtml(b.name)}</strong>
          <span>${b.count}개 품목</span>
        </a>`
      )
      .join("");
  }
  if (catGrid) {
    catGrid.innerHTML = C.categories
      .map(
        (c) => `
        <a class="browse-card" href="order.html?category=${encodeURIComponent(c)}">
          <strong>${escapeHtml(c)}</strong>
          <span>${C.search("", { category: c }).length}개 품목</span>
        </a>`
      )
      .join("");
  }
}

/* 온라인주문: 검색 → 담기 → 주문서 작성 */
function initOrderForm() {
  const C = window.HamilCatalog;
  const list = document.querySelector("#shop-list");
  const form = document.querySelector("#order-form");
  if (!C || !list || !form) return;

  const $ = (sel) => document.querySelector(sel);
  const searchInput = $("#shop-search");
  const searchClear = $("#shop-search-clear");
  const catGroup = $("#shop-categories");
  const brandSelect = $("#shop-brand");
  const countEl = $("#shop-count");
  const emptyEl = $("#shop-empty");
  const status = $("#order-status");

  /* ---------- 장바구니 상태 (브라우저에 임시 저장) ---------- */
  let cart = loadCart(C);
  const saveCart = () => storeCart(cart);
  const describe = (it, qty, mode) => C.describeQty(it, qty, mode);

  /* ---------- 필터 상태 ---------- */
  const params = new URLSearchParams(window.location.search);
  let state = {
    q: params.get("q") || "",
    category: C.categories.includes(params.get("category")) ? params.get("category") : "전체",
    brand: C.brands.some((b) => b.short === params.get("brand")) ? params.get("brand") : "전체",
  };
  searchInput.value = state.q;

  catGroup.innerHTML = ["전체", ...C.categories]
    .map((c) => `<button type="button" class="chip" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
    .join("");
  brandSelect.innerHTML =
    `<option value="전체">전체 브랜드</option>` +
    C.brands.map((b) => `<option value="${escapeHtml(b.short)}">${escapeHtml(b.name)} (${b.count})</option>`).join("");
  brandSelect.value = state.brand;

  /* ---------- 상품 목록 ---------- */
  const rowHtml = (it) => {
    const inCart = cart.filter((l) => l.id === it.id);
    const unitInfo = [C.unitLabel(it), C.boxLabel(it)].filter(Boolean).join(" · ");
    const href = `product.html?id=${encodeURIComponent(it.id)}`;
    const price = priceText(C, it);
    return `
      <article class="prod-row${inCart.length ? " in-cart" : ""}" data-id="${it.id}">
        <div class="prod-info">
          <a class="prod-thumb" href="${href}" tabindex="-1" aria-hidden="true">${productThumb(it)}</a>
          <div class="prod-text">
            <div class="prod-meta">
              <span class="brand-tag">${escapeHtml(it.brand)}</span>
              <span class="prod-code">${it.code}</span>
            </div>
            <h3><a href="${href}">${escapeHtml(it.name)}</a></h3>
            <p class="prod-spec">규격 ${escapeHtml(it.spec)}<span class="prod-unit">${escapeHtml(unitInfo)}</span></p>
            <p class="prod-price${price ? "" : " ask"}">${price ? escapeHtml(price) : "가격 문의"}<a href="${href}" class="prod-more">상세보기 ›</a></p>
            ${inCart.length ? `<p class="prod-incart">✓ 장바구니에 담김</p>` : ""}
          </div>
        </div>
        <div class="prod-buy">
          ${
            it.options
              ? `<select class="prod-option" aria-label="${escapeHtml(it.name)} 옵션">
                  <option value="">옵션 선택</option>
                  ${it.options.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}
                </select>`
              : ""
          }
          <div class="prod-controls">
            ${
              it.boxCount
                ? `<div class="seg" role="group" aria-label="주문 단위">
                    <button type="button" class="seg-btn active" data-mode="each">${it.unit}</button>
                    <button type="button" class="seg-btn" data-mode="box">박스</button>
                  </div>`
                : ""
            }
            <div class="stepper stepper-sm">
              <button type="button" data-step="-1" aria-label="수량 줄이기">−</button>
              <input type="number" min="1" max="999" value="1" class="prod-qty" aria-label="수량" />
              <button type="button" data-step="1" aria-label="수량 늘리기">+</button>
            </div>
            <button type="button" class="btn btn-primary btn-sm prod-add">담기</button>
          </div>
          <p class="prod-calc"></p>
        </div>
      </article>`;
  };

  const updateRowCalc = (row) => {
    const it = C.byId(row.dataset.id);
    const mode = row.querySelector(".seg-btn.active")?.dataset.mode || "each";
    const qty = Math.max(1, parseInt(row.querySelector(".prod-qty").value, 10) || 1);
    const d = describe(it, qty, mode);
    const won = C.linePrice(it, qty, mode);
    row.querySelector(".prod-calc").textContent = `= ${d.head}${d.weight ? ` · ${d.weight}` : ""}${won ? ` · ${C.formatWon(won)}` : ""}`;
  };

  const renderList = () => {
    const results = C.search(state.q, { category: state.category, brand: state.brand });
    list.innerHTML = results.map(rowHtml).join("");
    list.querySelectorAll(".prod-row").forEach(updateRowCalc);
    emptyEl.hidden = results.length > 0;
    countEl.textContent = `${results.length}개 품목`;
    searchClear.hidden = !state.q;
    catGroup.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.category === state.category));

    const url = new URL(window.location.href);
    ["q", "category", "brand", "add", "view"].forEach((k) => url.searchParams.delete(k));
    if (state.q) url.searchParams.set("q", state.q);
    if (state.category !== "전체") url.searchParams.set("category", state.category);
    if (state.brand !== "전체") url.searchParams.set("brand", state.brand);
    history.replaceState(null, "", url);
  };

  let searchTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.q = searchInput.value.trim();
      renderList();
    }, 120);
  });
  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    state.q = "";
    renderList();
    searchInput.focus();
  });
  catGroup.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.category = chip.dataset.category;
    renderList();
  });
  brandSelect.addEventListener("change", () => {
    state.brand = brandSelect.value;
    renderList();
  });

  /* ---------- 목록에서 담기 ---------- */
  const addToCart = (id, option, mode, qty) => {
    mergeIntoCart(cart, { id, option, mode, qty });
    saveCart();
    renderCart();
  };

  list.addEventListener("click", (e) => {
    const row = e.target.closest(".prod-row");
    if (!row) return;
    const it = C.byId(row.dataset.id);
    const qtyInput = row.querySelector(".prod-qty");

    const seg = e.target.closest(".seg-btn");
    if (seg) {
      row.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b === seg));
      updateRowCalc(row);
      return;
    }
    const step = e.target.closest("[data-step]");
    if (step) {
      const next = (parseInt(qtyInput.value, 10) || 1) + Number(step.dataset.step);
      qtyInput.value = Math.min(999, Math.max(1, next));
      updateRowCalc(row);
      return;
    }
    if (e.target.closest(".prod-add")) {
      const optSelect = row.querySelector(".prod-option");
      const option = optSelect ? optSelect.value : "";
      if (optSelect && !option) {
        optSelect.classList.add("needs-choice");
        optSelect.focus();
        showToast("옵션을 먼저 선택해 주세요.");
        return;
      }
      const mode = row.querySelector(".seg-btn.active")?.dataset.mode || "each";
      const qty = Math.max(1, Math.min(999, parseInt(qtyInput.value, 10) || 1));
      addToCart(it.id, option, mode, qty);
      row.classList.add("in-cart");
      if (!row.querySelector(".prod-incart")) {
        row.querySelector(".prod-text").insertAdjacentHTML("beforeend", `<p class="prod-incart">✓ 장바구니에 담김</p>`);
      }
      qtyInput.value = 1;
      updateRowCalc(row);
      showToast(escapeHtml(`${it.name}${option ? `(${option})` : ""} ${describe(it, qty, mode).head} 담았습니다.`));
    }
  });
  list.addEventListener("input", (e) => {
    const row = e.target.closest(".prod-row");
    if (!row) return;
    if (e.target.classList.contains("prod-option")) e.target.classList.remove("needs-choice");
    if (e.target.classList.contains("prod-qty")) updateRowCalc(row);
  });
  list.addEventListener("change", (e) => {
    if (!e.target.classList.contains("prod-qty")) return;
    e.target.value = Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1));
    updateRowCalc(e.target.closest(".prod-row"));
  });

  /* ---------- 장바구니 (사이드 + 주문서) ---------- */
  const lineView = (l, i) => {
    const it = C.byId(l.id);
    const d = describe(it, l.qty, l.mode);
    const won = C.linePrice(it, l.qty, l.mode);
    return `
      <li data-index="${i}">
        <div class="cart-line-info">
          <strong><a href="product.html?id=${encodeURIComponent(it.id)}">${escapeHtml(it.name)}</a>${l.option ? ` <em>(${escapeHtml(l.option)})</em>` : ""}</strong>
          <span>${escapeHtml(it.brand)} · ${d.head}${d.weight ? ` · ${d.weight}` : ""}</span>
          <span class="cart-line-price">${won ? C.formatWon(won) : "가격 문의"}</span>
        </div>
        <div class="stepper stepper-xs">
          <button type="button" data-cart-step="-1" aria-label="수량 줄이기">−</button>
          <span>${l.qty}</span>
          <button type="button" data-cart-step="1" aria-label="수량 늘리기">+</button>
        </div>
        <button type="button" class="cart-remove" data-cart-remove aria-label="${escapeHtml(it.name)} 빼기">✕</button>
      </li>`;
  };

  const shipMethod = () => form.querySelector('input[name="ship-method"]:checked')?.value || C.shipping.methods[0].id;
  const summary = () => {
    let grams = 0;
    let ml = 0;
    let unknownWeight = 0;
    let approx = false;
    let subtotal = 0;
    let unpriced = 0;
    cart.forEach((l) => {
      const it = C.byId(l.id);
      const d = describe(it, l.qty, l.mode);
      if (it.approx) approx = true;
      if (!it.unitAmount) unknownWeight += 1;
      else if (it.amountBase === "ml") ml += it.unitAmount * d.pieces;
      else grams += it.unitAmount * d.pieces;
      const won = C.linePrice(it, l.qty, l.mode);
      if (won) subtotal += won;
      else unpriced += 1;
    });
    const parts = [];
    if (grams) parts.push(C.formatAmount(grams, "g"));
    if (ml) parts.push(C.formatAmount(ml, "ml"));
    const weight = parts.length ? `${approx ? "약 " : ""}${parts.join(" + ")}` : "";
    const fee = C.shippingFee(shipMethod(), subtotal, unpriced === 0);
    return { weight, unknownWeight, subtotal, unpriced, fee };
  };

  // withShipping: 주문서에서만 배송비·합계 표시
  const totals = (withShipping) => {
    const t = summary();
    const row = (label, value) => `<div class="total-row"><span>${label}</span><strong>${value}</strong></div>`;
    const rows = [
      row(
        `총 ${cart.length}개 품목`,
        `${t.weight}${t.unknownWeight ? `${t.weight ? " " : ""}<small>(중량 미표기 ${t.unknownWeight}건)</small>` : ""}`
      ),
      row(
        "상품금액",
        t.unpriced === cart.length
          ? `<small>주문 확인 후 안내</small>`
          : `${C.formatWon(t.subtotal)}${t.unpriced ? ` <small>+ 가격 문의 ${t.unpriced}건</small>` : ""}`
      ),
    ];
    if (withShipping) {
      rows.push(row("배송비", t.fee === null ? `<small>주문 확인 후 안내</small>` : t.fee === 0 ? "무료" : C.formatWon(t.fee)));
      if (!t.unpriced && t.fee !== null) rows.push(`<div class="total-row grand"><span>결제 예정 금액</span><strong>${C.formatWon(t.subtotal + t.fee)}</strong></div>`);
    }
    return rows.join("");
  };

  const cartBar = $("#cart-bar");
  const renderCart = () => {
    const linesHtml = cart.length
      ? cart.map(lineView).join("")
      : `<li class="cart-empty">아직 담은 상품이 없습니다.<br />검색해서 <b>담기</b>를 눌러주세요.</li>`;
    ["#cart-lines", "#checkout-lines"].forEach((sel) => ($(sel).innerHTML = linesHtml));
    $("#cart-total").innerHTML = cart.length ? totals(false) : "";
    $("#checkout-total").innerHTML = cart.length ? totals(true) : "";
    $("#cart-count").textContent = cart.length;
    $("#checkout-count").textContent = cart.length;
    $("#go-checkout").disabled = cart.length === 0;
    $("#cart-clear").hidden = cart.length === 0;

    const onShop = !$("#shop-view").hidden;
    cartBar.hidden = !(onShop && cart.length);
    $("#cart-bar-text").textContent = `장바구니 ${cart.length}개 품목`;
    document.body.classList.toggle("has-cart-bar", !cartBar.hidden);
  };

  const onCartClick = (e) => {
    const li = e.target.closest("li[data-index]");
    if (!li) return;
    const line = cart[Number(li.dataset.index)];
    const step = e.target.closest("[data-cart-step]");
    if (step) {
      line.qty = Math.min(999, line.qty + Number(step.dataset.cartStep));
      if (line.qty <= 0) cart.splice(Number(li.dataset.index), 1);
    } else if (e.target.closest("[data-cart-remove]")) {
      cart.splice(Number(li.dataset.index), 1);
    } else {
      return;
    }
    saveCart();
    renderCart();
    if (!cart.length && !$("#checkout-view").hidden) showView("shop");
    if (!cart.some((l) => l.id === line.id)) {
      const row = list.querySelector(`.prod-row[data-id="${line.id}"]`);
      row?.classList.remove("in-cart");
      row?.querySelector(".prod-incart")?.remove();
    }
  };
  $("#cart-lines").addEventListener("click", onCartClick);
  $("#checkout-lines").addEventListener("click", onCartClick);

  $("#cart-clear").addEventListener("click", () => {
    if (!confirm("장바구니를 모두 비울까요?")) return;
    cart = [];
    saveCart();
    renderCart();
    renderList();
  });

  /* ---------- 단계 전환: 상품 담기 ↔ 주문서 ---------- */
  const showView = (view) => {
    $("#shop-view").hidden = view !== "shop";
    $("#checkout-view").hidden = view !== "checkout";
    renderCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (view === "checkout") setTimeout(() => $("#order-name").focus({ preventScroll: true }), 300);
  };
  $("#go-checkout").addEventListener("click", () => showView("checkout"));
  $("#cart-bar-go").addEventListener("click", () => showView("checkout"));
  $("#back-to-shop").addEventListener("click", () => {
    showView("shop");
    renderList();
  });

  /* ---------- 라디오 선택(주문 유형·결제) ---------- */
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
  $("#ship-options").innerHTML = C.shipping.methods
    .map(
      (m, i) =>
        `<label class="pay-option${i ? "" : " active"}"><input type="radio" name="ship-method" value="${m.id}"${i ? "" : " checked"} /> ${escapeHtml(m.name)}${
          m.fee ? ` <small>${C.formatWon(m.fee)}</small>` : ""
        }</label>`
    )
    .join("");
  bindChoice("ship-method", (v) => {
    const m = C.shipping.methods.find((x) => x.id === v);
    const pickup = v === "pickup";
    $("#ship-note").textContent = [
      m.summary,
      m.freeOver ? `${C.formatWon(m.freeOver)} 이상 무료` : "",
      m.minOrder ? `최소 주문 ${C.formatWon(m.minOrder)}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    $("#address-field").hidden = pickup;
    $("#order-date-label").textContent = pickup ? "희망 수령일" : "희망 배송일";
    renderCart();
  });
  const payDetails = form.querySelectorAll(".pay-detail");
  bindChoice("pay-method", (v) => payDetails.forEach((d) => (d.hidden = d.id !== `pay-detail-${v}`)));
  bindChoice("buyer-type", (v) => ($("#business-row").hidden = v !== "사업자"));

  /* ---------- 주문서 텍스트 ---------- */
  const val = (sel) => form.querySelector(sel)?.value.trim() || "";
  const buildOrderText = () => {
    const buyerType = form.querySelector('input[name="buyer-type"]:checked')?.value || "개인";
    const payMethod = form.querySelector('input[name="pay-method"]:checked')?.value || "-";
    const pay = payMethod === "현장결제" ? `${payMethod}(${val("#order-onsite-type") || "카드"})` : payMethod;
    const lines = cart.map((l, i) => {
      const it = C.byId(l.id);
      const d = describe(it, l.qty, l.mode);
      const won = C.linePrice(it, l.qty, l.mode);
      return `${i + 1}. [${it.brand}] ${it.name}${l.option ? ` - 옵션: ${l.option}` : ""} (${it.code})\n    ${d.head}${d.weight ? ` · ${d.weight}` : ""} · ${won ? C.formatWon(won) : "가격 문의"}`;
    });
    const totalText = totals(true)
      .replace(/<\/div>/g, "\n")
      .replace(/<\/span>/g, ": ")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+/g, " ")
      .trim();
    const ship = C.shipping.methods.find((m) => m.id === shipMethod());
    return [
      "[해밀푸드 주문서]",
      `주문 유형: ${buyerType}${buyerType === "사업자" && val("#order-company") ? ` (상호: ${val("#order-company")})` : ""}`,
      `주문자: ${val("#order-name")} / ${val("#order-phone")}`,
      `수령 방법: ${ship.name}`,
      ...(ship.id === "pickup" ? [] : [`배송지: ${val("#order-address")}`]),
      `${ship.id === "pickup" ? "희망 수령일" : "희망 배송일"}: ${val("#order-date") || "-"}`,
      `결제 방법: ${pay}`,
      "",
      "■ 주문 상품",
      ...lines,
      "",
      totalText,
      `비고: ${val("#order-note") || "-"}`,
    ].join("\n");
  };

  const validate = () => {
    if (!cart.length) {
      showStatus(status, "장바구니에 상품을 1개 이상 담아주세요.", false);
      return false;
    }
    const missing = [
      ["#order-name", "주문자명"],
      ["#order-phone", "연락처"],
      ...(shipMethod() === "pickup" ? [] : [["#order-address", "배송지 주소"]]),
    ].filter(([sel]) => !val(sel));
    if (missing.length) {
      showStatus(status, `다음 항목을 입력해 주세요: ${missing.map((m) => m[1]).join(", ")}`, false);
      $(missing[0][0]).focus();
      return false;
    }
    return true;
  };

  $("#copy-order").addEventListener("click", async () => {
    if (!validate()) return;
    const text = buildOrderText();
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    showStatus(status, "주문 내용을 복사했습니다. 카카오톡 채팅방에 붙여넣어 보내주세요.", true);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;
    const text = buildOrderText();
    const subject = encodeURIComponent(`[해밀푸드 주문] ${val("#order-name")} (${cart.length}개 품목)`);
    window.location.href = `mailto:info@hamilfood.co.kr?subject=${subject}&body=${encodeURIComponent(text)}`;
    showStatus(
      status,
      text.length > 1500
        ? "메일 앱이 열립니다. 주문이 길어 내용이 잘릴 수 있으니 '주문내용 복사'도 함께 이용해 주세요."
        : "메일 앱이 열립니다. 전송 버튼을 눌러 주문을 완료해 주세요.",
      true
    );
  });

  /* ---------- 시작 ---------- */
  const addId = params.get("add");
  renderList();
  renderCart();
  if (params.get("view") === "checkout" && cart.length) showView("checkout");
  if (addId && C.byId(addId)) {
    const row = list.querySelector(`.prod-row[data-id="${addId}"]`);
    if (row) {
      row.classList.add("highlight");
      requestAnimationFrame(() => row.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
  }
}

/* ===================================================
   상품 상세 (product.html?id=JY-01)
   =================================================== */
function initProductDetail() {
  const C = window.HamilCatalog;
  const root = document.querySelector("#pd-root");
  if (!C || !root) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const it = id && C.byId(id);
  if (!it) {
    root.innerHTML = `
      <div class="shop-empty">
        <strong>상품을 찾을 수 없습니다.</strong>
        <p>판매가 종료되었거나 주소가 잘못되었을 수 있습니다.</p>
        <a href="order.html" class="btn btn-primary btn-sm" style="margin-top:14px;">전체 상품 보기</a>
      </div>`;
    return;
  }

  document.title = `${it.name} | 해밀푸드 온라인주문`;
  const crumb = document.querySelector("#pd-crumb");
  if (crumb) {
    crumb.innerHTML = `<a href="order.html">온라인주문</a> / <a href="order.html?category=${encodeURIComponent(it.category)}">${escapeHtml(
      it.category
    )}</a> / <span>${escapeHtml(it.name)}</span>`;
  }

  const S = C.shipping;
  const courier = S.methods.find((m) => m.id === "courier") || S.methods[0];
  const unitInfo = C.unitLabel(it);
  const boxInfo = C.boxLabel(it);
  const hasPrice = it.price || it.boxPrice;

  const gallery = it.images.length
    ? `<div class="pd-main-img"><img id="pd-img" src="${escapeHtml(it.images[0])}" alt="${escapeHtml(it.name)}" /></div>
       ${
         it.images.length > 1
           ? `<div class="pd-thumbs">${it.images
               .map(
                 (src, i) =>
                   `<button type="button" class="pd-thumb${i ? "" : " active"}" data-src="${escapeHtml(src)}"><img src="${escapeHtml(src)}" alt="" loading="lazy" /></button>`
               )
               .join("")}</div>`
           : ""
       }`
    : `<div class="pd-main-img pd-ph"><span>${it.emoji}</span><p>상품 사진 준비중</p></div>`;

  const priceBlock = hasPrice
    ? `<div class="pd-price">
        ${it.price ? `<div><span>1${it.unit}</span><strong>${C.formatWon(it.price)}</strong></div>` : ""}
        ${it.boxPrice ? `<div><span>1박스 (${it.boxCount}${it.unit})</span><strong>${C.formatWon(it.boxPrice)}</strong></div>` : ""}
        <small>부가세 포함</small>
      </div>`
    : `<div class="pd-price ask">
        <strong>가격 문의</strong>
        <small>주문을 남겨주시면 확인 후 가격을 안내해 드립니다.</small>
      </div>`;

  const shipLine = `${courier.name} ${C.formatWon(courier.fee)}${courier.freeOver ? ` (${C.formatWon(courier.freeOver)} 이상 무료)` : ""}`;

  const descText = it.desc
    ? it.desc.split("\n").map((p) => `<p>${escapeHtml(p)}</p>`).join("")
    : `<p>${escapeHtml(it.brandName)}의 <b>${escapeHtml(it.name)}</b> 상품입니다.</p>
       <p>${escapeHtml([unitInfo, boxInfo].filter(Boolean).join(", "))} 단위로 주문하실 수 있습니다.</p>
       <p class="pd-muted">상세 설명과 사진은 준비 중입니다. 궁금한 점은 전화나 카카오톡으로 문의해 주세요.</p>`;

  const related = C.items.filter((x) => x.category === it.category && x.id !== it.id);
  const sameBrand = related.filter((x) => x.brand === it.brand);
  const picks = [...sameBrand, ...related.filter((x) => x.brand !== it.brand)].slice(0, 8);

  root.innerHTML = `
    <div class="pd-top">
      <div class="pd-gallery">${gallery}</div>

      <div class="pd-info">
        <div class="prod-meta">
          <a class="brand-tag" href="order.html?brand=${encodeURIComponent(it.brand)}">${escapeHtml(it.brandName)}</a>
          <span class="prod-code">품목코드 ${it.code}</span>
        </div>
        <h1 class="pd-name">${escapeHtml(it.name)}</h1>
        ${priceBlock}

        <dl class="pd-facts">
          <div><dt>규격</dt><dd>${escapeHtml(it.spec)}</dd></div>
          <div><dt>판매 단위</dt><dd>${escapeHtml(unitInfo)}${boxInfo ? `<br /><span class="pd-muted">${escapeHtml(boxInfo)}</span>` : ""}</dd></div>
          <div><dt>보관 방법</dt><dd>${escapeHtml(it.storage)}</dd></div>
          <div><dt>배송비</dt><dd>${escapeHtml(shipLine)}<br /><span class="pd-muted">직배송·방문 수령은 무료 · <a href="#pd-shipping">자세히</a></span></dd></div>
          <div><dt>출고</dt><dd>${escapeHtml(S.cutoff)}</dd></div>
        </dl>

        <div class="pd-buy">
          ${
            it.options
              ? `<label class="pd-label" for="pd-option">옵션 <span class="required">*</span></label>
                 <select id="pd-option" class="prod-option">
                   <option value="">옵션을 선택해 주세요</option>
                   ${it.options.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}
                 </select>`
              : ""
          }
          <div class="pd-qty-row">
            ${
              it.boxCount
                ? `<div class="seg" role="group" aria-label="주문 단위">
                    <button type="button" class="seg-btn active" data-mode="each">${it.unit} 단위</button>
                    <button type="button" class="seg-btn" data-mode="box">박스 단위</button>
                  </div>`
                : `<span class="pd-muted">${it.unit} 단위 주문</span>`
            }
            <div class="stepper">
              <button type="button" data-step="-1" aria-label="수량 줄이기">−</button>
              <input type="number" id="pd-qty" min="1" max="999" value="1" aria-label="수량" />
              <button type="button" data-step="1" aria-label="수량 늘리기">+</button>
            </div>
          </div>
          <div class="pd-calc">
            <span id="pd-calc-qty"></span>
            <strong id="pd-calc-price"></strong>
          </div>
          <div class="pd-actions">
            <button type="button" class="btn btn-outline" id="pd-add">장바구니 담기</button>
            <button type="button" class="btn btn-primary" id="pd-buy">바로 주문하기</button>
          </div>
          <p class="pd-incart" id="pd-incart" hidden></p>
        </div>
      </div>
    </div>

    <nav class="pd-tabs" aria-label="상품 정보 바로가기">
      <a href="#pd-desc">상세정보</a>
      <a href="#pd-spec">상품정보 고시</a>
      <a href="#pd-shipping">배송·교환·반품</a>
    </nav>

    <section class="pd-block" id="pd-desc">
      <h2>상세정보</h2>
      <div class="pd-desc">${descText}</div>
      ${it.images.length > 1 ? `<div class="pd-desc-imgs">${it.images.map((src) => `<img src="${escapeHtml(src)}" alt="" loading="lazy" />`).join("")}</div>` : ""}
    </section>

    <section class="pd-block" id="pd-spec">
      <h2>상품정보 고시</h2>
      <table class="pd-table">
        <tr><th>제품명</th><td>${escapeHtml(it.name)}</td></tr>
        <tr><th>브랜드 / 제조원</th><td>${escapeHtml(it.maker || it.brandName)}</td></tr>
        <tr><th>품목코드</th><td>${it.code}</td></tr>
        <tr><th>분류</th><td>${escapeHtml(it.category)}</td></tr>
        <tr><th>규격 (중량·입수)</th><td>${escapeHtml(it.spec)}</td></tr>
        <tr><th>원산지</th><td>${escapeHtml(it.origin)}</td></tr>
        <tr><th>보관 방법</th><td>${escapeHtml(it.storage)}</td></tr>
        <tr><th>소비기한</th><td>상품 포장지 표기 참조</td></tr>
      </table>
    </section>

    <section class="pd-block" id="pd-shipping">
      <h2>배송·교환·반품 안내</h2>
      <div class="pd-ship-grid">
        ${S.methods
          .map(
            (m) => `
          <div class="pd-ship-card">
            <strong>${escapeHtml(m.name)}</strong>
            <em>${m.fee ? C.formatWon(m.fee) : "무료"}${m.freeOver ? ` · ${C.formatWon(m.freeOver)} 이상 무료` : ""}${m.minOrder ? ` · 최소 주문 ${C.formatWon(m.minOrder)}` : ""}</em>
            <p>${escapeHtml(m.summary)}</p>
            <ul>${m.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>
          </div>`
          )
          .join("")}
      </div>
      <p class="pd-cutoff">${escapeHtml(S.cutoff)}</p>
      <h3>교환·반품</h3>
      <ul class="pd-list">${S.returns.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
    </section>

    ${
      picks.length
        ? `<section class="pd-block">
            <h2>같은 종류 상품</h2>
            <div class="pd-related">
              ${picks
                .map(
                  (x) => `
                <a class="pd-rel-card" href="product.html?id=${encodeURIComponent(x.id)}">
                  <div class="pd-rel-img">${productThumb(x)}</div>
                  <span class="brand-tag">${escapeHtml(x.brand)}</span>
                  <strong>${escapeHtml(x.name)}</strong>
                  <small>${escapeHtml(priceText(C, x) || "가격 문의")}</small>
                </a>`
                )
                .join("")}
            </div>
          </section>`
        : ""
    }`;

  /* ---------- 구매 영역 동작 ---------- */
  const $ = (sel) => root.querySelector(sel);
  const qtyInput = $("#pd-qty");
  const optSelect = $("#pd-option");
  const mode = () => root.querySelector(".seg-btn.active")?.dataset.mode || "each";
  const qty = () => Math.max(1, Math.min(999, parseInt(qtyInput.value, 10) || 1));

  const updateCalc = () => {
    const d = C.describeQty(it, qty(), mode());
    const won = C.linePrice(it, qty(), mode());
    $("#pd-calc-qty").textContent = `${d.head}${d.weight ? ` · ${d.weight}` : ""}`;
    $("#pd-calc-price").textContent = won ? C.formatWon(won) : "가격 문의";
  };
  const updateInCart = () => {
    const lines = loadCart(C).filter((l) => l.id === it.id);
    const el = $("#pd-incart");
    el.hidden = !lines.length;
    if (lines.length) {
      el.innerHTML = `✓ 장바구니에 담김: ${lines
        .map((l) => escapeHtml(`${l.option ? `${l.option} ` : ""}${C.describeQty(it, l.qty, l.mode).head}`))
        .join(", ")} · <a href="order.html?view=checkout">주문서로 가기 ›</a>`;
    }
  };

  root.addEventListener("click", (e) => {
    const seg = e.target.closest(".seg-btn");
    if (seg) {
      root.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b === seg));
      updateCalc();
    }
    const step = e.target.closest("[data-step]");
    if (step) {
      qtyInput.value = Math.min(999, Math.max(1, qty() + Number(step.dataset.step)));
      updateCalc();
    }
    const thumb = e.target.closest(".pd-thumb");
    if (thumb) {
      $("#pd-img").src = thumb.dataset.src;
      root.querySelectorAll(".pd-thumb").forEach((t) => t.classList.toggle("active", t === thumb));
    }
  });
  qtyInput.addEventListener("input", updateCalc);
  qtyInput.addEventListener("change", () => {
    qtyInput.value = qty();
    updateCalc();
  });
  optSelect?.addEventListener("change", () => optSelect.classList.remove("needs-choice"));

  const add = () => {
    const option = optSelect ? optSelect.value : "";
    if (optSelect && !option) {
      optSelect.classList.add("needs-choice");
      optSelect.focus();
      showToast("옵션을 먼저 선택해 주세요.");
      return false;
    }
    const cart = mergeIntoCart(loadCart(C), { id: it.id, option, mode: mode(), qty: qty() });
    storeCart(cart);
    updateInCart();
    return { option, head: C.describeQty(it, qty(), mode()).head };
  };
  $("#pd-add").addEventListener("click", () => {
    const r = add();
    if (!r) return;
    showToast(`${escapeHtml(`${it.name}${r.option ? `(${r.option})` : ""} ${r.head}`)} 담았습니다. <a href="order.html?view=checkout">주문하기 ›</a>`);
    qtyInput.value = 1;
    updateCalc();
  });
  $("#pd-buy").addEventListener("click", () => {
    if (add()) window.location.href = "order.html?view=checkout";
  });

  updateCalc();
  updateInCart();
}

function showStatus(el, message, ok) {
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  el.classList.toggle("ok", ok);
}
