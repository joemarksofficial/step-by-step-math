import { evaluate, isCalculation } from './expr.js';
import { graphSvg, plotSvg } from './graph.js';
import { LESSONS, heightAt, timeGoalMet } from './lessons.js';
import {
  exportCode, importCode, load, quizPlan, recommend, recordPractice,
  recordQuizAnswer, recordQuizFinished, resetState, save,
} from './store.js';
import {
  SKILLS, SKILL_IDS, buildSteps, checkNumber, fmt, makeProblem,
  makeQuizQuestion, sanityCheck, shuffled, solve,
} from './unit-height.js';

const QUIZ_LENGTH = 6;
const LEVEL_NAMES = { 1: 'Guided', 2: 'Less help', 3: 'Solo' };
const EXAMPLE = solve(48, 64); // lands on tidy numbers: 1.5 sec, 100 ft, 4 sec

const root = document.getElementById('app');
let state = load();
let view = 'home';
let practice = null;
let quiz = null;
let run = null; // the lesson in progress
let backupMessage = '';

// ---------- Light and dark mode ----------

const THEME_KEY = 'step-math-theme';
const THEME_COLORS = { light: '#f7f5ef', dark: '#14161c' };
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function currentTheme() {
  return document.documentElement.dataset.theme || (systemDark.matches ? 'dark' : 'light');
}

function syncThemeColor() {
  const color = THEME_COLORS[currentTheme()];
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.removeAttribute('media');
    meta.content = color;
  });
}

function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Blocked storage only means the choice lasts for this session.
  }
  syncThemeColor();
  render();
}

function themeToggle() {
  const toDark = currentTheme() === 'light';
  const icon = toDark
    ? '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/>'
    : '<circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  return `<button class="theme-toggle" data-action="toggle-theme" aria-label="Switch to ${toDark ? 'dark' : 'light'} mode">
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${icon}</svg>
    ${toDark ? 'Dark' : 'Light'}
  </button>`;
}

// Until she picks a theme, follow the phone if its setting changes.
systemDark.addEventListener('change', () => {
  syncThemeColor();
  if (view === 'home') render();
});

// Ask the browser to keep her saved progress. Harmless if unavailable.
navigator.storage?.persist?.().catch?.(() => {});

// ---------- Rendering ----------

function render() {
  const views = { home: homeView, sheet: sheetView, run: runView, practice: practiceView, quiz: quizView, backup: backupView };
  root.innerHTML = views[view]();
  root.dataset.view = view;
  const main = root.querySelector('.scroll');
  if (!main) return;
  if (view === 'run') {
    const atWork = run.feedback || run.hintsShown > 0 || run.justCompleted;
    main.scrollTop = atWork ? main.scrollHeight : 0;
    run.justCompleted = false;
    return;
  }
  const finished = main.querySelector('.done');
  const activeWork = view === 'practice' && (practice.i > 0 || practice.feedback || practice.hintsShown > 0);
  if (finished && view === 'practice') {
    finished.scrollIntoView({ block: 'start' });
  } else if (activeWork || (view === 'quiz' && quiz.answered)) {
    main.scrollTop = main.scrollHeight;
  } else {
    main.scrollTop = 0;
  }
}

function topBar(title, right = '') {
  return `<header class="bar">
    <button class="icon-btn" data-action="home" aria-label="Back to home">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <h1 class="bar-title">${title}</h1>
    <div class="bar-right">${right}</div>
  </header>`;
}

// ---------- Home ----------

function homeView() {
  const rec = recommend(state);
  let hero;
  if (rec.type === 'lesson') {
    const lesson = LESSONS[rec.lessonId];
    const label = rec.lessonId === 'idea' ? 'Start here' : 'Up next';
    hero = heroCard(label, lesson.title, lesson.blurb, 'start-lesson', '', rec.lessonId);
  } else if (rec.type === 'quiz') {
    hero = heroCard('Up next', 'Quiz yourself', `${QUIZ_LENGTH} mixed questions, set up like the real thing.`, 'start-quiz', '');
  } else {
    const skill = SKILLS[rec.skillId];
    const s = state.skills[rec.skillId];
    const label = rec.reason === 'review' ? 'Worth another look' : 'Up next';
    hero = heroCard(label, skill.name, `${skill.blurb} · ${LEVEL_NAMES[s.level]}`, 'start-skill', rec.skillId);
  }

  const rows = SKILL_IDS.map((id) => {
    const skill = SKILLS[id];
    const s = state.skills[id];
    const learned = state.lessons[id];
    return `<div class="skill-card">
      <div class="skill-head">
        <span class="skill-text">
          <span class="skill-name">${skill.name}</span>
          <span class="skill-blurb">${skill.blurb}</span>
        </span>
        ${progressPips(s)}
      </div>
      <div class="skill-actions">
        <button class="ghost ${learned ? 'finished' : ''}" data-action="start-lesson" data-lesson="${id}">${learned ? '✓ Learn' : 'Learn'}</button>
        <button class="ghost" data-action="start-skill" data-skill="${id}">Practice</button>
      </div>
    </div>`;
  }).join('');
  const intro = LESSONS.idea;

  const quizNote = state.quizzes
    ? `Best score: ${state.bestQuiz} of ${QUIZ_LENGTH}`
    : `${QUIZ_LENGTH} mixed questions with answer choices`;

  return `<div class="screen">
    <main class="scroll home">
      <div class="home-head">
        <div>
          <p class="eyebrow">Math 2 Honors</p>
          <h1 class="title">Step by Step</h1>
        </div>
        ${themeToggle()}
      </div>
      ${hero}
      <h2 class="section">Height over time</h2>
      <div class="list">
        <button class="skill-row" data-action="start-lesson" data-lesson="idea">
          <span class="skill-text"><span class="skill-name">${intro.title}</span><span class="skill-blurb">${intro.blurb}</span></span>
          ${state.lessons.idea ? '<span class="badge">Done</span>' : '<span class="chevron" aria-hidden="true">›</span>'}
        </button>
      </div>
      <div class="list">${rows}</div>
      <div class="list list-gap">
        <button class="skill-row" data-action="start-quiz">
          <span class="skill-text"><span class="skill-name">Quiz yourself</span><span class="skill-blurb">${quizNote}</span></span>
          <span class="chevron" aria-hidden="true">›</span>
        </button>
        <button class="skill-row" data-action="sheet">
          <span class="skill-text"><span class="skill-name">Formula sheet</span><span class="skill-blurb">All the methods in one place</span></span>
          <span class="chevron" aria-hidden="true">›</span>
        </button>
      </div>
      <button class="text-btn" data-action="backup">Back up or restore progress</button>
    </main>
  </div>`;
}

function heroCard(label, title, note, action, skill, lesson) {
  return `<button class="hero" data-action="${action}" ${skill ? `data-skill="${skill}"` : ''} ${lesson ? `data-lesson="${lesson}"` : ''}>
    <span class="hero-label">${label}</span>
    <span class="hero-title">${title}</span>
    <span class="hero-note">${note}</span>
  </button>`;
}

function progressPips(s) {
  if (s.mastered) return '<span class="badge">Mastered</span>';
  const pips = [1, 2, 3].map((level) => {
    const cls = level < s.level ? 'done' : level === s.level ? 'now' : '';
    return `<span class="pip ${cls}"></span>`;
  }).join('');
  return `<span class="pips" role="img" aria-label="Level ${s.level} of 3: ${LEVEL_NAMES[s.level]}">${pips}</span>`;
}

// ---------- Formula sheet ----------

function sheetView() {
  const v = EXAMPLE;
  return `<div class="screen">
    ${topBar('Formula sheet')}
    <main class="scroll lesson">
      <p class="lead">Every problem in this unit is about one curve. Something goes up, slows down, comes back, and lands.</p>
      <div class="eq-block">h(t) = −16t² + 48t + 64</div>
      ${graphSvg(v, ['start', 'top', 'height', 'ground'])}

      <h2 class="section">What the numbers mean</h2>
      <dl class="meanings">
        <div><dt>−16</dt><dd><b>a</b>: gravity pulling it down (half of −32 ft/s², when height is in feet)</dd></div>
        <div><dt>48</dt><dd><b>b</b>: how fast it’s going upward at the start, in feet per second</dd></div>
        <div><dt>64</dt><dd><b>c</b>: how high it starts</dd></div>
      </dl>

      <h2 class="section">The three questions</h2>
      <p>The same equation can ask three different things. <b>Work out which one before you do any math.</b></p>
      <div class="q-card">
        <h3>When is it at the top?</h3>
        <p class="formula">t = −b ÷ (2a)</p>
        <p class="calc">−48 ÷ (−32) = <b>1.5 sec</b></p>
      </div>
      <div class="q-card">
        <h3>How high does it get?</h3>
        <p>Find the time at the top, then plug it in.</p>
        <p class="formula">h(t) at that time</p>
        <p class="calc">−16(1.5)² + 48(1.5) + 64 = <b>100 ft</b></p>
      </div>
      <div class="q-card">
        <h3>When does it land?</h3>
        <p>On the ground, the height is 0, so solve h(t) = 0.</p>
        <p class="formula">t = (−b ± √(b² − 4ac)) ÷ (2a)</p>
        <p class="calc">(−48 ± 80) ÷ (−32) gives −1 or 4, so <b>4 sec</b></p>
      </div>

      <div class="callout">
        <h3>The trap in answer choices</h3>
        <p>A wrong choice is often the right answer to a <em>different</em> question about the same object. For this example, a “how high” question might also offer 1.5 and 4. Those numbers are real, but they’re times, not heights.</p>
      </div>
      <button class="primary wide" data-action="home">Done</button>
    </main>
  </div>`;
}

// ---------- Interactive lessons ----------

function startLesson(id) {
  run = { id, i: 0, completed: 0 };
  enterScreen(0, false);
  view = 'run';
  render();
}

function enterScreen(i, alreadyDone) {
  const screen = LESSONS[run.id].screens[i];
  Object.assign(run, {
    i, finished: false, entry: '', feedback: null, misses: 0, hintsShown: 0, eliminated: [],
    complete: alreadyDone, justCompleted: false, on: false, visited: [],
    t: screen.start ?? 0,
    value: screen.param ? screen.eq[screen.param] : 0,
  });
}

function runEq(screen) {
  return screen.param ? { ...screen.eq, [screen.param]: run.value } : screen.eq;
}

function runPlot(screen) {
  const { kind, domain, column, mirror, mode } = screen;
  if (kind === 'time') return plotSvg({ eq: screen.eq, domain, column, ball: run.t, mirror });
  if (kind === 'coef') return plotSvg({ eq: runEq(screen), domain });
  if (kind === 'toggle') {
    return plotSvg({
      eq: screen.eq,
      domain,
      noGravity: mode === 'gravity' && run.on,
      extended: mode === 'extend' && run.on,
      marks: mode === 'extend' && run.on
        ? [{ t: -1, h: 0 }, { t: 4, h: 0 }]
        : [],
    });
  }
  return '';
}

function runReadout(screen) {
  if (screen.kind === 'coef') {
    const eq = runEq(screen);
    return `h(t) = −16t² + ${eq.b}t + ${eq.c}`;
  }
  const t = run.t;
  const h = heightAt(screen.eq, t);
  const T = fmt(t, 1);
  if (screen.mirror !== undefined) {
    const other = fmt(2 * screen.mirror - t, 1);
    return `h(${T}) = ${fmt(h, 2)} ft<br>h(${other}) = ${fmt(h, 2)} ft`;
  }
  return `h(${T}) = −16(${T})² + ${screen.eq.b}(${T}) + ${screen.eq.c}<br><b>= ${fmt(h, 2)} ft</b>`;
}

function runView() {
  const lesson = LESSONS[run.id];
  if (run.finished) return lessonDoneView(lesson);
  const screen = lesson.screens[run.i];
  const count = lesson.screens.length;
  const meter = `<div class="meter" role="progressbar" aria-label="Screen ${run.i + 1} of ${count}" aria-valuemin="1" aria-valuemax="${count}" aria-valuenow="${run.i + 1}"><span style="width:${(run.i / count) * 100}%"></span></div>`;
  const needsKeypad = screen.kind === 'number' && !run.complete;
  const nav = needsKeypad ? keypad() : `<div class="run-nav ${run.i === 0 ? 'solo' : ''}">
      ${run.i > 0 ? '<button class="ghost" data-action="run-back">Back</button>' : ''}
      <button class="primary" id="run-next" data-action="run-next" ${run.complete ? '' : 'disabled'}>${run.i === count - 1 ? 'Finish' : 'Continue'}</button>
    </div>`;
  return `<div class="screen">
    ${topBar(lesson.title.length > 26 ? 'Lesson' : lesson.title, `<span class="count">${run.i + 1} of ${count}</span>`)}
    ${meter}
    <main class="scroll run">
      <h2 class="run-title">${screen.title}</h2>
      ${screen.body ? `<div>${screen.body}</div>` : ''}
      ${widget(screen)}
      <div class="after" id="after" role="status">${run.complete ? screen.after : ''}</div>
    </main>
    ${nav}
  </div>`;
}

function widget(screen) {
  if (screen.kind === 'time' || screen.kind === 'coef') {
    const isTime = screen.kind === 'time';
    const min = isTime ? screen.tMin : screen.min;
    const max = isTime ? screen.tMax : screen.max;
    const step = isTime ? 0.1 : screen.step;
    const value = isTime ? run.t : run.value;
    const name = isTime ? 't' : screen.param;
    return `<div id="plot">${runPlot(screen)}</div>
      <p class="readout" id="readout">${runReadout(screen)}</p>
      <p class="task ${run.complete ? 'met' : ''}" id="task">${screen.task}</p>
      <label class="slider-row">
        <span class="slider-label" id="slider-label">${name} = ${isTime ? fmt(value, 1) : value}</span>
        <input id="run-slider" type="range" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${name}">
      </label>`;
  }
  if (screen.kind === 'toggle') {
    return `<div id="plot">${runPlot(screen)}</div>
      <p class="task ${run.complete ? 'met' : ''}" id="task">${screen.task}</p>
      <button class="ghost wide" data-action="run-toggle">${screen.labels[run.on ? 1 : 0]}</button>`;
  }
  const feedback = run.feedback ? `<p class="feedback" role="status">${run.feedback}</p>` : '';
  const hints = (screen.hints || []).slice(0, run.hintsShown).map((h) => `<p class="hint">${h}</p>`).join('');
  if (screen.kind === 'choice') {
    const graph = screen.graph ? plotSvg(screen.graph) : '';
    const options = screen.choices.map((c, index) => {
      let cls = run.eliminated.includes(index) ? 'out' : '';
      if (run.complete) cls = c.correct ? 'right' : 'out';
      return `<button class="choice ${cls}" data-action="run-choose" data-index="${index}" ${run.complete || cls ? 'disabled' : ''}>${c.text}</button>`;
    }).join('');
    return `${graph}<p class="step-prompt">${screen.prompt}</p>
      <div class="choices">${options}</div>${feedback}`;
  }
  // number
  if (run.complete) {
    return `<p class="step-prompt">${screen.prompt}</p>
      <p class="tracker">${screen.label} ${fmt(screen.answer)}</p>`;
  }
  const moreHints = run.hintsShown < (screen.hints || []).length;
  const canReveal = run.misses >= 2;
  return `<section class="step">
    <p class="step-prompt">${screen.prompt}</p>
    <div class="entry-row">
      <span class="entry-label">${screen.label}</span>
      <output class="entry" id="entry" aria-live="polite">${run.entry || '<span class="caret"></span>'}</output>
    </div>
    <p class="preview" id="preview">${previewText()}</p>
    ${feedback}${hints}
    <div class="helpers">
      ${moreHints ? '<button class="ghost" data-action="hint">Hint</button>' : ''}
      ${canReveal ? '<button class="ghost" data-action="reveal">Show me</button>' : ''}
    </div>
  </section>`;
}

function completeScreen() {
  run.complete = true;
  run.justCompleted = true;
  run.feedback = null;
  render();
}

// Slider updates touch only the parts that change, so the drag isn't interrupted.
function onSlider(input) {
  const screen = LESSONS[run.id].screens[run.i];
  const value = Number(input.value);
  if (screen.kind === 'time') {
    run.t = Math.round(value * 10) / 10;
    run.visited.push(run.t);
    document.getElementById('slider-label').textContent = `t = ${fmt(run.t, 1)}`;
  } else {
    run.value = value;
    document.getElementById('slider-label').textContent = `${screen.param} = ${value}`;
  }
  document.getElementById('plot').innerHTML = runPlot(screen);
  document.getElementById('readout').innerHTML = runReadout(screen);
  const met = screen.kind === 'time' ? timeGoalMet(screen, run.t, run.visited) : value === screen.goal;
  if (met && !run.complete) {
    run.complete = true;
    document.getElementById('after').innerHTML = screen.after;
    document.getElementById('task').classList.add('met');
    document.getElementById('run-next').disabled = false;
  }
}

function lessonDoneView(lesson) {
  const points = lesson.summary.map((s) => `<li>${s}</li>`).join('');
  const isSkill = SKILL_IDS.includes(lesson.id);
  const nextAction = isSkill
    ? `<button class="primary wide" data-action="start-guided" data-skill="${lesson.id}">Practice this, step by step</button>`
    : `<button class="primary wide" data-action="start-lesson" data-lesson="${lesson.next}">Next lesson: ${LESSONS[lesson.next].title}</button>`;
  return `<div class="screen">
    ${topBar('Lesson')}
    <main class="scroll run">
      <h2 class="run-title">Lesson complete</h2>
      <p>Here’s what to remember:</p>
      <ul class="summary">${points}</ul>
      ${nextAction}
      <button class="ghost wide" data-action="home">Back to home</button>
    </main>
  </div>`;
}

// ---------- Practice ----------

function startPractice(skillId, { level, reuse, scored = true, returnToQuiz = false } = {}) {
  const useLevel = level || state.skills[skillId].level;
  const problem = makeProblem(skillId, Math.random, reuse);
  const steps = buildSteps(problem, useLevel).map((step) =>
    step.shuffle ? { ...step, choices: shuffled(step.choices) } : step);
  practice = {
    skillId, level: useLevel, problem, steps, i: 0, work: [], entry: '',
    feedback: null, misses: 0, hintsShown: 0, wrong: 0, hintsUsed: 0, reveals: 0,
    eliminated: [], scored, returnToQuiz, done: false, levelMessage: null,
  };
  view = 'practice';
  render();
}

function practiceView() {
  const p = practice;
  const levels = [1, 2, 3].map((l) =>
    `<button class="seg ${l === p.level ? 'on' : ''}" data-action="set-level" data-level="${l}" ${l === p.level ? 'aria-current="true"' : ''}>${LEVEL_NAMES[l]}</button>`).join('');
  const header = topBar(SKILLS[p.skillId].name);
  const problemCard = `<section class="problem">
    <p>${p.problem.story}</p>
    <p class="eq-block">${p.problem.equation}</p>
    <p class="question">${p.problem.question}</p>
  </section>`;
  const work = p.work.length
    ? `<ol class="work">${p.work.map((w) => `<li><span class="work-line">${w.work}</span>${w.why ? `<span class="work-why">${w.why}</span>` : ''}</li>`).join('')}</ol>`
    : '';
  // Keeps the equation on screen once the problem card scrolls away.
  const pinned = p.done ? '' : `<div class="pinned">${pinnedEquation(p)}</div>`;
  const seg = p.returnToQuiz ? '' : `<div class="segs" role="group" aria-label="How much help">${levels}</div>`;

  if (p.done) {
    return `<div class="screen">${header}
      <main class="scroll practice">${problemCard}${work}${doneCard()}</main>
    </div>`;
  }
  const step = p.steps[p.i];
  const progress = p.steps.length > 1
    ? `<div class="meter" role="progressbar" aria-label="Step ${p.i + 1} of ${p.steps.length}" aria-valuemin="1" aria-valuemax="${p.steps.length}" aria-valuenow="${p.i + 1}"><span style="width:${(p.i / p.steps.length) * 100}%"></span></div>`
    : '';
  return `<div class="screen">${header}${progress}
    ${p.i > 0 ? pinned : ''}
    <main class="scroll practice">
      ${seg}
      ${problemCard}
      ${work}
      ${stepCard(step)}
    </main>
    ${step.kind === 'number' ? keypad() : ''}
  </div>`;
}

function pinnedEquation(p) {
  const focus = p.steps[p.i].focus || [];
  const { a, b, c } = p.problem.terms;
  const term = (id, text) => `<span class="term ${focus.includes(id) ? 'on' : ''}">${text}</span>`;
  return `h(t) = ${term('a', a)} + ${term('b', b)} + ${term('c', c)}`;
}

function stepCard(step) {
  const p = practice;
  // Guided always explains the step. Less help shows it only if she asks.
  const showTeach = step.teach && (p.level === 1 || p.explainShown);
  const lead = `${showTeach ? `<p class="teach">${step.teach}</p>` : ''}
    ${step.plot && showTeach ? plotSvg(step.plot) : ''}
    ${step.show && p.level === 1 ? `<p class="tracker">${step.show}</p>` : ''}`;
  const canExplain = p.level === 2 && step.teach && !p.explainShown;
  const hints = step.hints.slice(0, p.hintsShown).map((h) => `<p class="hint">${h}</p>`).join('');
  const feedback = p.feedback ? `<p class="feedback" role="status">${p.feedback}</p>` : '';
  const moreHints = p.hintsShown < step.hints.length;
  const canReveal = p.misses >= 2 && p.level < 3;
  const helpers = `<div class="helpers">
    ${canExplain ? '<button class="ghost" data-action="explain">Why this step?</button>' : ''}
    ${moreHints ? '<button class="ghost" data-action="hint">Hint</button>' : ''}
    ${canReveal ? '<button class="ghost" data-action="reveal">Show me this step</button>' : ''}
    ${p.level === 3 ? '<button class="ghost" data-action="walk-through">Walk me through it</button>' : ''}
  </div>`;

  if (step.kind === 'choice') {
    const options = step.choices.map((c, index) => {
      const out = p.eliminated.includes(index);
      return `<button class="choice ${out ? 'out' : ''}" data-action="choose" data-index="${index}" ${out ? 'disabled' : ''}>${c.text}</button>`;
    }).join('');
    return `<section class="step">
      ${lead}
      <p class="step-prompt">${step.prompt}</p>
      <div class="choices">${options}</div>
      ${feedback}${hints}${helpers}
    </section>`;
  }
  return `<section class="step">
    ${lead}
    <p class="step-prompt">${step.prompt}</p>
    <div class="entry-row">
      <span class="entry-label">${step.label}</span>
      <output class="entry" id="entry" aria-live="polite">${p.entry || '<span class="caret"></span>'}</output>
    </div>
    <p class="preview" id="preview">${previewText()}</p>
    ${feedback}${hints}${helpers}
  </section>`;
}

// The lesson or problem currently taking keypad input.
function inputOwner() {
  return view === 'run' ? run : practice;
}

function previewText() {
  const entry = inputOwner().entry;
  if (!isCalculation(entry)) return '';
  const value = evaluate(entry);
  return value === null ? '' : `= ${fmt(value, 6)}`;
}

function keypad() {
  const keys = ['7', '8', '9', '÷', 'del', '4', '5', '6', '×', '(', '1', '2', '3', '−', ')', '0', '.', '²', '+', '√'];
  const labels = { del: '⌫', '²': 'x²' };
  const aria = { del: 'Delete', '²': 'Squared', '√': 'Square root', '−': 'Minus or negative', '÷': 'Divide', '×': 'Times', '(': 'Open parenthesis', ')': 'Close parenthesis', '.': 'Decimal point' };
  const buttons = keys.map((k) => {
    const isOp = !/[0-9.]/.test(k);
    return `<button class="key ${isOp ? 'op' : ''}" data-key="${k}" ${aria[k] ? `aria-label="${aria[k]}"` : ''}>${labels[k] || k}</button>`;
  }).join('');
  return `<div class="keypad">
    <div class="keys">${buttons}</div>
    <button class="primary wide" data-action="check">Check</button>
  </div>`;
}

function updateEntry() {
  const entry = document.getElementById('entry');
  const preview = document.getElementById('preview');
  if (entry) entry.innerHTML = inputOwner().entry || '<span class="caret"></span>';
  if (preview) preview.textContent = previewText();
}

function pressKey(key) {
  const p = inputOwner();
  if (!p) return;
  if (view === 'run') {
    const screen = LESSONS[run.id].screens[run.i];
    if (run.finished || run.complete || screen?.kind !== 'number') return;
  } else if (p.done || p.steps[p.i].kind !== 'number') {
    return;
  }
  if (key === 'del') {
    p.entry = p.entry.endsWith('√(') ? p.entry.slice(0, -2) : p.entry.slice(0, -1);
  } else if (p.entry.length < 40) {
    p.entry += key === '√' ? '√(' : key;
  }
  // The last message was about the old entry, so clear it as she edits.
  p.feedback = null;
  root.querySelector('.feedback')?.remove();
  updateEntry();
}

function checkEntry() {
  const p = inputOwner();
  const isLesson = view === 'run';
  const step = isLesson ? LESSONS[run.id].screens[run.i] : p.steps[p.i];
  if (!p.entry || step.kind !== 'number' || (isLesson && (run.complete || run.finished))) return;
  const value = evaluate(p.entry);
  if (value === null) {
    p.feedback = 'That can’t be calculated yet. Check for a missing number or a stray symbol.';
    render();
    return;
  }
  const result = checkNumber(step, value);
  if (result.ok) {
    if (isLesson) completeScreen();
    else completeStep(step);
  } else {
    p.misses += 1;
    if (!result.close) p.wrong = (p.wrong || 0) + 1;
    p.feedback = result.msg;
    render();
  }
}

function choose(index) {
  const p = practice;
  const step = p.steps[p.i];
  const choice = step.choices[index];
  if (choice.correct) {
    completeStep(step);
  } else {
    p.misses += 1;
    p.wrong += 1;
    p.eliminated.push(index);
    p.feedback = choice.msg;
    render();
  }
}

function completeStep(step) {
  const p = practice;
  p.work.push({ work: step.work, why: step.why });
  p.i += 1;
  p.entry = '';
  p.feedback = null;
  p.misses = 0;
  p.hintsShown = 0;
  p.eliminated = [];
  p.explainShown = false;
  if (p.i >= p.steps.length) finishProblem();
  render();
}

function finishProblem() {
  const p = practice;
  p.done = true;
  if (!p.scored) return;
  // Guided mode allows hints and tries. Later levels need a clean run.
  const clean = p.level === 1 ? p.reveals === 0 : p.wrong === 0 && p.reveals === 0 && p.hintsUsed === 0;
  p.clean = clean;
  p.levelMessage = recordPractice(state, p.skillId, p.level, clean);
  save(state);
}

function doneCard() {
  const p = practice;
  const prob = p.problem;
  const marks = prob.skillId === 'top' ? ['top'] : prob.skillId === 'height' ? ['height', 'start'] : ['ground'];
  const again = p.returnToQuiz
    ? '<button class="primary wide" data-action="back-to-quiz">Back to the quiz</button>'
    : '<button class="primary wide" data-action="again">Next problem</button><button class="ghost wide" data-action="home">Back to home</button>';
  const soloNote = p.level === 3 && p.scored && !p.levelMessage && p.clean && !state.skills[p.skillId].mastered
    ? `<p class="level-up">${state.skills[p.skillId].streak} of 3 in a row on your own.</p>` : '';
  return `<section class="done">
    <p class="done-label">Answer</p>
    <p class="done-answer">${fmt(prob.answer)} ${prob.unit === 'ft' ? 'ft' : 'sec'}</p>
    ${graphSvg(prob.values, marks)}
    <p class="sanity">${sanityCheck(prob)}</p>
    ${p.levelMessage ? `<p class="level-up">${p.levelMessage}</p>` : soloNote}
    ${again}
  </section>`;
}

// ---------- Quiz ----------

function startQuiz() {
  const plan = shuffled(quizPlan(state, QUIZ_LENGTH));
  quiz = { questions: plan.map((id) => makeQuizQuestion(id)), i: 0, score: 0, answered: null, finished: false, missed: [] };
  view = 'quiz';
  render();
}

function quizView() {
  const q = quiz;
  if (q.finished) {
    const missedSkills = [...new Set(q.missed)];
    const next = missedSkills.length
      ? `<p>Worth another look:</p><div class="list">${missedSkills.map((id) => `<button class="skill-row" data-action="start-skill" data-skill="${id}"><span class="skill-text"><span class="skill-name">${SKILLS[id].name}</span><span class="skill-blurb">${SKILLS[id].blurb}</span></span><span class="chevron" aria-hidden="true">›</span></button>`).join('')}</div>`
      : '<p>You got them all, including the trap answers.</p>';
    return `<div class="screen">${topBar('Quiz')}
      <main class="scroll quiz">
        <section class="done">
          <p class="done-label">Score</p>
          <p class="done-answer">${q.score} of ${q.questions.length}</p>
          ${next}
          <button class="primary wide" data-action="start-quiz">New quiz</button>
          <button class="ghost wide" data-action="home">Back to home</button>
        </section>
      </main></div>`;
  }
  const { problem, options } = q.questions[q.i];
  const list = options.map((o, index) => {
    let cls = '';
    if (q.answered) {
      if (o.correct) cls = 'right';
      else if (q.answered.index === index) cls = 'wrong';
      else cls = 'out';
    }
    return `<button class="choice ${cls}" data-action="quiz-answer" data-index="${index}" ${q.answered ? 'disabled' : ''}>${o.text}</button>`;
  }).join('');
  let after = '';
  if (q.answered) {
    const chosen = options[q.answered.index];
    const last = q.i === q.questions.length - 1;
    after = `<p class="${chosen.correct ? 'level-up' : 'feedback'}" role="status">${chosen.correct ? 'Correct!' : chosen.msg}</p>
      ${chosen.correct ? '' : '<button class="ghost wide" data-action="quiz-walk">Walk me through this one</button>'}
      <button class="primary wide" data-action="quiz-next">${last ? 'See my score' : 'Next question'}</button>`;
  }
  return `<div class="screen">
    ${topBar('Quiz', `<span class="count">${q.i + 1} of ${q.questions.length}</span>`)}
    <div class="meter"><span style="width:${(q.i / q.questions.length) * 100}%"></span></div>
    <main class="scroll quiz">
      <section class="problem">
        <p>${problem.story}</p>
        <p class="eq-block">${problem.equation}</p>
        <p class="question">${problem.question}</p>
      </section>
      <div class="choices">${list}</div>
      ${after}
    </main>
  </div>`;
}

// ---------- Backup ----------

function backupView() {
  return `<div class="screen">
    ${topBar('Back up or restore')}
    <main class="scroll backup">
      <p>Progress is saved only on this phone. Deleting the Home Screen icon deletes it too, so copy this code somewhere safe, like Notes, before getting a new phone.</p>
      <label class="field-label" for="backup-out">Your backup code</label>
      <textarea id="backup-out" readonly rows="4">${exportCode(state)}</textarea>
      <button class="primary wide" data-action="copy-backup">Copy code</button>
      <label class="field-label" for="backup-in">Restore from a code</label>
      <textarea id="backup-in" rows="4" placeholder="Paste a backup code here" autocapitalize="off" autocomplete="off" spellcheck="false"></textarea>
      <button class="ghost wide" data-action="restore">Restore</button>
      ${backupMessage ? `<p class="level-up" role="status">${backupMessage}</p>` : ''}
      <button class="text-btn danger" data-action="reset">Erase all progress</button>
    </main>
  </div>`;
}

// ---------- Events ----------

const actions = {
  'toggle-theme'() { toggleTheme(); },
  home() { view = 'home'; practice = null; backupMessage = ''; render(); },
  sheet() { view = 'sheet'; render(); },
  'start-lesson'(el) { startLesson(el.dataset.lesson); },
  'start-guided'(el) { startPractice(el.dataset.skill, { level: 1 }); },
  'run-next'() {
    const lesson = LESSONS[run.id];
    if (run.i >= lesson.screens.length - 1) {
      state.lessons[run.id] = true;
      save(state);
      run.finished = true;
    } else {
      // Screens she already finished stay unlocked if she went Back.
      run.completed = Math.max(run.completed, run.i + 1);
      enterScreen(run.i + 1, run.i + 1 < run.completed);
    }
    render();
  },
  'run-back'() {
    if (run.complete) run.completed = Math.max(run.completed, run.i + 1);
    enterScreen(run.i - 1, true);
    render();
  },
  'run-toggle'() {
    run.on = !run.on;
    if (!run.complete) { run.complete = true; run.justCompleted = true; }
    render();
  },
  'run-choose'(el) {
    const screen = LESSONS[run.id].screens[run.i];
    const index = Number(el.dataset.index);
    if (screen.choices[index].correct) {
      completeScreen();
    } else {
      run.eliminated.push(index);
      run.feedback = screen.choices[index].msg;
      render();
    }
  },
  explain() { practice.explainShown = true; render(); },
  'start-skill'(el) { startPractice(el.dataset.skill); },
  'start-quiz'() { startQuiz(); },
  backup() { backupMessage = ''; view = 'backup'; render(); },
  'set-level'(el) {
    const level = Number(el.dataset.level);
    if (level !== practice.level) startPractice(practice.skillId, { level });
  },
  again() { startPractice(practice.skillId); },
  check() { checkEntry(); },
  choose(el) { choose(Number(el.dataset.index)); },
  hint() {
    const p = inputOwner();
    p.hintsShown += 1;
    if (p === practice) p.hintsUsed += 1;
    render();
  },
  reveal() {
    if (view === 'run') { completeScreen(); return; }
    const p = practice;
    p.reveals += 1;
    const step = p.steps[p.i];
    completeStep({ ...step, why: `<span class="shown-tag">Shown</span> ${step.why}` });
  },
  'walk-through'() {
    const p = practice;
    if (p.scored) {
      recordPractice(state, p.skillId, p.level, false);
      save(state);
    }
    startPractice(p.skillId, { level: 1, reuse: p.problem, scored: false });
  },
  'quiz-answer'(el) {
    const index = Number(el.dataset.index);
    const q = quiz.questions[quiz.i];
    const correct = q.options[index].correct;
    quiz.answered = { index };
    if (correct) quiz.score += 1;
    else quiz.missed.push(q.problem.skillId);
    recordQuizAnswer(state, q.problem.skillId, correct);
    save(state);
    render();
  },
  'quiz-next'() {
    quiz.i += 1;
    quiz.answered = null;
    if (quiz.i >= quiz.questions.length) {
      quiz.finished = true;
      recordQuizFinished(state, quiz.score);
      save(state);
    }
    render();
  },
  'quiz-walk'() {
    const { problem } = quiz.questions[quiz.i];
    startPractice(problem.skillId, { level: 1, reuse: problem, scored: false, returnToQuiz: true });
  },
  'back-to-quiz'() { practice = null; view = 'quiz'; render(); },
  async 'copy-backup'() {
    const field = document.getElementById('backup-out');
    try {
      await navigator.clipboard.writeText(field.value);
      backupMessage = 'Copied. Paste it somewhere safe, like Notes.';
    } catch {
      field.select();
      backupMessage = 'Couldn’t copy automatically. The code is selected, so copy it from the box.';
      flash(backupMessage);
      return;
    }
    render();
  },
  restore() {
    const restored = importCode(document.getElementById('backup-in').value);
    if (!restored) {
      backupMessage = 'That code didn’t work. Make sure you copied the whole thing.';
    } else {
      state = restored;
      save(state);
      backupMessage = 'Your progress is restored.';
    }
    render();
  },
  reset() {
    if (!window.confirm('Erase all progress? This can’t be undone.')) return;
    state = resetState();
    save(state);
    backupMessage = '';
    view = 'home';
    render();
  },
};

function flash(message) {
  const main = root.querySelector('.backup');
  let note = main.querySelector('.level-up');
  if (!note) {
    note = document.createElement('p');
    note.className = 'level-up';
    note.setAttribute('role', 'status');
    main.insertBefore(note, main.querySelector('.danger'));
  }
  note.textContent = message;
}

root.addEventListener('click', (event) => {
  const key = event.target.closest('[data-key]');
  if (key) { pressKey(key.dataset.key); return; }
  const el = event.target.closest('[data-action]');
  if (el) actions[el.dataset.action]?.(el);
});

root.addEventListener('input', (event) => {
  if (event.target.id === 'run-slider') onSlider(event.target);
});

// When she lets go of the slider, bring the explanation into view.
root.addEventListener('change', (event) => {
  if (event.target.id === 'run-slider' && run.complete) {
    document.getElementById('after')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
});

// Lets a physical keyboard work too, for use on a laptop.
document.addEventListener('keydown', (event) => {
  if ((view !== 'practice' && view !== 'run') || event.metaKey || event.ctrlKey) return;
  if (event.target.tagName === 'INPUT') return;
  const map = { '-': '−', '*': '×', '/': '÷', Backspace: 'del', '^': '²', r: '√' };
  if (event.key === 'Enter') {
    event.preventDefault();
    checkEntry();
    return;
  }
  const key = map[event.key] || event.key;
  if (/^[0-9.+()]$/.test(key) || ['−', '×', '÷', 'del', '²', '√'].includes(key)) {
    event.preventDefault();
    pressKey(key);
  }
});

syncThemeColor();
render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
