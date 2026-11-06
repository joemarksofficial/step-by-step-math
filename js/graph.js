// Draws the height-over-time parabola, to true scale, as inline SVG.
import { fmt } from './unit-height.js';

const W = 340;
const H = 196;
const LEFT = 50;
const RIGHT = 16;
const TOP = 26;
const BOTTOM = 36;

// marks: any of 'top', 'height', 'ground', 'start'
export function graphSvg(values, marks = []) {
  const { a, b, c, tTop, hMax, tGround } = values;
  const x = (t) => LEFT + (t / tGround) * (W - LEFT - RIGHT);
  const y = (h) => H - BOTTOM - (h / hMax) * (H - TOP - BOTTOM);
  const n = (v) => v.toFixed(1);

  let path = '';
  const segments = 60;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * tGround;
    const height = Math.max(0, a * t * t + b * t + c);
    path += `${i ? 'L' : 'M'}${n(x(t))} ${n(y(height))}`;
  }

  const has = (m) => marks.includes(m);
  const parts = [];

  // Axes
  parts.push(`<line class="g-axis" x1="${LEFT}" y1="${y(0)}" x2="${W - RIGHT}" y2="${y(0)}"/>`);
  parts.push(`<line class="g-axis" x1="${LEFT}" y1="${TOP - 8}" x2="${LEFT}" y2="${y(0)}"/>`);
  parts.push(`<text class="g-axis-label" x="${W - RIGHT}" y="${H - 4}" text-anchor="end">time (sec)</text>`);
  parts.push(`<text class="g-axis-label" x="4" y="12">height (ft)</text>`);
  parts.push(`<path class="g-curve" d="${path}"/>`);

  if (has('top')) {
    parts.push(`<line class="g-guide" x1="${n(x(tTop))}" y1="${n(y(hMax))}" x2="${n(x(tTop))}" y2="${y(0)}"/>`);
    parts.push(xLabel(x(tTop), y(0), fmt(tTop, 2), tTop / tGround));
  }
  if (has('height')) {
    parts.push(`<line class="g-guide" x1="${LEFT}" y1="${n(y(hMax))}" x2="${n(x(tTop))}" y2="${n(y(hMax))}"/>`);
    parts.push(`<text class="g-value" x="${LEFT - 5}" y="${n(y(hMax) + 4)}" text-anchor="end">${fmt(hMax, 0)}</text>`);
  }
  if (has('start')) {
    parts.push(`<circle class="g-dot-soft" cx="${LEFT}" cy="${n(y(c))}" r="4"/>`);
    // Skip this label if it would run into the maximum-height label.
    if (!has('height') || y(c) - y(hMax) > 14) {
      parts.push(`<text class="g-tick" x="${LEFT - 5}" y="${n(y(c) + 4)}" text-anchor="end">${fmt(c, 0)}</text>`);
    }
  }
  if (has('top') || has('height')) {
    parts.push(`<circle class="g-dot" cx="${n(x(tTop))}" cy="${n(y(hMax))}" r="5"/>`);
  }
  if (has('ground')) {
    parts.push(`<circle class="g-dot" cx="${n(x(tGround))}" cy="${y(0)}" r="5"/>`);
    parts.push(xLabel(x(tGround), y(0), fmt(tGround, 2), 1));
  }

  const description = `Graph of height over time. It starts at ${fmt(c)} feet, reaches ${fmt(hMax)} feet at ${fmt(tTop)} seconds, and lands at ${fmt(tGround)} seconds.`;
  return `<svg class="graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="${description}">${parts.join('')}</svg>`;
}

function xLabel(px, baseY, text, fraction) {
  const anchor = fraction > 0.92 ? 'end' : 'middle';
  const shifted = fraction > 0.92 ? px + 6 : Math.max(px, LEFT + 10);
  return `<text class="g-value" x="${shifted.toFixed(1)}" y="${baseY + 16}" text-anchor="${anchor}">${text}</text>`;
}

// A general plot for lessons and walkthroughs. Options:
//   eq {b, c}, domain {t0, t1, h1}, column (shows the real up-and-down motion),
//   ball (a time to mark), mirror (the time to reflect the ball across),
//   noGravity (a straight line instead), extended (dashed curve before the
//   launch), marks [{t, h, label, side}]
export function plotSvg({ eq, domain, column, ball, mirror, noGravity, extended, marks = [] }) {
  const PW = 340;
  const PH = 214;
  const colW = column ? 46 : 0;
  const L = colW + 36;
  const R = 12;
  const T = 12;
  const B = 34;
  const t0 = domain.t0 || 0;
  const { t1, h1 } = domain;
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (PW - L - R);
  const y = (h) => PH - B - (h / h1) * (PH - T - B);
  const n = (v) => v.toFixed(1);
  const hAt = (t) => -16 * t * t + eq.b * t + eq.c;
  const land = (eq.b + Math.sqrt(eq.b * eq.b + 64 * eq.c)) / 32;
  const clip = 'plot-clip';

  const curve = (from, to) => {
    const f = noGravity ? (t) => eq.b * t + eq.c : hAt;
    let d = '';
    for (let i = 0; i <= 80; i++) {
      const t = from + (i / 80) * (to - from);
      d += `${i ? 'L' : 'M'}${n(x(t))} ${n(y(f(t)))}`;
    }
    return d;
  };

  const parts = [`<defs><clipPath id="${clip}"><rect x="${L}" y="${T - 6}" width="${PW - L - R + 2}" height="${PH - T - B + 8}"/></clipPath></defs>`];

  // Grid and tick labels
  const hStep = niceStep(h1 / 4);
  for (let h = hStep; h <= h1; h += hStep) {
    parts.push(`<line class="g-grid" x1="${L}" y1="${n(y(h))}" x2="${PW - R}" y2="${n(y(h))}"/>`);
    parts.push(`<text class="g-tick" x="${L - 5}" y="${n(y(h) + 4)}" text-anchor="end">${h}</text>`);
  }
  for (let t = Math.ceil(t0); t <= t1; t++) {
    parts.push(`<text class="g-tick" x="${n(x(t))}" y="${y(0) + 15}" text-anchor="middle">${String(t).replace('-', '−')}</text>`);
  }
  parts.push(`<line class="g-axis" x1="${L}" y1="${y(0)}" x2="${PW - R}" y2="${y(0)}"/>`);
  parts.push(`<line class="g-axis" x1="${n(x(0))}" y1="${T}" x2="${n(x(0))}" y2="${y(0)}"/>`);
  parts.push(`<text class="g-axis-label" x="${PW - R}" y="${PH - 3}" text-anchor="end">time (sec)</text>`);
  parts.push(`<text class="g-axis-label" x="${L + 4}" y="${PH - 3}">↑ height (ft)</text>`);

  // Curve
  const parts2 = [];
  if (extended) parts2.push(`<path class="g-curve-ghost" d="${curve(t0, 0)}"/>`);
  parts2.push(`<path class="g-curve" d="${noGravity ? curve(0, t1) : curve(0, Math.min(land, t1))}"/>`);
  parts.push(`<g clip-path="url(#${clip})">${parts2.join('')}</g>`);

  // The real motion, on the same height scale
  if (column) {
    const cx = colW / 2 + 2;
    parts.push(`<line class="g-axis" x1="4" y1="${y(0)}" x2="${colW}" y2="${y(0)}"/>`);
    parts.push(`<line class="g-guide" x1="${cx}" y1="${T}" x2="${cx}" y2="${y(0)}"/>`);
    if (ball !== undefined) {
      parts.push(`<circle class="g-ball" cx="${cx}" cy="${n(y(Math.max(0, hAt(ball))))}" r="7"/>`);
    }
    parts.push(`<text class="g-axis-label" x="${cx}" y="${y(0) + 15}" text-anchor="middle">ball</text>`);
  }

  // Marked moment
  if (ball !== undefined) {
    const by = y(Math.max(0, hAt(ball)));
    parts.push(`<line class="g-guide" x1="${n(x(ball))}" y1="${n(by)}" x2="${n(x(ball))}" y2="${y(0)}"/>`);
    if (mirror !== undefined) {
      const other = 2 * mirror - ball;
      parts.push(`<line class="g-guide" x1="${n(x(ball))}" y1="${n(by)}" x2="${n(x(other))}" y2="${n(by)}"/>`);
      parts.push(`<line class="g-guide" x1="${n(x(mirror))}" y1="${n(y(hAt(mirror)))}" x2="${n(x(mirror))}" y2="${y(0)}"/>`);
      parts.push(`<circle class="g-dot-soft" cx="${n(x(other))}" cy="${n(by)}" r="6"/>`);
    }
    parts.push(`<circle class="g-dot" cx="${n(x(ball))}" cy="${n(by)}" r="6"/>`);
  }

  for (const m of marks) {
    parts.push(`<circle class="g-dot" cx="${n(x(m.t))}" cy="${n(y(m.h))}" r="5"/>`);
    if (m.label) {
      if (m.side === 'left') {
        parts.push(`<text class="g-value" x="${n(x(m.t) - 9)}" y="${n(y(m.h) + 4)}" text-anchor="end">${m.label}</text>`);
      } else {
        const anchor = x(m.t) > PW - 60 ? 'end' : x(m.t) < L + 30 ? 'start' : 'middle';
        parts.push(`<text class="g-value" x="${n(x(m.t))}" y="${n(y(m.h) - 10)}" text-anchor="${anchor}">${m.label}</text>`);
      }
    }
  }

  const label = `Graph of height over time for h(t) = −16t² + ${eq.b}t + ${eq.c}.`;
  return `<svg class="graph" viewBox="0 0 ${PW} ${PH}" role="img" aria-label="${label}">${parts.join('')}</svg>`;
}

function niceStep(raw) {
  const pow = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / pow;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * pow;
}
