// Run with: npm test
// Checks the app's answers by a separate route: every "answer" is verified by
// plugging it back into h(t), not by re-running the app's own formula.
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from '../js/expr.js';
import {
  SKILL_IDS, buildSteps, checkNumber, fmt, makeProblem, makeQuizQuestion, solve,
} from '../js/unit-height.js';

function seeded(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    return x / 2 ** 32;
  };
}

import { LESSONS, LESSON_ORDER, heightAt, timeGoalMet } from '../js/lessons.js';

const close = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
const h = (b, c, t) => -16 * t * t + b * t + c;

test('expression evaluator follows order of operations', () => {
  const cases = [
    ['2+3×4', 14], ['(2+3)×4', 20], ['−3²', -9], ['(−3)²', 9], ['−16(1.5)²+48(1.5)+64', 100],
    ['√(144)', 12], ['√144', 12], ['2√(9)', 6], ['(−38−350)÷(−32)', 12.125], ['10÷4', 2.5],
    ['3×−2', -6], ['5−−2', 7], ['(1+2', 3], ['√(25', 5], ['.5+.5', 1], ['−.5', -0.5], ['1.5²', 2.25],
    ['(2)(3)', 6], ['-16', -16],
  ];
  for (const [src, want] of cases) close(evaluate(src), want);
});

test('expression evaluator rejects invalid input', () => {
  for (const src of ['', '2+', '×3', '1.2.3', '.', '5÷0', '√(−4)', ')', '2)', '²']) {
    assert.equal(evaluate(src), null, src);
  }
});

test('generated answers are correct when plugged into h(t)', () => {
  const rng = seeded(11);
  for (let n = 0; n < 5000; n++) {
    const skill = SKILL_IDS[n % 3];
    const p = makeProblem(skill, rng);
    const v = p.values;
    assert.ok(v.tTop > 0 && v.hMax > p.c && v.tGround > v.tTop && v.otherRoot < 0, p.equation);
    close(h(p.b, p.c, v.tGround), 0, 1e-6);
    close(h(p.b, p.c, v.otherRoot), 0, 1e-6);
    // Nothing near the top is higher than the claimed maximum.
    assert.ok(h(p.b, p.c, v.tTop - 0.01) < v.hMax && h(p.b, p.c, v.tTop + 0.01) < v.hMax);
    close(h(p.b, p.c, v.tTop), v.hMax, 1e-9);
  }
});

test('walkthrough steps at every level accept their answers', () => {
  const rng = seeded(23);
  for (let n = 0; n < 3000; n++) {
    const skill = SKILL_IDS[n % 3];
    const p = makeProblem(skill, rng);
    for (const level of [1, 2, 3]) {
      const steps = buildSteps(p, level);
      assert.ok(steps.length > 0);
      for (const s of steps) {
        if (s.kind === 'choice') {
          assert.equal(s.choices.filter((c) => c.correct).length, 1, s.id);
        } else {
          assert.ok(checkNumber(s, s.answer).ok, `${s.id}: ${p.equation}`);
          // The value shown to her, rounded to 3 places, must also pass.
          const shown = Math.round(s.answer * 1000) / 1000;
          // Except t on max-height problems, which must keep every decimal.
          const keepsDecimals = skill === 'height' && s.id === 'divide';
          if (!keepsDecimals) assert.ok(checkNumber(s, shown).ok, `${s.id} rounded: ${p.equation}`);
          // A clearly wrong answer must not pass.
          assert.ok(!checkNumber(s, s.answer + 5).ok, `${s.id} wrong: ${p.equation}`);
        }
      }
    }
  }
});

test('every level finishes on the final answer', () => {
  const rng = seeded(5);
  for (let n = 0; n < 1000; n++) {
    const skill = SKILL_IDS[n % 3];
    const p = makeProblem(skill, rng);
    for (const level of [1, 2, 3]) {
      const steps = buildSteps(p, level);
      const last = steps[steps.length - 1];
      if (last.kind === 'number') close(last.answer, p.answer);
      else assert.equal(last.id, 'pick');
    }
    const pick = buildSteps(p, 1).find((s) => s.id === 'pick');
    if (pick) assert.ok(pick.choices.find((c) => c.correct).text.includes(fmt(p.answer)));
  }
});

test('walking through the ground steps with rounded numbers still works', () => {
  const p = makeProblem('ground', seeded(77));
  const steps = buildSteps(p, 1);
  const root = Math.round(p.values.root * 1000) / 1000;
  const minus = steps.find((s) => s.id === 'minus');
  assert.ok(checkNumber(minus, (-p.b - root) / -32).ok);
});

test('a miss that answers a different question gets named', () => {
  const p = makeProblem('height', seeded(9));
  const solo = buildSteps(p, 3)[0];
  const result = checkNumber(solo, p.values.tGround);
  assert.ok(!result.ok);
  assert.match(result.msg, /lands/);
});

test('quiz questions have four distinct positive choices and one correct', () => {
  const rng = seeded(31);
  for (let n = 0; n < 5000; n++) {
    const skill = SKILL_IDS[n % 3];
    const q = makeQuizQuestion(skill, rng);
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map((o) => o.text)).size, 4, JSON.stringify(q.options));
    const right = q.options.filter((o) => o.correct);
    assert.equal(right.length, 1);
    assert.ok(right[0].text.startsWith(fmt(q.problem.answer)));
    for (const o of q.options) {
      assert.ok(!o.text.includes('−'));
      if (!o.correct) assert.ok(o.msg.length > 0);
    }
  }
});

test('step text uses a true minus sign throughout', () => {
  const rng = seeded(41);
  for (let n = 0; n < 600; n++) {
    const p = makeProblem(SKILL_IDS[n % 3], rng);
    for (const level of [1, 2, 3]) {
      for (const s of buildSteps(p, level)) {
        const text = [s.prompt, s.work, s.why, s.teach, s.show, ...(s.hints || []), ...(s.mistakes || []).map((m) => m.msg)].join(' ');
        assert.doesNotMatch(text, /(^|[\s(=])-\d/, `${s.id}: ${text}`);
      }
    }
  }
});

test('questions read as proper sentences', () => {
  const rng = seeded(3);
  for (let n = 0; n < 300; n++) {
    const p = makeProblem(SKILL_IDS[n % 3], rng);
    assert.match(p.question, /\?$/);
    assert.doesNotMatch(p.question, /undefined|the the/);
    assert.match(p.story, /is$/);
  }
});

const allScreens = LESSON_ORDER.flatMap((id) => LESSONS[id].screens.map((s) => ({ ...s, lesson: id })));

test('every lesson answer matches its calculation', () => {
  const numbers = allScreens.filter((s) => s.kind === 'number');
  assert.ok(numbers.length > 15);
  for (const s of numbers) {
    const value = evaluate(s.expr);
    assert.notEqual(value, null, s.expr);
    assert.ok(Math.abs(value - s.answer) <= s.tol, `${s.title}: ${s.expr} = ${value}, not ${s.answer}`);
    for (const m of s.mistakes) assert.ok(Math.abs(m.v - s.answer) > 0.01, `${s.title}: mistake equals answer`);
  }
});

test('every lesson screen has something to do and an explanation', () => {
  for (const s of allScreens) {
    assert.ok(['time', 'coef', 'toggle', 'number', 'choice'].includes(s.kind), s.title);
    assert.ok(s.title && s.after, s.title);
    if (s.kind === 'choice') assert.equal(s.choices.filter((c) => c.correct).length, 1, s.title);
    if (s.kind === 'choice') for (const c of s.choices) assert.ok(c.correct || c.msg, c.text);
  }
});

test('every slider goal can be reached and is not already met', () => {
  for (const s of allScreens.filter((x) => x.kind === 'time')) {
    const grid = [];
    for (let t = s.tMin; t <= s.tMax + 1e-9; t += 0.1) grid.push(Math.round(t * 10) / 10);
    assert.ok(!timeGoalMet(s, s.start, [s.start]), `${s.title} starts complete`);
    assert.ok(timeGoalMet(s, grid.at(-1), grid) || grid.some((t) => timeGoalMet(s, t, grid)), `${s.title} unreachable`);
  }
  for (const s of allScreens.filter((x) => x.kind === 'coef')) {
    assert.ok((s.goal - s.min) % s.step === 0 && s.goal <= s.max, `${s.title} goal off the slider`);
    assert.notEqual(s.eq[s.param], s.goal);
  }
});

test('facts stated in the lessons are true', () => {
  const e1 = solve(48, 64);
  close(e1.tTop, 1.5); close(e1.hMax, 100); close(e1.tGround, 4); close(e1.otherRoot, -1); close(e1.disc, 6400);
  const ball = { b: 48, c: 64 };
  close(heightAt(ball, 0.5), heightAt(ball, 2.5)); close(heightAt(ball, 3), 64);
  const e2 = solve(80, 20);
  close(e2.tTop, 2.5); close(e2.hMax, 120); assert.equal(fmt(e2.tGround), '5.239');
  const throw2 = { b: 80, c: 20 };
  close(heightAt(throw2, 5), 20); close(heightAt(throw2, 2), 116); close(heightAt(throw2, 3), 116);
  const e3 = solve(40, 100);
  close(e3.disc, 8000); assert.equal(fmt(e3.tGround), '4.045'); assert.equal(fmt(e3.otherRoot), '−1.545');
  const messy = { b: 40, c: 100 };
  close(heightAt(messy, 4), 4); close(heightAt(messy, 4.1), -4.96);
  // The lesson's sliders must stay above ground except where it's intended.
  assert.ok(heightAt(throw2, 5.2) > 0);
});
