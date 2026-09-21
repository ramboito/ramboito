// ===================================================
// 해밀푸드 (Hamil Food) — 통계 대시보드
// ===================================================
import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { renderTrendChart, renderDonutChart } from "./charts.js";

const userLabel = document.querySelector("#dash-user");
const logoutBtn = document.querySelector("#dash-logout");
const periodSelect = document.querySelector("#dash-period");

const won = (n) => `${Math.round(Number(n) || 0).toLocaleString("ko-KR")}원`;
const TYPES = ["매출", "수출", "수입", "지출"];
const BADGE_CLASS = { 매출: "sales", 수출: "export", 수입: "income", 지출: "expense" };
const DONUT_PALETTE = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#14b8a6", "#0ea5e9", "#6366f1", "#a855f7", "#ec4899", "#64748b"];

let entries = [];

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  userLabel.textContent = user.email.split("@")[0];
  initDashboard();
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

function initDashboard() {
  const q = query(collection(db, "ledger"), orderBy("date", "desc"));
  onSnapshot(
    q,
    (snapshot) => {
      entries = [];
      snapshot.forEach((docSnap) => entries.push({ id: docSnap.id, ...docSnap.data() }));
      renderDashboard();
    },
    (err) => {
      document.querySelector("#kpi-grid").innerHTML =
        `<p style="color:var(--color-text-light);">불러오기 실패: ${err.message}</p>`;
    }
  );
}

periodSelect.addEventListener("change", renderDashboard);

// ---------- period ranges ----------
function pad2(n) { return String(n).padStart(2, "0"); }
function isoDate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function startOfMonth(y, m) { return new Date(y, m, 1); }
function endOfMonth(y, m) { return new Date(y, m + 1, 0); }

function getPeriodRange(value) {
  const now = new Date();
  if (value === "this-month") {
    const s = startOfMonth(now.getFullYear(), now.getMonth());
    const e = endOfMonth(now.getFullYear(), now.getMonth());
    const pm = now.getMonth() - 1;
    const py = now.getFullYear() + (pm < 0 ? -1 : 0);
    const pmm = (pm + 12) % 12;
    return { start: s, end: e, prevStart: startOfMonth(py, pmm), prevEnd: endOfMonth(py, pmm), label: "이번 달" };
  }
  if (value === "last-month") {
    const m = now.getMonth() - 1;
    const y = now.getFullYear() + (m < 0 ? -1 : 0);
    const mm = (m + 12) % 12;
    const s = startOfMonth(y, mm);
    const e = endOfMonth(y, mm);
    const pm2 = mm - 1;
    const py2 = y + (pm2 < 0 ? -1 : 0);
    const pmm2 = (pm2 + 12) % 12;
    return { start: s, end: e, prevStart: startOfMonth(py2, pmm2), prevEnd: endOfMonth(py2, pmm2), label: "지난 달" };
  }
  if (value === "this-year") {
    const y = now.getFullYear();
    return {
      start: new Date(y, 0, 1), end: new Date(y, 11, 31),
      prevStart: new Date(y - 1, 0, 1), prevEnd: new Date(y - 1, 11, 31),
      label: "올해",
    };
  }
  return { start: null, end: null, prevStart: null, prevEnd: null, label: "전체" };
}

function inRange(dateStr, start, end) {
  if (!start || !end) return true;
  return dateStr >= isoDate(start) && dateStr <= isoDate(end);
}

function sumByType(list, range) {
  const sums = { 매출: 0, 수출: 0, 수입: 0, 지출: 0 };
  list.forEach((e) => {
    if (TYPES.includes(e.type) && inRange(e.date, range.start, range.end)) {
      sums[e.type] += Number(e.amount) || 0;
    }
  });
  return sums;
}

function delta(curV, prevV) {
  if (prevV === 0) return curV === 0 ? { pct: 0, isNew: false } : { pct: null, isNew: true };
  return { pct: ((curV - prevV) / Math.abs(prevV)) * 100, isNew: false };
}

function kpiBadgeHtml(pct, isNew, invert) {
  if (isNew) return '<span class="kpi-badge neutral">신규</span>';
  if (pct === 0) return '<span class="kpi-badge neutral">-</span>';
  const up = pct > 0;
  const good = invert ? !up : up;
  const arrow = up ? "▲" : "▼";
  return `<span class="kpi-badge ${good ? "good" : "bad"}">${arrow} ${Math.abs(pct).toFixed(1)}%</span>`;
}

function renderKPICards(cur, prev) {
  const curNet = cur.매출 + cur.수출 + cur.수입 - cur.지출;
  const prevNet = prev ? prev.매출 + prev.수출 + prev.수입 - prev.지출 : null;

  const cards = [
    { key: "매출", label: "총 매출", icon: "💰", invert: false, value: cur.매출, prevValue: prev ? prev.매출 : null },
    { key: "수출", label: "총 수출", icon: "🚢", invert: false, value: cur.수출, prevValue: prev ? prev.수출 : null },
    { key: "수입", label: "기타수입", icon: "💵", invert: false, value: cur.수입, prevValue: prev ? prev.수입 : null },
    { key: "지출", label: "총 지출", icon: "💸", invert: true, value: cur.지출, prevValue: prev ? prev.지출 : null },
    { key: "net", label: "순이익", icon: "📈", invert: false, value: curNet, prevValue: prevNet },
  ];

  document.querySelector("#kpi-grid").innerHTML = cards
    .map((c) => {
      const badge = c.prevValue === null ? "" : (() => {
        const d = delta(c.value, c.prevValue);
        return kpiBadgeHtml(d.pct, d.isNew, c.invert);
      })();
      return `
      <div class="kpi-card">
        <div class="kpi-icon">${c.icon}</div>
        <div>
          <div class="kpi-label">${c.label}</div>
          <div class="kpi-value">${won(c.value)}</div>
          ${badge}
        </div>
      </div>`;
    })
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function renderRecentTable() {
  const rows = entries.slice(0, 8);
  const tbody = document.querySelector("#recent-tbody");
  tbody.innerHTML = rows
    .map((e) => {
      const isIncome = e.type !== "지출";
      return `
      <tr>
        <td>${e.date || "-"}</td>
        <td><span class="ledger-badge ${BADGE_CLASS[e.type] || "expense"}">${e.type}</span></td>
        <td>${escapeHtml(e.item)}</td>
        <td class="ledger-amount ${isIncome ? "plus" : "minus"}">${isIncome ? "+" : "-"}${won(e.amount)}</td>
        <td>${escapeHtml(e.memo || "-")}</td>
      </tr>`;
    })
    .join("");
  document.querySelector("#recent-empty").style.display = rows.length ? "none" : "block";
}

function last12MonthsData(list) {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const sums = { 매출: 0, 수출: 0, 수입: 0, 지출: 0 };
    list.forEach((e) => {
      if (!e.date) return;
      const ed = new Date(e.date + "T00:00:00");
      if (ed.getFullYear() === y && ed.getMonth() === m && TYPES.includes(e.type)) {
        sums[e.type] += Number(e.amount) || 0;
      }
    });
    months.push(Object.assign({ label: `${m + 1}월` }, sums));
  }
  return months;
}

function expenseByItem(list, range) {
  const map = {};
  list
    .filter((e) => e.type === "지출" && inRange(e.date, range.start, range.end))
    .forEach((e) => {
      const key = e.item || "기타";
      map[key] = (map[key] || 0) + (Number(e.amount) || 0);
    });
  return map;
}

function renderDashboard() {
  const period = periodSelect.value;
  const range = getPeriodRange(period);
  const cur = sumByType(entries, range);
  const prev = period === "all" ? null : sumByType(entries, { start: range.prevStart, end: range.prevEnd });

  renderKPICards(cur, prev);
  renderRecentTable();

  renderTrendChart(document.querySelector("#trend-chart"), document.querySelector("#trend-legend"), last12MonthsData(entries));

  const itemMap = expenseByItem(entries, range);
  const donutData = Object.keys(itemMap)
    .sort((a, b) => itemMap[b] - itemMap[a])
    .map((label, i) => ({ label, value: itemMap[label], color: DONUT_PALETTE[i % DONUT_PALETTE.length] }));
  renderDonutChart(document.querySelector("#donut-chart"), document.querySelector("#donut-legend"), donutData);
  document.querySelector("#expense-breakdown-period").textContent = `${range.label} 기준`;
}
