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

/* 온라인주문 폼 처리 (백엔드 연동 전: 메일 클라이언트로 전달) */
function initOrderForm() {
  const form = document.querySelector("#order-form");
  const status = document.querySelector("#order-status");
  if (!form) return;

  const products = [
    { key: "sundae", label: "순대" },
    { key: "tteok", label: "떡볶이 떡" },
    { key: "jeonbyeong", label: "메밀전병" },
    { key: "mandu", label: "만두" },
  ];

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.querySelector("#order-name").value.trim();
    const phone = form.querySelector("#order-phone").value.trim();
    const note = form.querySelector("#order-note").value.trim();

    const lines = [];
    products.forEach(({ key, label }) => {
      const size = form.querySelector(`#order-${key}-size`).value;
      const qty = form.querySelector(`#order-${key}-qty`).value;
      if (size || qty) {
        lines.push(`- ${label}: ${size || "사이즈 미선택"} / ${qty || "중량 미선택"}`);
      }
    });

    if (!name || !phone) {
      showStatus(status, "주문자명과 연락처를 입력해 주세요.", false);
      return;
    }
    if (lines.length === 0) {
      showStatus(status, "최소 1개 이상의 상품을 선택해 주세요.", false);
      return;
    }

    const subject = encodeURIComponent(`[해밀푸드 온라인주문] ${name}`);
    const body = encodeURIComponent(
      `주문자명: ${name}\n` +
        `연락처: ${phone}\n\n` +
        `주문 상품:\n${lines.join("\n")}\n\n` +
        `비고:\n${note || "-"}`
    );

    window.location.href = `mailto:info@hamilfood.co.kr?subject=${subject}&body=${body}`;
    showStatus(status, "메일 작성 화면으로 이동합니다. 전송을 완료해 주세요.", true);
    form.reset();
  });
}

function showStatus(el, message, ok) {
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  el.classList.toggle("ok", ok);
}
