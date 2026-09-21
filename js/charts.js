// ===================================================
// 해밀푸드 (Hamil Food) — 외부 라이브러리 없는 순수 SVG 차트
// ===================================================
const SVG_NS = "http://www.w3.org/2000/svg";

function el(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  Object.keys(attrs || {}).forEach((k) => node.setAttribute(k, attrs[k]));
  return node;
}

function abbreviate(n) {
  const abs = Math.abs(n);
  if (abs >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, "") + "억";
  if (abs >= 10000) return (n / 10000).toFixed(0) + "만";
  return String(n);
}

export const COLORS = {
  매출: "#3b82f6",
  수출: "#8b5cf6",
  수입: "#10b981",
  지출: "#ef4444",
};

function emptyState(container, message) {
  container.innerHTML = "";
  const p = document.createElement("p");
  p.className = "chart-empty";
  p.textContent = message;
  container.appendChild(p);
}

/**
 * months: [{ label, 매출, 수출, 수입, 지출 }]
 */
export function renderTrendChart(container, legendContainer, months) {
  container.innerHTML = "";
  if (legendContainer) legendContainer.innerHTML = "";

  const hasData = months.some((m) => m.매출 + m.수출 + m.수입 + m.지출 > 0);
  if (!months.length || !hasData) {
    emptyState(container, "표시할 데이터가 없습니다.");
    return;
  }

  const W = 760;
  const H = 260;
  const pad = { top: 16, right: 12, bottom: 26, left: 56 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const maxStack = Math.max(...months.map((m) => m.매출 + m.수출 + m.수입));
  const maxExpense = Math.max(...months.map((m) => m.지출));
  const maxVal = Math.max(maxStack, maxExpense, 1);
  const scale = chartH / maxVal;

  const groupW = chartW / months.length;
  const barW = Math.min(28, groupW * 0.5);

  const svg = el("svg", {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "xMidYMid meet",
    class: "chart-svg",
    role: "img",
    "aria-label": "월별 매출/수출/수입/지출 추이",
  });

  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const val = (maxVal / gridSteps) * i;
    const y = pad.top + chartH - val * scale;
    svg.appendChild(el("line", { x1: pad.left, x2: W - pad.right, y1: y, y2: y, class: "grid-line" }));
    const label = el("text", { x: pad.left - 8, y: y + 4, class: "axis-label", "text-anchor": "end" });
    label.textContent = abbreviate(Math.round(val));
    svg.appendChild(label);
  }

  const linePoints = [];

  months.forEach((m, i) => {
    const groupX = pad.left + i * groupW + (groupW - barW) / 2;
    let yCursor = pad.top + chartH;

    ["매출", "수출", "수입"].forEach((key) => {
      const val = m[key] || 0;
      if (val <= 0) return;
      const h = val * scale;
      yCursor -= h;
      const rect = el("rect", { x: groupX, y: yCursor, width: barW, height: h, fill: COLORS[key], rx: 2 });
      const title = el("title", {});
      title.textContent = `${m.label} ${key}: ${val.toLocaleString("ko-KR")}원`;
      rect.appendChild(title);
      svg.appendChild(rect);
    });

    const cx = groupX + barW / 2;
    const cy = pad.top + chartH - (m.지출 || 0) * scale;
    linePoints.push([cx, cy]);

    const showLabel = months.length <= 12 || i % 2 === 0;
    if (showLabel) {
      const xLabel = el("text", { x: cx, y: H - 6, class: "axis-label", "text-anchor": "middle" });
      xLabel.textContent = m.label;
      svg.appendChild(xLabel);
    }
  });

  if (linePoints.length > 1) {
    const d = linePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
    svg.appendChild(el("path", { d, class: "expense-line" }));
  }
  linePoints.forEach(([cx, cy], i) => {
    const dot = el("circle", { cx, cy, r: 3, class: "expense-dot" });
    const val = months[i].지출 || 0;
    const title = el("title", {});
    title.textContent = `${months[i].label} 지출: ${val.toLocaleString("ko-KR")}원`;
    dot.appendChild(title);
    svg.appendChild(dot);
  });

  container.appendChild(svg);

  if (legendContainer) {
    const items = [
      { label: "매출", color: COLORS.매출 },
      { label: "수출", color: COLORS.수출 },
      { label: "수입", color: COLORS.수입 },
      { label: "지출 (선)", color: COLORS.지출 },
    ];
    items.forEach((it) => {
      const span = document.createElement("span");
      span.className = "legend-item";
      span.innerHTML = `<i style="background:${it.color}"></i>${it.label}`;
      legendContainer.appendChild(span);
    });
  }
}

/**
 * data: [{ label, value, color }]
 */
export function renderDonutChart(container, legendContainer, data) {
  container.innerHTML = "";
  if (legendContainer) legendContainer.innerHTML = "";

  const filtered = data.filter((d) => d.value > 0);
  const total = filtered.reduce((sum, d) => sum + d.value, 0);

  if (!total) {
    emptyState(container, "표시할 지출 데이터가 없습니다.");
    return;
  }

  const size = 220;
  const r = 80;
  const strokeW = 30;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const svg = el("svg", { viewBox: `0 0 ${size} ${size}`, class: "donut-svg", role: "img", "aria-label": "지출 항목 비중" });

  svg.appendChild(el("circle", { cx, cy, r, fill: "none", stroke: "var(--color-bg-alt)", "stroke-width": strokeW }));

  let offset = 0;
  filtered.forEach((d) => {
    const frac = d.value / total;
    const len = frac * circumference;
    const circle = el("circle", {
      cx, cy, r,
      fill: "none",
      stroke: d.color,
      "stroke-width": strokeW,
      "stroke-dasharray": `${len} ${circumference - len}`,
      "stroke-dashoffset": -offset,
      transform: `rotate(-90 ${cx} ${cy})`,
    });
    const title = el("title", {});
    title.textContent = `${d.label}: ${d.value.toLocaleString("ko-KR")}원 (${(frac * 100).toFixed(1)}%)`;
    circle.appendChild(title);
    svg.appendChild(circle);
    offset += len;
  });

  const centerLabel = el("text", { x: cx, y: cy - 4, "text-anchor": "middle", class: "donut-center-label" });
  centerLabel.textContent = "총 지출";
  svg.appendChild(centerLabel);

  const centerValue = el("text", { x: cx, y: cy + 16, "text-anchor": "middle", class: "donut-center-value" });
  centerValue.textContent = abbreviate(total) + "원";
  svg.appendChild(centerValue);

  container.appendChild(svg);

  if (legendContainer) {
    filtered
      .slice()
      .sort((a, b) => b.value - a.value)
      .forEach((d) => {
        const pct = ((d.value / total) * 100).toFixed(1);
        const span = document.createElement("span");
        span.className = "legend-item";
        span.innerHTML = `<i style="background:${d.color}"></i>${d.label} <b>${pct}%</b>`;
        legendContainer.appendChild(span);
      });
  }
}
