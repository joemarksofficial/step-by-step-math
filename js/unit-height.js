// Unit: Height over time. Quadratics of the form h(t) = −16t² + bt + c.
//
// Each problem can be asked three ways, and on a multiple-choice quiz the
// wrong choices tend to be the right answers to the other two questions.
// That's why every walkthrough starts by working out what's being asked.

export const SKILLS = {
  top: {
    id: 'top',
    name: 'Time to the top',
    blurb: 'When does it reach its highest point?',
    question: 'At what time does it reach its maximum height?',
    unit: 'sec',
  },
  height: {
    id: 'height',
    name: 'Maximum height',
    blurb: 'How high does it get?',
    question: 'What is its maximum height?',
    unit: 'ft',
  },
  ground: {
    id: 'ground',
    name: 'Time to hit the ground',
    blurb: 'When does it land?',
    question: 'How long will it take to hit the ground?',
    unit: 'sec',
  },
};

export const SKILL_IDS = Object.keys(SKILLS);

const A = -16;

const STORIES = [
  { b: [10, 50], c: [150, 800], step: 1,
    text: (c) => `A hiker tosses a stone upward from the edge of a ${c}-foot cliff.`, thing: 'stone' },
  { b: [20, 60], c: [600, 1500], step: 10,
    text: (c) => `A ball is thrown upward from an observation deck ${c} feet above the street.`, thing: 'ball' },
  { b: [12, 40], c: [20, 120], step: 1,
    text: (c) => `A set of keys is tossed upward from a balcony ${c} feet above the sidewalk.`, thing: 'set of keys' },
  { b: [20, 110], c: [3, 5], step: 1,
    text: (c) => `A batter hits a baseball when it is ${c} feet above the ground.`, thing: 'baseball' },
  { b: [64, 320], c: [1, 8], step: 1,
    text: (c) => `A model rocket is launched from a platform ${c} feet tall.`, thing: 'rocket' },
  { b: [120, 300], c: [3, 20], step: 1,
    text: (c) => `A firework shell is fired straight up from a tube ${c} feet above the ground.`, thing: 'shell' },
  { b: [8, 20], c: [10, 33], step: 1,
    text: (c) => `A diver jumps upward from a platform ${c} feet above the water.`, thing: 'diver', ground: 'water' },
  { b: [16, 36], c: [5, 9], step: 1,
    text: (c) => `A volleyball is served from ${c} feet above the floor.`, thing: 'volleyball', ground: 'floor' },
];

// ---------- Number formatting ----------

export function fmt(n, decimals = 3) {
  const p = 10 ** decimals;
  const rounded = Math.round((Math.abs(n) + 1e-9) * p) / p;
  return (n < 0 && rounded !== 0 ? '−' : '') + String(rounded);
}

// Wraps negatives in parentheses, for use inside a calculation.
const par = (n, decimals = 3) => (n < 0 ? `(${fmt(n, decimals)})` : fmt(n, decimals));

// ---------- Problem creation ----------

const randInt = (lo, hi, rng) => lo + Math.floor(rng() * (hi - lo + 1));

function pickSteppedInt(lo, hi, step, rng) {
  return lo + step * randInt(0, Math.floor((hi - lo) / step), rng);
}

export function solve(b, c, a = A) {
  const disc = b * b - 4 * a * c;
  const root = Math.sqrt(disc);
  const tTop = -b / (2 * a);
  return {
    a, b, c, disc, root, tTop,
    hMax: a * tTop * tTop + b * tTop + c,
    tGround: (-b - root) / (2 * a),
    otherRoot: (-b + root) / (2 * a),
  };
}

export function makeProblem(skillId, rng = Math.random, reuse = null) {
  let storyIndex, b, c;
  if (reuse) {
    ({ storyIndex, b, c } = reuse);
  } else {
    storyIndex = randInt(0, STORIES.length - 1, rng);
    const story = STORIES[storyIndex];
    b = randInt(story.b[0], story.b[1], rng);
    c = pickSteppedInt(story.c[0], story.c[1], story.step, rng);
  }
  const story = STORIES[storyIndex];
  const skill = SKILLS[skillId];
  const values = solve(b, c);
  const groundWord = story.ground || 'ground';
  const question = {
    top: `At what time does the ${story.thing} reach its maximum height?`,
    height: `What is the maximum height of the ${story.thing}?`,
    ground: `How long will it take the ${story.thing} to hit the ${groundWord}?`,
  }[skillId];
  return {
    skillId,
    storyIndex,
    b,
    c,
    values,
    groundWord,
    equation: `h(t) = −16t² + ${b}t + ${c}`,
    terms: { a: '−16t²', b: `${b}t`, c: String(c) },
    story: `${story.text(c)} Its height in feet, t seconds later, is`,
    question,
    answer: skillId === 'top' ? values.tTop : skillId === 'height' ? values.hMax : values.tGround,
    unit: skill.unit,
  };
}

// ---------- Mistakes that apply across steps ----------

// If she computes the answer to a different question, say so directly.
function crossMistakes(p) {
  const v = p.values;
  const all = [
    { skill: 'top', v: v.tTop, msg: `${fmt(v.tTop)} is the time it reaches the top. This question asks for something else, so reread it.` },
    { skill: 'height', v: v.hMax, msg: `${fmt(v.hMax)} is the maximum height. This question asks for something else, so reread it.` },
    { skill: 'ground', v: v.tGround, msg: `${fmt(v.tGround)} is when it lands. This question asks for something else, so reread it.` },
  ];
  return all.filter((m) => m.skill !== p.skillId);
}

// ---------- Steps ----------

const TOL_EXACT = 1e-6;
const TOL_ROUNDED = 0.0007; // accepts an answer rounded to 3 decimals
const ROUNDING_MSG = 'Very close! Keep all the decimals while you work, then round to 3 places at the end.';

function askStep(p) {
  const why = {
    top: 'It asks <b>when</b> it reaches the top, so the answer is a time. The vertex formula gives you that time.',
    height: 'It asks <b>how high</b>, so the answer is a height. You need the time at the top first, then plug it into h(t).',
    ground: `On the ${p.groundWord}, the height is 0, so you solve h(t) = 0 for t.`,
  }[p.skillId];
  return {
    id: 'ask',
    core: true,
    kind: 'choice',
    prompt: 'Before any math: what is this question asking you to find?',
    hints: ['Reread the last sentence of the problem. Is it asking for a time or a height? At the top, or at the landing?'],
    choices: [
      { text: 'The <b>time</b> when it is at its highest point', correct: p.skillId === 'top',
        msg: 'Look again at the last sentence. It isn’t asking when it reaches the top.' },
      { text: 'The <b>height</b> at its highest point', correct: p.skillId === 'height',
        msg: 'Look again at the last sentence. It isn’t asking how high it gets.' },
      { text: 'The <b>time</b> when it lands', correct: p.skillId === 'ground',
        msg: 'Look again at the last sentence. It isn’t asking when it lands.' },
    ],
    why,
    work: { top: 'Find: the time at the top', height: 'Find: the height at the top', ground: 'Find: the time when it lands' }[p.skillId],
  };
}

function coefficientSteps(p) {
  const form = 'Match it to h(t) = at² + bt + c.';
  return [
    {
      id: 'a', kind: 'number', label: 'a =', answer: A, tol: TOL_EXACT,
      prompt: `${form} What is <b>a</b>, the number with t²?`,
      hints: ['Include the sign. The term in the equation is −16t².'],
      mistakes: [{ v: 16, msg: 'The sign is part of the number. Look at what’s in front of the 16.' }],
      why: 'This comes from gravity: half of −32 ft/s². That’s why it’s −16 in all of these problems when height is in feet.',
      work: `a = ${fmt(A)}`,
    },
    {
      id: 'b', kind: 'number', label: 'b =', answer: p.b, tol: TOL_EXACT,
      prompt: 'What is <b>b</b>, the number with t?',
      hints: [`Find the term that has t without a square: ${p.b}t.`],
      mistakes: [{ v: -p.b, msg: 'It’s being added in the equation, so b is positive.' }],
      why: 'This is the starting upward speed, in feet per second.',
      work: `b = ${p.b}`,
    },
    {
      id: 'c', kind: 'number', label: 'c =', answer: p.c, tol: TOL_EXACT,
      prompt: 'What is <b>c</b>, the number by itself?',
      hints: ['It’s the term with no t at all.'],
      mistakes: [{ v: -p.c, msg: 'It’s being added in the equation, so c is positive.' }],
      why: 'This is the starting height, since at t = 0 the other terms disappear.',
      work: `c = ${p.c}`,
    },
  ];
}

function timeToTopSteps(p) {
  const v = p.values;
  const isFinal = p.skillId === 'top';
  const crosses = isFinal ? crossMistakes(p) : [];
  return [
    {
      id: 'formula',
      kind: 'choice',
      prompt: 'Which formula gives the time at the very top of a parabola?',
      hints: ['The top of a parabola is called the vertex. Which formula is the vertex formula?'],
      choices: [
        { text: 't = −b ÷ (2a)', correct: true },
        { text: 't = b ÷ a', correct: false, msg: 'Close, but the vertex formula has a 2 in it, and b is negative.' },
        { text: 't = (−b ± √(b² − 4ac)) ÷ (2a)', correct: false, msg: 'That’s the quadratic formula. It finds when the height is 0, not the top.' },
      ],
      why: 'A parabola is symmetric, and −b ÷ (2a) finds its middle, which is the top.',
      work: 't = −b ÷ (2a)',
    },
    {
      id: 'numerator', kind: 'number', label: '−b =', answer: -p.b, tol: TOL_EXACT,
      prompt: `Start with the top of the fraction. b is ${p.b}, so what is <b>−b</b>?`,
      hints: ['−b means “the opposite of b.”'],
      mistakes: [{ v: p.b, msg: 'The minus sign flips b, so it turns negative here.' }],
      why: 'The minus in −b flips the sign of b.',
      work: `−b = ${fmt(-p.b)}`,
    },
    {
      id: 'denominator', kind: 'number', label: '2a =', answer: 2 * A, tol: TOL_EXACT,
      prompt: 'Now the bottom of the fraction. What is <b>2a</b>?',
      hints: ['2 × (−16). A positive times a negative is negative.'],
      mistakes: [
        { v: 32, msg: 'a is negative, so 2a is negative too.' },
        { v: -16, msg: 'That’s a. Now multiply it by 2.' },
      ],
      why: 'Doubling a is the step that’s easy to forget, and forgetting it doubles your answer.',
      work: `2a = ${fmt(2 * A)}`,
    },
    {
      id: 'divide',
      core: true,
      kind: 'number',
      label: 't =',
      answer: v.tTop,
      tol: isFinal ? TOL_ROUNDED : TOL_EXACT * 100,
      close: 0.03,
      closeMsg: isFinal ? ROUNDING_MSG : 'Very close! Keep every decimal here, because you’ll plug this number back in.',
      prompt: `Divide: <b>${fmt(-p.b)} ÷ (${fmt(2 * A)})</b>. ${isFinal ? 'Round to 3 decimals.' : 'Keep every decimal, because you’ll use this number next.'}`,
      lite: `Use the vertex formula to find <b>t</b>. ${isFinal ? 'Round to 3 decimals.' : 'Keep every decimal, because you’ll use this number next.'}`,
      hints: [`A negative divided by a negative is positive, so this is ${p.b} ÷ 32.`],
      liteHints: ['t = −b ÷ (2a)', `That’s ${fmt(-p.b)} ÷ (${fmt(2 * A)}).`],
      mistakes: [
        { v: -v.tTop, msg: 'Check your sign. A negative divided by a negative is positive, and time should be positive here.' },
        { v: p.b / 16, msg: `That’s ${p.b} ÷ 16, so the 2 got left out. The bottom of the fraction is 2a, which is −32.` },
        ...crosses,
      ],
      why: isFinal
        ? 'Dividing gives the time at the top, and that’s the answer.'
        : `It reaches the top at this time. Hold on to all the decimals: ${fmt(v.tTop, 6)}.`,
      work: `t = ${fmt(-p.b)} ÷ (${fmt(2 * A)}) = ${isFinal ? fmt(v.tTop) : fmt(v.tTop, 6)}`,
    },
  ];
}

function maxHeightSteps(p) {
  const v = p.values;
  const t = v.tTop;
  const tText = fmt(t, 6);
  const aTerm = A * t * t;
  const bTerm = p.b * t;
  return [
    {
      id: 'aTerm', kind: 'number', label: '−16t² =', answer: aTerm, tol: 0.0007, close: 0.05, closeMsg: ROUNDING_MSG,
      prompt: `Now plug t = ${tText} into h(t), one term at a time. What is <b>−16(${tText})²</b>?`,
      hints: ['Square t first, then multiply by −16. Order of operations matters here.'],
      mistakes: [
        { v: -aTerm, msg: 'Only t gets squared, so the −16 keeps its negative sign. This term should be negative.' },
        { v: (A * t) ** 2, msg: 'It looks like the −16 got squared too. Square only t, then multiply by −16.' },
        { v: A * t * 2, msg: 'Squaring means t × t, not t × 2.' },
      ],
      why: 'Squaring comes before multiplying, so only t is squared.',
      work: `−16(${tText})² = ${fmt(aTerm)}`,
    },
    {
      id: 'bTerm', kind: 'number', label: `${p.b}t =`, answer: bTerm, tol: 0.0007, close: 0.05, closeMsg: ROUNDING_MSG,
      prompt: `Next term: what is <b>${p.b}(${tText})</b>?`,
      hints: [`Multiply ${p.b} × ${tText}.`],
      mistakes: [],
      why: 'That’s the height it would gain with no gravity pulling it back.',
      work: `${p.b}(${tText}) = ${fmt(bTerm)}`,
    },
    {
      id: 'sum',
      core: true,
      kind: 'number',
      label: 'h =',
      answer: v.hMax,
      tol: 0.0016,
      close: 0.2,
      closeMsg: ROUNDING_MSG,
      prompt: `Add them up, with the starting height: <b>${fmt(aTerm)} + ${fmt(bTerm)} + ${p.c}</b>. Round to 3 decimals.`,
      lite: `Plug t = ${tText} into h(t) to find the <b>maximum height</b>. Round to 3 decimals.`,
      hints: ['Adding a negative is the same as subtracting. Don’t forget the starting height.'],
      liteHints: [`Calculate −16(${tText})² + ${p.b}(${tText}) + ${p.c}.`, 'You can type the whole thing on the keypad. The x² key squares a number.'],
      mistakes: [
        { v: v.hMax - p.c, msg: `Don’t forget c. Add the starting height of ${p.c}.` },
        { v: bTerm - aTerm + p.c, msg: 'The −16t² term is negative, so it should bring the total down.' },
        { v: t, msg: `${fmt(t)} is the time it reaches the top. This question wants the height at that time, so plug t into h(t).` },
        { v: p.c, msg: `${p.c} is just the starting height. The maximum height has to be more than that.` },
        { v: p.b, msg: `${p.b} is b, the starting speed. The maximum height comes from plugging t into h(t).` },
        ...crossMistakes(p).filter((m) => m.skill !== 'top'),
      ],
      why: 'Plugging the time at the top into h(t) gives the height at the top, and that’s the answer.',
      work: `h = ${fmt(v.hMax)}`,
    },
  ];
}

function groundSteps(p) {
  const v = p.values;
  const rootText = fmt(v.root);
  const fourAC = 4 * A * p.c;
  return [
    ...coefficientSteps(p),
    {
      id: 'b2', kind: 'number', label: 'b² =', answer: p.b * p.b, tol: TOL_EXACT,
      prompt: `The quadratic formula is t = (−b ± √(b² − 4ac)) ÷ (2a). Start inside the square root. What is <b>b²</b>?`,
      hints: [`${p.b} × ${p.b}`],
      mistakes: [{ v: 2 * p.b, msg: 'Squaring means multiplying the number by itself, not by 2.' }],
      why: 'The part under the square root is called the discriminant.',
      work: `b² = ${p.b * p.b}`,
    },
    {
      id: '4ac', kind: 'number', label: '4ac =', answer: fourAC, tol: TOL_EXACT,
      prompt: `What is <b>4ac</b>? That’s 4 × (−16) × ${p.c}.`,
      hints: ['One negative number in a multiplication makes the result negative.'],
      mistakes: [{ v: -fourAC, msg: 'a is negative, so 4ac is negative too.' }],
      why: 'Keep this negative. It matters in the next step.',
      work: `4ac = ${fmt(fourAC)}`,
    },
    {
      id: 'disc',
      core: true,
      kind: 'number',
      label: 'b² − 4ac =',
      answer: v.disc,
      tol: TOL_EXACT,
      prompt: `What is <b>b² − 4ac</b>? That’s ${p.b * p.b} − (${fmt(fourAC)}).`,
      lite: 'Set h(t) = 0 and use the quadratic formula. Start with <b>b² − 4ac</b>.',
      hints: ['Subtracting a negative is the same as adding.'],
      liteHints: [`a = −16, b = ${p.b}, c = ${p.c}.`, `${p.b}² − 4(−16)(${p.c}). Subtracting a negative is the same as adding.`],
      mistakes: [
        { v: p.b * p.b + fourAC, msg: 'Watch the double negative. Subtracting a negative number means you add.' },
      ],
      why: 'Subtracting a negative means adding, which is the most common place to slip on this problem.',
      work: `b² − 4ac = ${v.disc}`,
    },
    {
      id: 'sqrt',
      core: true,
      kind: 'number',
      label: '√ =',
      answer: v.root,
      tol: 0.006,
      close: 0.6,
      closeMsg: 'Very close! Keep at least 3 decimals on this one.',
      prompt: `Take the square root: <b>√${v.disc}</b>. Keep 3 decimals.`,
      hints: ['Use the √ key on the keypad. It opens a parenthesis for you.'],
      mistakes: [{ v: v.disc / 2, msg: 'A square root isn’t the same as dividing by 2. Use the √ key.' }],
      why: 'This is the ± part of the formula, so it gives you two possible answers.',
      work: `√${v.disc} = ${rootText}`,
    },
    {
      id: 'plus', kind: 'number', label: 't =', answer: v.otherRoot, tol: 0.002, close: 0.1, closeMsg: ROUNDING_MSG, only: 1,
      prompt: `First solution, using +: <b>(${fmt(-p.b)} + ${rootText}) ÷ (−32)</b>. Round to 3 decimals.`,
      hints: ['Do the top first, then divide. The keypad has parentheses so you can type it all at once.'],
      mistakes: [
        { v: -v.otherRoot, msg: 'Check the sign. The top is positive and you’re dividing by −32.' },
        { v: -p.b + v.root, msg: 'That’s the top of the fraction. Now divide by −32.' },
      ],
      why: 'Keep this one for now. You’ll compare the two solutions in a moment.',
      work: `t = (${fmt(-p.b)} + ${rootText}) ÷ (−32) = ${fmt(v.otherRoot)}`,
    },
    {
      id: 'minus', kind: 'number', label: 't =', answer: v.tGround, tol: 0.002, close: 0.1, closeMsg: ROUNDING_MSG, only: 1,
      prompt: `Second solution, using −: <b>(${fmt(-p.b)} − ${rootText}) ÷ (−32)</b>. Round to 3 decimals.`,
      hints: ['Do the top first, then divide.'],
      mistakes: [
        { v: -v.tGround, msg: 'Check the sign. A negative divided by a negative is positive.' },
        { v: -p.b - v.root, msg: 'That’s the top of the fraction. Now divide by −32.' },
      ],
      why: 'Because a is negative, the “−” version is the one that comes out positive.',
      work: `t = (${fmt(-p.b)} − ${rootText}) ÷ (−32) = ${fmt(v.tGround)}`,
    },
    {
      id: 'pick',
      kind: 'choice',
      only: 1,
      shuffle: true,
      prompt: 'The formula gave two solutions. Which one is when it lands?',
      hints: ['t counts the seconds after it was thrown. Can that be negative?'],
      choices: [
        { text: `t = ${fmt(v.tGround)} sec`, correct: true },
        { text: `t = ${fmt(v.otherRoot)} sec`, correct: false, msg: 'A negative time would be before it was even launched.' },
      ],
      why: 'Time can’t be negative here, so the positive solution is the answer.',
      work: `It lands at t = ${fmt(v.tGround)} sec`,
    },
    {
      id: 'final',
      core: true,
      only: 2,
      kind: 'number',
      label: 't =',
      answer: v.tGround,
      tol: TOL_ROUNDED + 0.0003,
      close: 0.1,
      closeMsg: ROUNDING_MSG,
      prompt: 'Finish the quadratic formula and type the <b>positive</b> solution. Round to 3 decimals.',
      hints: [`t = (${fmt(-p.b)} ± ${rootText}) ÷ (−32)`, 'Dividing by −32 means the “−” version comes out positive.'],
      mistakes: [
        { v: v.otherRoot, msg: 'That’s the negative solution, from before it was launched. Try the other sign in ±.' },
        { v: -v.otherRoot, msg: 'That used the + version with a sign flipped. Try the − version of ±.' },
        ...crossMistakes(p),
      ],
      why: 'Time can’t be negative here, so the positive solution is the answer.',
      work: `It lands at t = ${fmt(v.tGround)} sec`,
    },
  ];
}

// Guided teaching for each step, shown before she answers:
//   teach - what this step is doing and why
//   show  - the formula so far, with this step's piece marked
//   focus - which terms to highlight in the pinned equation
function teaching(p) {
  const v = p.values;
  const neg = fmt(-p.b);
  const t = fmt(v.tTop, 6);
  const aTerm = fmt(A * v.tTop * v.tTop);
  const bTerm = fmt(p.b * v.tTop);
  const b2 = p.b * p.b;
  const fourAC = fmt(4 * A * p.c);
  const rootText = fmt(v.root);
  const landing = p.skillId === 'ground';
  const std = 'h(t) = at² + bt + c';
  return {
    ask: { teach: 'One equation can ask three different things, and each has a different answer. Spotting which one comes first, because it decides the method.' },
    a: {
      focus: ['a'],
      show: landing ? '−16t² + ' + p.b + 't + ' + p.c + ' = 0' : std,
      teach: landing
        ? 'On the ground, the height is 0, so you’re solving h(t) = 0. The quadratic formula does that, and it needs three numbers from the equation.'
        : 'The formula uses numbers from the equation, so find those first and you’ll know exactly what goes where.',
    },
    b: { focus: ['b'], show: std, teach: 'Next is the number attached to plain t.' },
    c: { focus: ['c'], show: std, teach: 'Last is the number with no t at all.' },
    formula: { teach: 'The highest point of a parabola is called the vertex. The two sides of the curve are mirror images, so the top is exactly in the middle, and one formula finds that middle.' },
    numerator: {
      focus: ['b'], show: 't = <mark>−b</mark> ÷ (2a)',
      teach: 'Doing one piece at a time keeps the signs from getting mixed up. The top of the fraction is −b, the opposite of b.',
    },
    denominator: {
      focus: ['a'], show: `t = ${neg} ÷ <mark>(2a)</mark>`,
      teach: 'The bottom doubles a. The 2 is there because the top is halfway through the up-and-back trip.',
    },
    divide: {
      show: `t = ${neg} ÷ (${fmt(2 * A)})`,
      teach: 'Both pieces are ready, so divide. Two negatives make a positive, which makes sense because this is a time after the launch.',
    },
    aTerm: {
      focus: ['a'], show: 'h = <mark>−16t²</mark> + bt + c',
      teach: `You know when it’s at the top. To find how high it is then, replace each t in the equation with ${t}, one term at a time.`,
    },
    bTerm: {
      focus: ['b'], show: `h = ${aTerm} + <mark>${p.b}t</mark> + c`,
      teach: 'Now the middle term. Use the same value of t.',
    },
    sum: {
      focus: ['c'], show: `h = ${aTerm} + ${bTerm} + <mark>${p.c}</mark>`,
      teach: 'c stays in the total, because it’s the height it started from.',
    },
    b2: {
      focus: ['b'], show: 't = (−b ± √(<mark>b²</mark> − 4ac)) ÷ (2a)',
      teach: 'The formula looks long, but you only do one piece at a time. Work from the inside out, starting under the square root.',
    },
    '4ac': {
      focus: ['a', 'c'], show: `t = (−b ± √(${b2} − <mark>4ac</mark>)) ÷ (2a)`,
      teach: 'Next piece under the root: multiply 4, a, and c. Since a is negative, the result will be too.',
    },
    disc: {
      show: `t = (−b ± √(<mark>${b2} − (${fourAC})</mark>)) ÷ (2a)`,
      teach: 'Now combine them. Look closely at the signs, because this is subtracting a negative.',
    },
    sqrt: {
      show: `t = (−b ± <mark>√${v.disc}</mark>) ÷ (2a)`,
      teach: 'That finishes the inside, so take the square root.',
    },
    plus: {
      focus: ['b'], show: `t = (${neg} <mark>+</mark> ${rootText}) ÷ (${fmt(2 * A)})`,
      teach: 'The ± means there are two answers, because a parabola crosses height 0 in two places. Do the + version first.',
    },
    minus: {
      show: `t = (${neg} <mark>−</mark> ${rootText}) ÷ (${fmt(2 * A)})`,
      teach: 'Now the − version.',
    },
    pick: {
      teach: 'The formula only knows the curve, and the curve keeps going both ways. The dashed part is before the launch, which never really happened.',
      plot: {
        eq: { b: p.b, c: p.c },
        extended: true,
        domain: { t0: v.otherRoot * 1.5, t1: v.tGround * 1.08, h1: v.hMax * 1.15 },
        marks: [
          { t: v.otherRoot, h: 0, label: fmt(v.otherRoot, 2) },
          { t: v.tGround, h: 0, label: fmt(v.tGround, 2) },
        ],
      },
    },
    final: {
      show: `t = (${neg} ± ${rootText}) ÷ (${fmt(2 * A)})`,
      teach: 'The ± gives two solutions. Time after the launch has to be positive, so that’s the one you want.',
    },
  };
}

function allSteps(p) {
  let steps;
  if (p.skillId === 'top') {
    steps = [askStep(p), ...coefficientSteps(p).slice(0, 2), ...timeToTopSteps(p)];
  } else if (p.skillId === 'height') {
    steps = [askStep(p), ...coefficientSteps(p), ...timeToTopSteps(p), ...maxHeightSteps(p)];
  } else {
    steps = [askStep(p), ...groundSteps(p)];
  }
  const guide = teaching(p);
  return steps.map((s) => ({ ...s, ...guide[s.id] }));
}

function soloStep(p) {
  return {
    id: 'solo',
    core: true,
    kind: 'number',
    label: p.skillId === 'height' ? 'h =' : 't =',
    answer: p.answer,
    tol: p.skillId === 'height' ? 0.0016 : 0.001,
    close: p.skillId === 'height' ? 0.2 : 0.1,
    closeMsg: ROUNDING_MSG,
    prompt: `Work it out, then type your answer in ${p.unit === 'ft' ? 'feet' : 'seconds'}. Round to 3 decimals.`,
    hints: [
      {
        top: 'Time at the top: use the vertex formula, t = −b ÷ (2a).',
        height: 'First find the time at the top with t = −b ÷ (2a), then plug it into h(t).',
        ground: 'Landing means h(t) = 0, so use the quadratic formula and keep the positive solution.',
      }[p.skillId],
    ],
    mistakes: [
      ...crossMistakes(p),
      ...(p.skillId === 'top' ? [{ v: p.b / 16, msg: 'The 2 in 2a got left out, so this is double the right time.' }] : []),
      ...(p.skillId === 'height' ? [
        { v: p.values.hMax - p.c, msg: `Don’t forget c. Add the starting height of ${p.c}.` },
        { v: p.c, msg: `${p.c} is just the starting height. The maximum has to be more than that.` },
      ] : []),
      ...(p.skillId === 'ground' ? [
        { v: p.values.otherRoot, msg: 'That’s the negative solution, from before it was launched. Try the other sign in ±.' },
      ] : []),
    ],
    why: '',
    work: `${p.skillId === 'height' ? 'h' : 't'} = ${fmt(p.answer)} ${p.unit}`,
  };
}

// Level 1: every step. Level 2: only the key steps. Level 3: just the answer.
export function buildSteps(p, level) {
  if (level >= 3) return [soloStep(p)];
  const steps = allSteps(p);
  if (level === 2) {
    return steps
      .filter((s) => (s.core || s.only === 2) && s.only !== 1)
      .map((s) => ({ ...s, prompt: s.lite || s.prompt, hints: s.liteHints || s.hints }));
  }
  return steps.filter((s) => s.only !== 2);
}

// Checks a typed value against a step. Returns { ok, msg }.
export function checkNumber(step, value) {
  if (Math.abs(value - step.answer) <= step.tol) return { ok: true };
  for (const m of step.mistakes || []) {
    if (Math.abs(value - m.v) <= 0.002) return { ok: false, msg: m.msg };
  }
  if (step.close && Math.abs(value - step.answer) <= step.close) {
    return { ok: false, msg: step.closeMsg, close: true };
  }
  return { ok: false, msg: 'Not quite. Try again, or tap Hint for a nudge.' };
}

// What she should be able to confirm once a problem is finished.
export function sanityCheck(p) {
  const v = p.values;
  return {
    top: `Does it make sense? It starts rising at t = 0 and lands at about ${fmt(v.tGround, 2)} sec, so ${fmt(v.tTop)} sec falls in between.`,
    height: `Does it make sense? It started at ${p.c} ft and went up, so ${fmt(v.hMax)} ft should be more than ${p.c} ft.`,
    ground: `Does it make sense? It reaches the top at about ${fmt(v.tTop, 2)} sec, so it has to land later than that.`,
  }[p.skillId];
}

// ---------- Quiz mode ----------

export function makeQuizQuestion(skillId, rng = Math.random) {
  const p = makeProblem(skillId, rng);
  const v = p.values;
  const pools = {
    top: [
      { v: v.tGround, unit: 'sec', msg: `That’s when it lands. The top comes from t = −b ÷ (2a) = ${fmt(v.tTop)} sec.` },
      { v: p.b / 16, unit: 'sec', msg: `That left out the 2 in 2a. It should be ${p.b} ÷ 32 = ${fmt(v.tTop)} sec.` },
      { v: v.hMax, unit: 'sec', msg: `That’s the maximum height, not a time. The time at the top is ${fmt(v.tTop)} sec.` },
      { v: p.b / 32 + 1, unit: 'sec', msg: `The vertex formula gives ${p.b} ÷ 32 = ${fmt(v.tTop)} sec.` },
    ],
    height: [
      { v: v.tGround, unit: 'ft', msg: `That’s the time it lands. The maximum height is h(${fmt(v.tTop)}) = ${fmt(v.hMax)} ft.` },
      { v: v.tTop, unit: 'ft', msg: `That’s the time at the top, so it’s only halfway done. Plug it into h(t) to get ${fmt(v.hMax)} ft.` },
      { v: p.c, unit: 'ft', msg: `That’s the starting height. The maximum is h(${fmt(v.tTop)}) = ${fmt(v.hMax)} ft.` },
      { v: p.b, unit: 'ft', msg: `That’s b, the starting speed. The maximum is h(${fmt(v.tTop)}) = ${fmt(v.hMax)} ft.` },
      { v: v.hMax - p.c, unit: 'ft', msg: `That left out c. Adding the starting height gives ${fmt(v.hMax)} ft.` },
    ],
    ground: [
      { v: v.tTop, unit: 'sec', msg: `That’s when it reaches the top. It lands when h(t) = 0, at ${fmt(v.tGround)} sec.` },
      { v: v.hMax, unit: 'sec', msg: `That’s the maximum height, not a time. It lands when h(t) = 0, at ${fmt(v.tGround)} sec.` },
      { v: Math.abs(v.otherRoot), unit: 'sec', msg: `That’s the other solution with its sign dropped. The positive solution is ${fmt(v.tGround)} sec.` },
      { v: v.root / 32, unit: 'sec', msg: `That left −b out of the top of the formula. The correct answer is ${fmt(v.tGround)} sec.` },
    ],
  };

  const options = [{ text: `${fmt(p.answer)} ${p.unit}`, correct: true, msg: '' }];
  const seen = new Set([fmt(p.answer)]);
  const pool = shuffled(pools[skillId], rng);
  for (const d of pool) {
    if (options.length === 4) break;
    const key = fmt(d.v);
    if (seen.has(key) || d.v <= 0) continue;
    seen.add(key);
    options.push({ text: `${key} ${d.unit}`, correct: false, msg: d.msg });
  }
  // Rare backup when two trap answers round to the same number.
  for (let k = 2; options.length < 4; k++) {
    const key = fmt(p.answer * k + 0.5);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ text: `${key} ${p.unit}`, correct: false, msg: `The correct answer is ${fmt(p.answer)} ${p.unit}.` });
  }
  return { problem: p, options: shuffled(options, rng) };
}

export function shuffled(list, rng = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
