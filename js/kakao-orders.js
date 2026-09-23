// ===================================================
// 해밀푸드 (Hamil Food) — 카톡 주문 정리
// ===================================================
import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const userLabel = document.querySelector("#ko-user");
const logoutBtn = document.querySelector("#ko-logout");
const form = document.querySelector("#ko-form");
const rawEl = document.querySelector("#ko-raw");
const nameEl = document.querySelector("#ko-name");
const phoneEl = document.querySelector("#ko-phone");
const addressEl = document.querySelector("#ko-address");
const itemsEl = document.querySelector("#ko-items");
const statusEl = document.querySelector("#ko-status");
const memoEl = document.querySelector("#ko-memo");
const formMsg = document.querySelector("#ko-status-msg");
const tbody = document.querySelector("#ko-tbody");
const emptyEl = document.querySelector("#ko-empty");
const searchEl = document.querySelector("#ko-search");
const filterStatusEl = document.querySelector("#ko-filter-status");
const summaryEl = document.querySelector("#status-summary");

const STATUSES = ["신규", "처리중", "완료", "취소"];
const STATUS_CLASS = { 신규: "status-new", 처리중: "status-processing", 완료: "status-done", 취소: "status-cancelled" };
const STATUS_ICON = { 신규: "🆕", 처리중: "⏳", 완료: "✅", 취소: "✖️" };

let orders = [];
let editingId = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  userLabel.textContent = user.email.split("@")[0];
  initOrders();
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

function initOrders() {
  const q = query(collection(db, "kakaoOrders"), orderBy("createdAt", "desc"));
  onSnapshot(
    q,
    (snapshot) => {
      orders = [];
      snapshot.forEach((docSnap) => orders.push({ id: docSnap.id, ...docSnap.data() }));
      renderAll();
    },
    (err) => {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--color-text-light);">불러오기 실패: ${err.message}</td></tr>`;
    }
  );
}

// ---------- 카톡 메시지 자동 파싱 ----------
const LABELS = {
  name: ["이름", "성함", "주문자", "성명", "고객명"],
  phone: ["연락처", "전화", "전화번호", "휴대폰", "휴대전화", "폰", "핸드폰"],
  address: ["주소", "배송지", "배송주소"],
  items: ["상품", "주문내역", "메뉴", "주문상품", "품목"],
};

function parseKakaoText(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result = { name: "", phone: "", address: "", items: [] };
  const used = new Set();

  lines.forEach((line, idx) => {
    const m = line.match(/^([가-힣a-zA-Z\s]{1,12})\s*[:：]\s*(.+)$/);
    if (!m) return;
    const label = m[1].replace(/\s/g, "");
    const value = m[2].trim();
    for (const [field, keys] of Object.entries(LABELS)) {
      if (keys.includes(label)) {
        if (field === "items") result.items.push(value);
        else if (!result[field]) result[field] = value;
        used.add(idx);
      }
    }
  });

  if (!result.phone) {
    const phoneMatch = text.match(/01[0-9]-?\d{3,4}-?\d{4}/);
    if (phoneMatch) result.phone = phoneMatch[0];
  }

  if (!result.name && lines.length) {
    const first = lines[0];
    if (!used.has(0) && first.length <= 10 && !/\d/.test(first) && !/[:：]/.test(first)) {
      result.name = first;
      used.add(0);
    }
  }

  if (!result.items.length) {
    lines.forEach((line, idx) => {
      if (used.has(idx)) return;
      if (result.phone && line.includes(result.phone)) return;
      if (result.address && line === result.address) return;
      result.items.push(line);
    });
  }

  return { name: result.name, phone: result.phone, address: result.address, items: result.items.join("\n") };
}

document.querySelector("#ko-parse").addEventListener("click", () => {
  const text = rawEl.value.trim();
  if (!text) {
    showFormMsg("먼저 카톡 원문을 붙여넣어 주세요.", false);
    return;
  }
  const parsed = parseKakaoText(text);
  if (parsed.name) nameEl.value = parsed.name;
  if (parsed.phone) phoneEl.value = parsed.phone;
  if (parsed.address) addressEl.value = parsed.address;
  if (parsed.items) itemsEl.value = parsed.items;
  showFormMsg("자동으로 채웠습니다. 내용을 확인하고 필요하면 수정해 주세요.", true);
});

// 붙여넣기 직후에도 바로 한 번 시도 (편의 기능, 실패해도 무방)
rawEl.addEventListener("paste", () => {
  setTimeout(() => {
    if (nameEl.value || phoneEl.value || itemsEl.value) return; // 이미 입력된 값이 있으면 덮어쓰지 않음
    const parsed = parseKakaoText(rawEl.value.trim());
    if (parsed.name) nameEl.value = parsed.name;
    if (parsed.phone) phoneEl.value = parsed.phone;
    if (parsed.address) addressEl.value = parsed.address;
    if (parsed.items) itemsEl.value = parsed.items;
  }, 30);
});

function showFormMsg(message, ok) {
  formMsg.textContent = message;
  formMsg.classList.add("show");
  formMsg.classList.toggle("ok", ok);
  setTimeout(() => formMsg.classList.remove("show"), 3000);
}

function resetForm() {
  form.reset();
  editingId = null;
  document.querySelector('#ko-form button[type="submit"]').textContent = "주문 저장";
}

document.querySelector("#ko-reset").addEventListener("click", resetForm);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const rawText = rawEl.value.trim();
  if (!rawText) {
    showFormMsg("카톡 원문을 붙여넣어 주세요.", false);
    return;
  }

  const payload = {
    rawText,
    name: nameEl.value.trim(),
    phone: phoneEl.value.trim(),
    address: addressEl.value.trim(),
    items: itemsEl.value.trim(),
    status: statusEl.value,
    memo: memoEl.value.trim(),
  };

  try {
    if (editingId) {
      await updateDoc(doc(db, "kakaoOrders", editingId), payload);
      showFormMsg("주문을 수정했습니다.", true);
    } else {
      await addDoc(collection(db, "kakaoOrders"), {
        ...payload,
        source: "manual",
        createdBy: auth.currentUser.email,
        createdAt: serverTimestamp(),
      });
      showFormMsg("주문을 저장했습니다.", true);
    }
    resetForm();
  } catch (err) {
    showFormMsg(`저장 실패: ${err.message}`, false);
  }
});

[searchEl, filterStatusEl].forEach((el) => el.addEventListener("input", renderList));

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function formatTime(ts) {
  if (!ts || !ts.toDate) return "-";
  const d = ts.toDate();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderAll() {
  renderSummary();
  renderList();
}

function renderSummary() {
  const counts = { 신규: 0, 처리중: 0, 완료: 0, 취소: 0 };
  orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });

  summaryEl.innerHTML = STATUSES.map((s) => `
    <div class="kpi-card">
      <div class="kpi-icon">${STATUS_ICON[s]}</div>
      <div>
        <div class="kpi-label">${s}</div>
        <div class="kpi-value">${counts[s]}건</div>
      </div>
    </div>`).join("");
}

function filteredOrders() {
  const search = searchEl.value.trim().toLowerCase();
  const statusFilter = filterStatusEl.value;
  return orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const hay = `${o.name || ""} ${o.phone || ""} ${o.rawText || ""} ${o.items || ""}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

function renderList() {
  const rows = filteredOrders();
  emptyEl.style.display = rows.length ? "none" : "block";

  tbody.innerHTML = rows
    .map((o) => {
      const itemsPreview = (o.items || "-").split("\n")[0] + ((o.items || "").split("\n").length > 1 ? " …" : "");
      const isBot = o.source === "kakao-bot";
      return `
      <tr data-id="${o.id}">
        <td>${formatTime(o.createdAt)}</td>
        <td>
          <select class="status-select ${STATUS_CLASS[o.status] || ""}" data-id="${o.id}">
            ${STATUSES.map((s) => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
        <td><span class="source-badge ${isBot ? "source-bot" : "source-manual"}">${isBot ? "🤖 챗봇" : "✍️ 수동"}</span></td>
        <td>${escapeHtml(o.name || "-")}</td>
        <td>${escapeHtml(o.phone || "-")}</td>
        <td title="${escapeHtml(o.items || "")}">${escapeHtml(itemsPreview)}</td>
        <td><button type="button" class="icon-link-btn detail-toggle" data-id="${o.id}">원문보기</button></td>
        <td>
          <button type="button" class="icon-link-btn edit-btn" data-id="${o.id}">수정</button>
          <button type="button" class="icon-link-btn delete-btn" data-id="${o.id}">삭제</button>
        </td>
      </tr>
      <tr class="detail-row" id="detail-${o.id}" hidden>
        <td colspan="8">
          <div class="detail-box">
            <div><strong>주소</strong><span>${escapeHtml(o.address || "-")}</span></div>
            <div><strong>메모</strong><span>${escapeHtml(o.memo || "-")}</span></div>
            <div class="detail-raw"><strong>카톡 원문</strong><pre>${escapeHtml(o.rawText || "")}</pre></div>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll(".status-select").forEach((sel) => {
    sel.addEventListener("change", async () => {
      try {
        await updateDoc(doc(db, "kakaoOrders", sel.dataset.id), { status: sel.value });
      } catch (err) {
        alert(`상태 변경 실패: ${err.message}`);
      }
    });
  });

  tbody.querySelectorAll(".detail-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = document.querySelector(`#detail-${btn.dataset.id}`);
      if (!row) return;
      row.hidden = !row.hidden;
      btn.textContent = row.hidden ? "원문보기" : "접기";
    });
  });

  tbody.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const o = orders.find((x) => x.id === btn.dataset.id);
      if (!o) return;
      editingId = o.id;
      rawEl.value = o.rawText || "";
      nameEl.value = o.name || "";
      phoneEl.value = o.phone || "";
      addressEl.value = o.address || "";
      itemsEl.value = o.items || "";
      statusEl.value = o.status || "신규";
      memoEl.value = o.memo || "";
      document.querySelector('#ko-form button[type="submit"]').textContent = "수정 저장";
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  tbody.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("이 주문을 삭제할까요?")) return;
      await deleteDoc(doc(db, "kakaoOrders", btn.dataset.id));
    });
  });
}
