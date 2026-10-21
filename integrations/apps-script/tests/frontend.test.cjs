/* Exercita o transporte real do app.js com DOM e relógio controlados. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const app = fs.readFileSync(path.join(__dirname, '../../../app.js'), 'utf8');
const start = app.indexOf('function sendOnlineRequest(data) {');
const end = app.indexOf("bookingForm.addEventListener('submit'", start);
assert.ok(start > 0 && end > start, 'O transporte precisa continuar presente no frontend.');
const requestId = '15c0c6a5-087b-4fd1-b6ac-6102a8716e89';
const endpoint = 'https://script.google.com/macros/s/test-deployment/exec';
const input = { requestId, action: 'request', name: 'Maria', consent: 'true' };

function fixture(url = endpoint, submitError = false) {
  const listeners = new Map(), elements = [], timers = new Map();
  let nextTimer = 0, submitted = 0;
  const window = { addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: (type, fn) => {
    if (listeners.get(type) === fn) listeners.delete(type);
  } };
  const document = {
    createElement: tag => {
      const element = { tag, children: [], removed: false, append(...children) { this.children.push(...children); }, remove() { this.removed = true; } };
      if (tag === 'form') element.submit = () => { submitted++; if (submitError) throw Error('Browser blocked submission'); };
      elements.push(element); return element;
    },
    body: { append: (...children) => { children.forEach(element => { element.attached = true; }); } }
  };
  const context = vm.createContext({ window, document, URL, siteConfig: { bookingEndpoint: url },
    setTimeout: callback => { const id = ++nextTimer; timers.set(id, callback); return id; }, clearTimeout: id => timers.delete(id) });
  vm.runInContext(app.slice(start, end), context);
  return { send: data => context.sendOnlineRequest(data), elements, listeners, timers, submitted: () => submitted,
    message: (origin, payload) => listeners.get('message')?.({ origin, data: payload }),
    timeout: () => { for (const callback of [...timers.values()]) callback(); } };
}
function ack(extra = {}) { return { source: 'livia-booking', requestId, ok: true, reference: 'LL-123456ABCDEF', error: '', ...extra }; }
function cleaned(f) { assert.equal(f.listeners.size, 0); assert.equal(f.timers.size, 0); assert.ok(f.elements.filter(el => el.tag === 'form' || el.tag === 'iframe').every(el => el.removed)); }

test('posts fields via hidden form and ignores false acknowledgements from wrong origin or UUID', async () => {
  const f = fixture(); let settled = false;
  const promise = f.send(input).then(result => { settled = true; return result; });
  assert.equal(f.submitted(), 1);
  const form = f.elements.find(el => el.tag === 'form'), frame = f.elements.find(el => el.tag === 'iframe');
  assert.equal(form.method, 'POST'); assert.equal(form.target, frame.name); assert.equal(form.action, endpoint); assert.equal(frame.hidden, true);
  assert.deepEqual(Object.fromEntries(form.children.map(el => [el.name, el.value])), input);
  for (const origin of ['https://evil.example', 'https://script.google.com.evil.example', 'http://script.google.com', 'https://script.google.com:444', 'null']) f.message(origin, ack());
  f.message('https://script.google.com', ack({ requestId: 'different' }));
  f.message('https://script.google.com', ack({ source: 'other' }));
  await Promise.resolve(); assert.equal(settled, false); assert.equal(f.listeners.size, 1);
  f.message('https://n-example-script.googleusercontent.com', ack());
  const result = await promise; assert.equal(result.reference, 'LL-123456ABCDEF'); cleaned(f);
});
test('does not report success for an empty, malformed or missing reference', async () => {
  for (const reference of ['', 'anything', 'LL-123', undefined]) {
    const f = fixture(), promise = f.send(input);
    f.message('https://script.google.com', ack({ reference }));
    await assert.rejects(promise, /confirmar o recebimento/); cleaned(f);
  }
});
test('server rejection is visible; timeout leaves receipt unconfirmed and cleans the iframe', async () => {
  const f = fixture(), failed = f.send(input);
  f.message('https://script.googleusercontent.com', ack({ ok: false, reference: '', error: 'Informe uma data válida.' }));
  await assert.rejects(failed, /Informe uma data válida/); cleaned(f);
  const t = fixture(), timeout = t.send(input); t.timeout();
  await assert.rejects(timeout, /Não recebemos a confirmação/); cleaned(t);
});
test('rejects malformed/untrusted configuration before submitting and cleans browser submit failures', async () => {
  for (const value of ['', 'not-a-url', 'https://evil.example/macros/s/test/exec', endpoint + '?secret=1', endpoint + '#fragment', 'https://user:pass@script.google.com/macros/s/test/exec', endpoint.replace('/exec', '/dev')]) {
    const f = fixture(value); await assert.rejects(f.send(input), /indisponível/); assert.equal(f.submitted(), 0); assert.equal(f.elements.length, 0);
  }
  const f = fixture(endpoint, true); await assert.rejects(f.send(input), /confirmar o envio/); cleaned(f);
});
