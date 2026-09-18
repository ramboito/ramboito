// ===================================================
// 해밀푸드 (Hamil Food) — 장부 입력/열람
// ===================================================
import { auth, db } from "./firebase-init.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const userLabel = document.querySelector("#ledger-user");
const logoutBtn = document.querySelector("#ledger-logout");
const form = document.querySelector("#ledger-form");
const statusEl = document.querySelector("#ledger-form-status");
const tbody = document.querySelector("#ledger-tbody");
const emptyEl = document.querySelector("#ledger-empty");
const sumIncomeEl = document.querySelector("#sum-income");
const sumExpenseEl = document.querySelector("#sum-expense");
const sumBalanceEl = document.querySelector("#sum-balance");

const won = (n) => `${n.toLocaleString("ko-KR")}원`;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  userLabel.textContent = user.email.split("@")[0];
  initLedger();
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

function initLedger() {
  const q = query(collection(db, "ledger"), orderBy("date", "desc"));

  onSnapshot(
    q,
    (snapshot) => {
      const entries = [];
      snapshot.forEach((docSnap) => entries.push({ id: docSnap.id, ...docSnap.data() }));
      renderEntries(entries);
    },
    (err) => {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--color-text-light);">불러오기 실패: ${err.message}</td></tr>`;
    }
  );
}

function renderEntries(entries) {
  if (entries.length === 0) {
    tbody.innerHTML = "";
    emptyEl.style.display = "block";
    sumIncomeEl.textContent = won(0);
    sumExpenseEl.textContent = won(0);
    sumBalanceEl.textContent = won(0);
    return;
  }
  emptyEl.style.display = "none";

  let income = 0;
  let expense = 0;

  tbody.innerHTML = entries
    .map((entry) => {
      const amount = Number(entry.amount) || 0;
      if (entry.type === "수입") income += amount;
      else expense += amount;

      const badgeClass = entry.type === "수입" ? "ledger-badge income" : "ledger-badge expense";
      const sign = entry.type === "수입" ? "+" : "-";

      return `
        <tr>
          <td>${entry.date || "-"}</td>
          <td><span class="${badgeClass}">${entry.type}</span></td>
          <td>${escapeHtml(entry.item || "-")}</td>
          <td class="ledger-amount ${entry.type === "수입" ? "plus" : "minus"}">${sign}${won(amount)}</td>
          <td>${escapeHtml(entry.memo || "-")}</td>
          <td><button type="button" class="ledger-delete" data-id="${entry.id}" aria-label="삭제">✕</button></td>
        </tr>
      `;
    })
    .join("");

  sumIncomeEl.textContent = won(income);
  sumExpenseEl.textContent = won(expense);
  sumBalanceEl.textContent = won(income - expense);

  tbody.querySelectorAll(".ledger-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("이 항목을 삭제할까요?")) return;
      await deleteDoc(doc(db, "ledger", btn.dataset.id));
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const date = document.querySelector("#ledger-date").value;
  const type = document.querySelector("#ledger-type").value;
  const item = document.querySelector("#ledger-item").value.trim();
  const amount = Number(document.querySelector("#ledger-amount").value);
  const memo = document.querySelector("#ledger-memo").value.trim();

  if (!date || !item || !amount) {
    showFormStatus("날짜, 항목, 금액을 입력해 주세요.", false);
    return;
  }

  try {
    await addDoc(collection(db, "ledger"), {
      date,
      type,
      item,
      amount,
      memo,
      createdBy: auth.currentUser.email,
      createdAt: serverTimestamp(),
    });
    form.reset();
    document.querySelector("#ledger-date").valueAsDate = new Date();
    showFormStatus("저장되었습니다.", true);
  } catch (err) {
    showFormStatus(`저장 실패: ${err.message}`, false);
  }
});

function showFormStatus(message, ok) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.add("show");
  statusEl.classList.toggle("ok", ok);
  setTimeout(() => statusEl.classList.remove("show"), 3000);
}

// 오늘 날짜 기본값
const dateInput = document.querySelector("#ledger-date");
if (dateInput) dateInput.valueAsDate = new Date();
