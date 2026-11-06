// Progress is saved only on this device, in localStorage.
import { SKILL_IDS } from './unit-height.js';

const KEY = 'step-math-v1';
const LESSON_IDS = ['idea', ...SKILL_IDS];
const LESS_HELP_TO_SOLO = 2; // clean problems at level 2 before moving on
const SOLO_TO_MASTERED = 3; // correct in a row at level 3 to master a skill

function fresh() {
  const skills = {};
  for (const id of SKILL_IDS) {
    skills[id] = { level: 1, streak: 0, mastered: false, solved: 0, review: false };
  }
  const lessons = {};
  for (const id of LESSON_IDS) lessons[id] = false;
  return { skills, lessons, quizzes: 0, bestQuiz: 0 };
}

// Only known fields with valid values get through, so a bad backup code
// can't break the app.
function sanitize(raw) {
  const clean = fresh();
  if (!raw || typeof raw !== 'object') return clean;
  for (const id of SKILL_IDS) {
    const s = raw.skills && raw.skills[id];
    if (!s || typeof s !== 'object') continue;
    clean.skills[id] = {
      level: [1, 2, 3].includes(s.level) ? s.level : 1,
      streak: nonNegativeInt(s.streak),
      mastered: s.mastered === true,
      solved: nonNegativeInt(s.solved),
      review: s.review === true,
    };
  }
  clean.quizzes = nonNegativeInt(raw.quizzes);
  clean.bestQuiz = nonNegativeInt(raw.bestQuiz);
  for (const id of LESSON_IDS) clean.lessons[id] = !!raw.lessons && raw.lessons[id] === true;
  return clean;
}

function nonNegativeInt(n) {
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function load() {
  try {
    return sanitize(JSON.parse(globalThis.localStorage.getItem(KEY)));
  } catch {
    return fresh();
  }
}

export function save(state) {
  try {
    globalThis.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private browsing can block storage. The app still works for this session.
  }
}

// Updates a skill after a finished problem. Returns a message if she moved up.
export function recordPractice(state, skillId, level, clean) {
  const s = state.skills[skillId];
  s.solved += 1;
  if (clean && level >= 2) s.review = false;
  if (level !== s.level) return null;

  if (level === 1) {
    if (clean) {
      s.level = 2;
      s.streak = 0;
      return 'You finished without needing the answer shown, so next time you’ll get less help.';
    }
    return null;
  }
  if (!clean) {
    s.streak = 0;
    return null;
  }
  s.streak += 1;
  if (level === 2 && s.streak >= LESS_HELP_TO_SOLO) {
    s.level = 3;
    s.streak = 0;
    return 'Nice work. Next time, try one completely on your own.';
  }
  if (level === 3 && s.streak >= SOLO_TO_MASTERED && !s.mastered) {
    s.mastered = true;
    return 'You got three in a row on your own. This skill is mastered!';
  }
  return null;
}

export function recordQuizAnswer(state, skillId, correct) {
  const s = state.skills[skillId];
  if (correct) return;
  s.review = true;
  s.mastered = false;
  s.streak = 0;
}

export function recordQuizFinished(state, score) {
  state.quizzes += 1;
  state.bestQuiz = Math.max(state.bestQuiz, score);
}

// The most useful thing to do next.
export function recommend(state) {
  if (!state.lessons.idea) return { type: 'lesson', lessonId: 'idea' };
  const review = SKILL_IDS.find((id) => state.skills[id].review);
  if (review) return { type: 'skill', skillId: review, reason: 'review' };
  for (const id of SKILL_IDS) {
    if (!state.lessons[id]) return { type: 'lesson', lessonId: id };
    if (!state.skills[id].mastered) return { type: 'skill', skillId: id, reason: 'next' };
  }
  return { type: 'quiz' };
}

// Weakest skills come up more often, but every skill appears in every quiz.
export function quizPlan(state, count, rng = Math.random) {
  const plan = SKILL_IDS.slice();
  const weight = (id) => {
    const s = state.skills[id];
    return s.review ? 4 : s.mastered ? 1 : 2;
  };
  while (plan.length < count) {
    const total = SKILL_IDS.reduce((sum, id) => sum + weight(id), 0);
    let roll = rng() * total;
    for (const id of SKILL_IDS) {
      roll -= weight(id);
      if (roll < 0) { plan.push(id); break; }
    }
  }
  return plan;
}

export function exportCode(state) {
  return btoa(JSON.stringify(state));
}

export function importCode(code) {
  try {
    const raw = JSON.parse(atob(code.trim()));
    if (!raw || !raw.skills) return null;
    return sanitize(raw);
  } catch {
    return null;
  }
}

export function resetState() {
  return fresh();
}
