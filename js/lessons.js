// Hands-on lessons. Every screen has something to do, and Continue stays locked
// until it's done.
//
// Screen kinds:
//   time   - drag time along the curve        coef   - drag b or c, watch the curve
//   toggle - switch a view on and off         number - work out a value on the keypad
//   choice - pick an answer
//
// Examples use tidy equations: E1 lands on 1.5 sec, 100 ft, and 4 sec.

const E1 = { b: 48, c: 64 };
const E2 = { b: 80, c: 20 };
const E3 = { b: 40, c: 100 };
const E1_DOMAIN = { t1: 4.5, h1: 120 };
const E2_DOMAIN = { t1: 5.6, h1: 140 };

const num = (fields) => ({ kind: 'number', tol: 0.001, hints: [], mistakes: [], ...fields });

export const LESSON_ORDER = ['idea', 'top', 'height', 'ground'];

export const LESSONS = {
  idea: {
    id: 'idea',
    title: 'What is this equation?',
    blurb: 'What it means and why it’s used',
    next: 'top',
    summary: [
      'h(t) takes a time and gives a height.',
      'c is the starting height, b is the starting upward speed, and −16 is gravity.',
      'The same curve answers three different questions, so always check which one is being asked.',
    ],
    screens: [
      {
        kind: 'time', title: 'It predicts where something will be',
        body: 'A ball is thrown upward from a 64-foot roof. Gravity slows it, stops it, and pulls it back down. This equation tells you its height at any moment:<span class="lesson-eq">h(t) = −16t² + 48t + 64</span>',
        task: 'Drag the slider until the ball hits the ground.',
        eq: E1, domain: E1_DOMAIN, column: true, tMin: 0, tMax: 4, start: 0, goal: { at: 4 },
        after: 'On the left, the ball just goes straight up and down. The curve isn’t its path through the air. It’s a graph of <b>height against time</b>.',
      },
      num({
        title: 'What h(t) means',
        body: 'h(t) is read “h of t”. You put a time in, and you get a height out. So h(1) means “the height after 1 second.”<span class="lesson-eq">h(1) = −16(1)² + 48(1) + 64</span>',
        prompt: 'Replace each t with 1. What is <b>h(1)</b>?',
        label: 'h(1) =', answer: 96, expr: '−16(1)²+48(1)+64',
        hints: ['−16(1)² is −16, and 48(1) is 48. Now add those to 64.'],
        mistakes: [{ v: 128, msg: 'The −16 is negative, so it should bring the total down.' }],
        after: 'After 1 second, the ball is 96 feet up. It started at 64, so it’s still climbing.',
      }),
      num({
        title: 'The moment it starts',
        body: 'The clock starts at t = 0, the moment the ball is released.<span class="lesson-eq">h(0) = −16(0)² + 48(0) + 64</span>',
        prompt: 'What is <b>h(0)</b>?',
        label: 'h(0) =', answer: 64, expr: '−16(0)²+48(0)+64',
        hints: ['Anything multiplied by 0 is 0, so only one term is left.'],
        mistakes: [{ v: 0, msg: 'Two of the terms become 0, but the 64 has no t in it, so it stays.' }],
        after: 'Only the 64 survives. That’s no accident: the last number is always the <b>starting height</b>.',
      }),
      {
        kind: 'coef', title: 'c is the starting height', param: 'c',
        body: 'The last number is called <b>c</b>. See what happens when it changes.',
        task: 'Drag c up to 150.',
        eq: E1, domain: { t1: 7, h1: 220 }, min: 0, max: 200, step: 2, goal: 150,
        after: 'The whole curve lifted, and the shape stayed the same. It’s like throwing the same ball from a taller building.',
      },
      {
        kind: 'coef', title: 'b is the starting speed', param: 'b',
        body: 'The number with t is called <b>b</b>. It’s how fast the ball is moving upward at the start, in feet per second.',
        task: 'Drag b up to 96 to throw it twice as hard.',
        eq: E1, domain: { t1: 7, h1: 220 }, min: 16, max: 112, step: 8, goal: 96,
        after: 'A harder throw goes higher and stays up longer. The start stayed at 64, because the speed doesn’t change where it starts.',
      },
      {
        kind: 'toggle', title: 'Why −16?', mode: 'gravity',
        body: 'The first number is called <b>a</b>. Gravity pulls things down at 32 ft/s², and the equation uses half of that, so a is −16 when height is in feet.',
        task: 'Turn gravity off and see what −16t² is doing.',
        labels: ['Turn gravity off', 'Turn gravity on'],
        eq: E1, domain: { t1: 4.5, h1: 300 },
        after: 'Without gravity, it would rise forever in a straight line. Because −16t² uses t <b>squared</b>, it grows faster and faster until it wins and brings the ball back down. That’s what makes the curve.',
      },
      {
        kind: 'choice', title: 'Three questions, one curve',
        body: 'This is why the equation gets used: one curve can answer several questions. For this ball:',
        graph: { eq: E1, domain: E1_DOMAIN, marks: [{ t: 1.5, h: 100, label: '(1.5, 100)' }, { t: 4, h: 0 }] },
        prompt: '“What is the <b>maximum height</b> of the ball?”',
        choices: [
          { text: '100 ft', correct: true },
          { text: '1.5 sec', correct: false, msg: 'That’s when it gets there. The question asks how high.' },
          { text: '4 sec', correct: false, msg: 'That’s when it lands. The question asks how high.' },
        ],
        after: 'Maximum height is the <b>up-and-down</b> number at the top of the curve.',
      },
      {
        kind: 'choice', title: 'Same curve, new question',
        body: 'Same ball, different wording:',
        graph: { eq: E1, domain: E1_DOMAIN, marks: [{ t: 1.5, h: 100, label: '(1.5, 100)' }, { t: 4, h: 0 }] },
        prompt: '“<b>When</b> does the ball reach its maximum height?”',
        choices: [
          { text: '100 ft', correct: false, msg: 'That’s how high it gets. “When” is asking for a time.' },
          { text: '1.5 sec', correct: true },
          { text: '4 sec', correct: false, msg: 'That’s when it lands, and it’s past the top by then.' },
        ],
        after: 'The same point on the curve, but now you want the <b>time</b>, which is the left-to-right number.',
      },
      {
        kind: 'choice', title: 'One more',
        body: 'Same ball again:',
        graph: { eq: E1, domain: E1_DOMAIN, marks: [{ t: 1.5, h: 100, label: '(1.5, 100)' }, { t: 4, h: 0 }] },
        prompt: '“How long until the ball <b>hits the ground</b>?”',
        choices: [
          { text: '100 ft', correct: false, msg: 'That’s a height, and this asks how long.' },
          { text: '1.5 sec', correct: false, msg: 'That’s when it’s at the top. It still has to come back down.' },
          { text: '4 sec', correct: true },
        ],
        after: 'On tests, wrong choices are often right answers to these other questions. Always check what’s being asked.',
      },
    ],
  },

  top: {
    id: 'top',
    title: 'Why t = −b ÷ (2a) works',
    blurb: 'Find the exact time it reaches the top',
    summary: [
      'A parabola is a mirror image, so the top is exactly halfway between two equal heights.',
      'It returns to its starting height at t = −b ÷ a. Halfway to that is t = −b ÷ (2a).',
      'If you forget the 2, you get the time it’s back at its starting height, not the top.',
    ],
    screens: [
      {
        kind: 'time', title: 'Find the top by eye',
        body: 'Here’s the same ball: <span class="lesson-eq">h(t) = −16t² + 48t + 64</span> The highest point of a parabola is called the <b>vertex</b>.',
        task: 'Drag the slider to the moment the height is greatest.',
        eq: E1, domain: E1_DOMAIN, column: true, tMin: 0, tMax: 4, start: 0, goal: { at: 1.5 },
        after: 'The top is at t = 1.5. You found this by searching, but with messier numbers you’d never land on it exactly. So where does an exact method come from?',
      },
      {
        kind: 'time', title: 'The curve is a mirror', mirror: 1.5,
        body: 'The left and right sides of a parabola match. Every height on the way up happens again on the way down.',
        task: 'Drag the first dot to t = 0.5 and compare the two heights.',
        eq: E1, domain: E1_DOMAIN, tMin: 0, tMax: 1.4, start: 1.2, goal: { at: 0.5 },
        after: 'Same height at 0.5 and 2.5, and the top at 1.5 is exactly halfway between them. <b>So if you know two times with equal heights, the top is halfway between.</b>',
      },
      num({
        title: 'Find two equal heights',
        body: 'We already know one: it starts at 64 ft at t = 0. When is it back at 64 ft? Set h(t) = 64, then subtract 64 from both sides and pull out the t:<span class="lesson-eq">−16t² + 48t = 0<br>t(−16t + 48) = 0</span>That’s true if t = 0, which is the start, or if −16t + 48 = 0.',
        prompt: 'Solve <b>−16t + 48 = 0</b>. When is it back at 64 ft?',
        label: 't =', answer: 3, expr: '−48÷(−16)',
        hints: ['Subtract 48 from both sides, which gives −16t = −48. Then divide by −16.'],
        mistakes: [{ v: -3, msg: 'A negative divided by a negative is positive. Time should be positive here.' }],
        after: 'It’s back at 64 ft at t = 3.',
      }),
      num({
        title: 'Now go halfway',
        body: 'It’s at 64 ft at t = 0 and again at t = 3. The curve is a mirror, so the top is exactly in the middle.',
        prompt: 'What time is <b>halfway between 0 and 3</b>?',
        label: 't =', answer: 1.5, expr: '3÷2',
        hints: ['Divide 3 by 2.'],
        after: 'That’s the same 1.5 you found by dragging, but this time with no guessing.',
      }),
      {
        kind: 'choice', title: 'Where the formula comes from',
        body: 'Do the same thing with letters. Starting from at² + bt = 0, it gets back to its starting height at:<span class="lesson-eq">t = −b ÷ a</span>Here that’s −48 ÷ (−16) = 3, just like you found.',
        prompt: 'How do you go <b>halfway</b> to −b ÷ a?',
        choices: [
          { text: 'Divide by 2, which makes it −b ÷ (2a)', correct: true },
          { text: 'Subtract 2, which makes it −b ÷ a − 2', correct: false, msg: 'Halfway means half as much. Which operation cuts a number in half?' },
          { text: 'Square it, which makes it (−b ÷ a)²', correct: false, msg: 'Squaring makes 3 into 9, which is farther away. You want half of it.' },
        ],
        after: 'That’s the whole formula: <b>t = −b ÷ (2a)</b>. The 2 is there because the top is halfway.',
      },
      num({
        title: 'Your turn: the top of the fraction',
        body: 'Try a new throw:<span class="lesson-eq">h(t) = −16t² + 80t + 20</span>Here a = −16 and b = 80. Use t = −b ÷ (2a), one piece at a time.',
        prompt: 'What is <b>−b</b>?',
        label: '−b =', answer: -80, expr: '−80',
        hints: ['−b is the opposite of b.'],
        mistakes: [{ v: 80, msg: 'The minus sign flips b, so it turns negative.' }],
        after: 'The top of the fraction is −80.',
      }),
      num({
        title: 'The bottom of the fraction',
        body: '<span class="lesson-eq">t = −80 ÷ (2a)</span>',
        prompt: 'What is <b>2a</b>, when a = −16?',
        label: '2a =', answer: -32, expr: '2(−16)',
        hints: ['2 × (−16). A positive times a negative is negative.'],
        mistakes: [{ v: 32, msg: 'a is negative, so 2a is negative too.' }, { v: -16, msg: 'That’s a. Now multiply it by 2.' }],
        after: 'With a = −16, 2a is always −32 in these problems.',
      }),
      num({
        title: 'Now divide',
        body: '<span class="lesson-eq">t = −80 ÷ (−32)</span>',
        prompt: 'What is <b>t</b>?',
        label: 't =', answer: 2.5, expr: '−80÷(−32)',
        hints: ['A negative divided by a negative is positive.'],
        mistakes: [{ v: -2.5, msg: 'A negative divided by a negative is positive.' }, { v: 5, msg: 'That’s −80 ÷ (−16), so the 2 got left out.' }],
        after: 'It reaches the top at 2.5 seconds.',
      }),
      {
        kind: 'choice', title: 'The classic mistake',
        body: 'Someone forgets the 2 and calculates −80 ÷ (−16) = 5. That isn’t a random number, and it can show up as an answer choice.',
        graph: { eq: E2, domain: E2_DOMAIN, marks: [{ t: 2.5, h: 120, label: 'top' }, { t: 5, h: 20, label: 't = 5', side: 'left' }] },
        prompt: 'What is actually happening at <b>t = 5</b>?',
        choices: [
          { text: 'It’s back at its starting height of 20 ft', correct: true },
          { text: 'It’s at the top', correct: false, msg: 'The top is at 2.5. Look where t = 5 is on the curve.' },
          { text: 'It’s hitting the ground', correct: false, msg: 'Close! But it started 20 ft up, so at t = 5 it still has 20 ft to fall.' },
        ],
        after: 'Forgetting the 2 gives the full up-and-back trip, not the halfway point.',
      },
    ],
  },

  height: {
    id: 'height',
    title: 'How to find the maximum height',
    blurb: 'A two-part job: find when, then find how high',
    summary: [
      'First find the time at the top with t = −b ÷ (2a).',
      'Then plug that time into h(t). Square first, then multiply.',
      'The answer has to be more than the starting height, so use that as a quick check.',
    ],
    screens: [
      {
        kind: 'choice', title: 'It’s a two-part job',
        body: 'h(t) gives you a height if you give it a time.<span class="lesson-eq">h(t) = −16t² + 80t + 20</span>',
        prompt: 'To get the height at the top, what do you need <b>first</b>?',
        choices: [
          { text: 'The time when it’s at the top', correct: true },
          { text: 'The time when it lands', correct: false, msg: 'At landing the height is 0, which isn’t the maximum.' },
          { text: 'Nothing, c is the maximum height', correct: false, msg: 'c is where it starts. It goes up from there.' },
        ],
        after: 'Find the time first, then use that time to find the height.',
      },
      num({
        title: 'Part 1: when?',
        body: 'Use the formula from the last lesson.<span class="lesson-eq">t = −b ÷ (2a) = −80 ÷ (−32)</span>',
        prompt: 'What is <b>t</b>?',
        label: 't =', answer: 2.5, expr: '−80÷(−32)',
        hints: ['A negative divided by a negative is positive.'],
        mistakes: [{ v: 5, msg: 'That’s −80 ÷ (−16), so the 2 got left out.' }],
        after: 'It’s at the top at t = 2.5. <b>This isn’t the answer yet</b>, because the question wants a height.',
      }),
      {
        kind: 'choice', title: 'Part 2: plug it in',
        body: 'Replace every t with 2.5:<span class="lesson-eq">h(2.5) = −16(2.5)² + 80(2.5) + 20</span>The first term is where most mistakes happen.',
        prompt: 'In <b>−16(2.5)²</b>, what do you do first?',
        choices: [
          { text: 'Square 2.5, then multiply by −16', correct: true },
          { text: 'Multiply −16 × 2.5, then square', correct: false, msg: 'Exponents come before multiplying. This way would make the term positive and send the height way too high.' },
          { text: 'Multiply 2.5 × 2', correct: false, msg: 'Squaring means multiplying a number by itself, not by 2.' },
        ],
        after: 'Exponents come before multiplication, so only the 2.5 gets squared.',
      },
      num({
        title: 'Square it',
        body: '<span class="lesson-eq">−16<mark>(2.5)²</mark> + 80(2.5) + 20</span>',
        prompt: 'What is <b>(2.5)²</b>?',
        label: '(2.5)² =', answer: 6.25, expr: '2.5²',
        hints: ['2.5 × 2.5. You can type 2.5 and then tap x².'],
        mistakes: [{ v: 5, msg: 'That’s 2.5 × 2. Squaring means 2.5 × 2.5.' }],
        after: 'Now that square gets multiplied by −16.',
      }),
      num({
        title: 'First term',
        body: '<span class="lesson-eq"><mark>−16(6.25)</mark> + 80(2.5) + 20</span>',
        prompt: 'What is <b>−16 × 6.25</b>?',
        label: '−16 × 6.25 =', answer: -100, expr: '−16×6.25',
        hints: ['A negative times a positive is negative.'],
        mistakes: [{ v: 100, msg: 'The −16 is negative, so this term is negative. It’s gravity pulling the height down.' }],
        after: 'This −100 is how far gravity has pulled it down by this time.',
      }),
      num({
        title: 'Second term',
        body: '<span class="lesson-eq">−100 + <mark>80(2.5)</mark> + 20</span>',
        prompt: 'What is <b>80 × 2.5</b>?',
        label: '80 × 2.5 =', answer: 200, expr: '80×2.5',
        hints: ['Half of 80 is 40. So 80 × 2.5 is 80 × 2, plus 40.'],
        after: 'This is how high the throw would have carried it with no gravity.',
      }),
      num({
        title: 'Add it all up',
        body: '<span class="lesson-eq">−100 + 200 + 20</span>',
        prompt: 'What is the <b>maximum height</b>?',
        label: 'h =', answer: 120, expr: '−100+200+20',
        hints: ['Adding −100 is the same as subtracting 100.'],
        mistakes: [
          { v: 100, msg: 'Don’t forget the 20. That’s the height it started from.' },
          { v: 320, msg: 'The first term is −100, so subtract it.' },
        ],
        after: 'The maximum height is 120 ft. It started at 20 ft, so that makes sense.',
      }),
      {
        kind: 'time', title: 'Check it on the curve',
        body: 'If 120 ft is really the top, every other moment should be lower.',
        task: 'Drag to t = 2 and then to t = 3, and look at the heights.',
        eq: E2, domain: E2_DOMAIN, column: true, tMin: 0, tMax: 5.2, start: 2.5, goal: { visit: [2, 3] },
        after: 'Both are 116 ft, which is lower than 120. They also match each other, since the curve is a mirror around 2.5.',
      },
      {
        kind: 'choice', title: 'Spot the trap',
        body: 'Here’s how this could appear on a test. For h(t) = −16t² + 80t + 20:',
        prompt: 'What is the <b>maximum height</b>?',
        choices: [
          { text: '2.5 ft', correct: false, msg: '2.5 is the time at the top. You stopped halfway, so plug it into h(t).' },
          { text: '5.239 ft', correct: false, msg: 'That’s how many seconds until it lands.' },
          { text: '20 ft', correct: false, msg: 'That’s c, the starting height. It goes up from there.' },
          { text: '120 ft', correct: true },
        ],
        after: 'All three wrong choices come from real parts of the problem. Knowing what each number means is how you spot them.',
      },
    ],
  },

  ground: {
    id: 'ground',
    title: 'When does it land, and why that formula?',
    blurb: 'Why it takes the quadratic formula and gives two answers',
    summary: [
      'On the ground, the height is 0, so solve h(t) = 0.',
      'Work the quadratic formula from the inside out, and watch for subtracting a negative.',
      'It gives two answers. Keep the positive one, because a negative time is before the launch.',
    ],
    screens: [
      {
        kind: 'time', title: 'What does landing mean?',
        body: '<span class="lesson-eq">h(t) = −16t² + 48t + 64</span>',
        task: 'Drag the slider until the ball lands, and read its height.',
        eq: E1, domain: E1_DOMAIN, column: true, tMin: 0, tMax: 4, start: 0, goal: { at: 4 },
        after: 'At the moment it lands, h(t) = 0.',
      },
      {
        kind: 'choice', title: 'Turn it into an equation',
        body: 'You’re looking for the time when the height is 0.',
        prompt: 'Which equation do you need to solve?',
        choices: [
          { text: '−16t² + 48t + 64 = 0', correct: true },
          { text: '−16(0)² + 48(0) + 64', correct: false, msg: 'That sets the time to 0, which gives the height at the start. Here, the height is 0 and the time is unknown.' },
          { text: '−16t² + 48t + 64 = 64', correct: false, msg: 'That finds when it’s at its starting height. Landing is at height 0.' },
        ],
        after: 'Height goes to 0, and t is the unknown you’re solving for.',
      },
      {
        kind: 'time', title: 'Why not just guess?',
        body: 'Try guessing on a messier throw:<span class="lesson-eq">h(t) = −16t² + 40t + 100</span>',
        task: 'Get the height within 5 ft of 0.',
        eq: E3, domain: { t1: 4.5, h1: 140 }, column: true, tMin: 0, tMax: 4.1, start: 1, goal: { absH: 5 },
        after: 'Close, but h(4) is 4 ft and h(4.1) is about −5 ft, so the exact answer is somewhere between. And because t appears both squared and on its own, you can’t just isolate it. That’s the job of the <b>quadratic formula</b>.',
      },
      num({
        title: 'Meet the quadratic formula',
        body: 'It solves any equation in the form at² + bt + c = 0.<span class="lesson-eq">t = (−b ± √(b² − 4ac)) ÷ (2a)</span>Back to the tidy ball, where a = −16, b = 48, and c = 64. Work from the inside out, the same way you’d handle parentheses.',
        prompt: 'What is <b>b²</b>?',
        label: 'b² =', answer: 2304, expr: '48²',
        hints: ['48 × 48. You can type 48 and then tap x².'],
        mistakes: [{ v: 96, msg: 'That’s 48 × 2. Squaring means 48 × 48.' }],
        after: 'That’s the first piece of what goes under the square root.',
      }),
      num({
        title: 'Next piece: 4ac',
        body: '<span class="lesson-eq">√(2304 − <mark>4ac</mark>)</span>',
        prompt: 'What is <b>4 × (−16) × 64</b>?',
        label: '4ac =', answer: -4096, expr: '4(−16)(64)',
        hints: ['One negative number in a multiplication makes the result negative.'],
        mistakes: [{ v: 4096, msg: 'a is −16, so 4ac is negative.' }],
        after: 'Keep the negative sign, because it matters in the next step.',
      }),
      num({
        title: 'The double negative',
        body: '<span class="lesson-eq">√(2304 − (−4096))</span>This is the spot where most mistakes on this problem happen.',
        prompt: 'What is <b>2304 − (−4096)</b>?',
        label: '=', answer: 6400, expr: '2304−(−4096)',
        hints: ['Subtracting a negative is the same as adding.'],
        mistakes: [{ v: -1792, msg: 'Subtracting a negative means adding: 2304 + 4096.' }],
        after: 'Subtracting a negative is adding. In these problems, this part always gets bigger, never smaller.',
      }),
      num({
        title: 'Take the square root',
        body: '<span class="lesson-eq">√6400</span>',
        prompt: 'What is <b>√6400</b>?',
        label: '√ =', answer: 80, expr: '√(6400)',
        hints: ['Tap √, then type 6400.'],
        mistakes: [{ v: 3200, msg: 'A square root isn’t dividing by 2. What number times itself makes 6400?' }],
        after: 'Now the formula is down to: t = (−48 ± 80) ÷ (−32)',
      }),
      num({
        title: 'The ± means two answers',
        body: 'The ± says to do it twice, once adding and once subtracting.<span class="lesson-eq">t = (−48 <mark>+</mark> 80) ÷ (−32)</span>',
        prompt: 'What does the <b>+</b> version give?',
        label: 't =', answer: -1, expr: '(−48+80)÷(−32)',
        hints: ['Do the top first: −48 + 80. Then divide by −32.'],
        mistakes: [{ v: 1, msg: 'The top is positive and you’re dividing by a negative, so the result is negative.' }, { v: 32, msg: 'That’s the top of the fraction. Now divide by −32.' }],
        after: 'That gives t = −1. Hold on to that, and try the other one.',
      }),
      num({
        title: 'Now the other one',
        body: '<span class="lesson-eq">t = (−48 <mark>−</mark> 80) ÷ (−32)</span>',
        prompt: 'What does the <b>−</b> version give?',
        label: 't =', answer: 4, expr: '(−48−80)÷(−32)',
        hints: ['The top is −48 − 80 = −128. Then divide by −32.'],
        mistakes: [{ v: -4, msg: 'A negative divided by a negative is positive.' }, { v: -128, msg: 'That’s the top of the fraction. Now divide by −32.' }],
        after: 'That’s t = 4, the landing time you saw at the start of this lesson.',
      }),
      {
        kind: 'toggle', title: 'Why are there two answers?', mode: 'extend',
        body: 'The formula doesn’t know about the ball. It only knows the curve, and the curve keeps going in both directions.',
        task: 'Show what the curve does before the throw.',
        labels: ['Show before the throw', 'Hide before the throw'],
        eq: E1, domain: { t0: -1.6, t1: 4.5, h1: 120 },
        after: 'A full parabola crosses height 0 in two places: t = −1 and t = 4. The dashed part never really happened, since the ball hadn’t been thrown yet.',
      },
      {
        kind: 'choice', title: 'Which one do you keep?',
        body: 'The formula gave t = −1 and t = 4.',
        prompt: 'When does the ball land?',
        choices: [
          { text: 't = 4 sec', correct: true },
          { text: 't = −1 sec', correct: false, msg: 'That would be one second before it was thrown.' },
        ],
        after: 'Keep the positive one. Because a is negative here, it always comes from the “−” version of ±.',
      },
      num({
        title: 'Solve the messy one',
        body: 'Back to the throw you tried guessing on. Now you can get it exactly.<span class="lesson-eq">h(t) = −16t² + 40t + 100<br>b² − 4ac = 1600 + 6400 = 8000<br>t = (−40 − √8000) ÷ (−32)</span>You can type that whole line on the keypad.',
        prompt: 'What is <b>t</b>? Round to 3 decimals.',
        label: 't =', answer: 4.045, tol: 0.002, expr: '(−40−√(8000))÷(−32)',
        hints: ['Type ( − 4 0 − √ 8 0 0 0 ) ) ÷ ( − 3 2 ). One ) closes the √, and the next closes the top of the fraction.'],
        mistakes: [{ v: -1.545, msg: 'That’s the + version, which comes out negative. Use the − version.' }],
        after: 'It lands at 4.045 seconds, right between the 4 and 4.1 you narrowed it to by guessing. The formula just gets you there exactly.',
      }),
    ],
  },
};

// Pure helpers for the interactive screens, kept here so they can be tested.

export const heightAt = (eq, t) => -16 * t * t + eq.b * t + eq.c;

export function timeGoalMet(screen, t, visited) {
  const { goal, eq } = screen;
  if (goal.at !== undefined) return Math.abs(t - goal.at) < 0.051;
  if (goal.visit) return goal.visit.every((v) => visited.some((seen) => Math.abs(seen - v) < 0.051));
  if (goal.absH !== undefined) return Math.abs(heightAt(eq, t)) <= goal.absH;
  return false;
}
