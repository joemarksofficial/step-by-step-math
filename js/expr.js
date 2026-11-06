// Small arithmetic evaluator behind the on-screen keypad, so she can work a
// step right in the answer box, e.g. "−16(1.5)²+48(1.5)+64".
// Follows normal order of operations, so −3² is −9 and (−3)² is 9.
// Unclosed parentheses are closed automatically, like most calculators.

export function evaluate(source) {
  const s = String(source).replace(/\s/g, '').replace(/-/g, '−').replace(/\*/g, '×').replace(/\//g, '÷');
  if (!s) return null;
  let i = 0;

  const peek = () => s[i];

  function expression() {
    let value = term();
    while (peek() === '+' || peek() === '−') {
      const op = s[i++];
      const right = term();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }

  function term() {
    let value = unary();
    for (;;) {
      const c = peek();
      if (c === '×') { i++; value *= unary(); }
      else if (c === '÷') { i++; value /= unary(); }
      // Implied multiplication: 2(3), (2)(3), 2√(9)
      else if (c === '(' || c === '√' || isNumberStart(c)) { value *= power(); }
      else return value;
    }
  }

  // A leading minus applies after squaring.
  function unary() {
    if (peek() === '−') { i++; return -unary(); }
    if (peek() === '+') { i++; return unary(); }
    return power();
  }

  function power() {
    let value = primary();
    while (peek() === '²') { i++; value *= value; }
    return value;
  }

  function primary() {
    const c = peek();
    if (c === '(') {
      i++;
      const value = expression();
      if (peek() === ')') i++;
      else if (i < s.length) throw new Error('expected )');
      return value;
    }
    if (c === '√') {
      i++;
      return Math.sqrt(power());
    }
    if (isNumberStart(c)) return number();
    throw new Error('unexpected token');
  }

  function number() {
    const start = i;
    while (i < s.length && /[0-9.]/.test(s[i])) i++;
    const text = s.slice(start, i);
    if ((text.match(/\./g) || []).length > 1 || text === '.') throw new Error('bad number');
    return parseFloat(text);
  }

  function isNumberStart(c) {
    return c !== undefined && /[0-9.]/.test(c);
  }

  try {
    const value = expression();
    if (i !== s.length || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}

// True when the entry contains actual arithmetic, not just a plain number.
export function isCalculation(source) {
  return /[+×÷()²√]|.−/.test(String(source));
}
