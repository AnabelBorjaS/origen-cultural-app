import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Execute the real recovery binder with synthetic UI and Auth, without emails.
const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = source.indexOf('  function bindRecoverPassword() {');
const end = source.indexOf('\n  function bindResetPassword()', start);
assert.ok(start >= 0 && end > start);
const binder = source.slice(start, end);
function setup(lang = 'es', captchaFailure = false) {
  let handler, resolveRequest, rejectRequest;
  let calls = 0, resets = 0;
  const button = { disabled: false, textContent: 'Send link' };
  const status = { textContent: 'Old message' };
  const attrs = {};
  const form = {
    addEventListener(_, fn) { handler = fn; },
    querySelector() { return button; },
    setAttribute(k, v) { attrs[k] = v; },
    removeAttribute(k) { delete attrs[k]; }
  };
  const pending = new Promise((resolve, reject) => { resolveRequest = resolve; rejectRequest = reject; });
  vm.runInNewContext(binder + '\nbindRecoverPassword();', {
    document: { getElementById: id => id === 'recover-form' ? form : status },
    state: { lang },
    FormData: class { get() { return 'synthetic@example.invalid'; } },
    mountTurnstile() {},
    requireCaptchaToken() { if (captchaFailure) throw new Error('Complete CAPTCHA'); return 'synthetic'; },
    resetTurnstile() { resets++; },
    window: { ORIGEN_API: { resetPassword() { calls++; return pending; } } }
  });
  return { button, status, attrs, submit: () => handler({ preventDefault() {} }),
    resolve: resolveRequest, reject: rejectRequest, calls: () => calls, resets: () => resets };
}
for (const lang of ['es', 'en']) {
  const ui = setup(lang);
  const first = ui.submit();
  await ui.submit();
  assert.equal(ui.calls(), 1, 'Pending requests must not send duplicate emails');
  assert.equal(ui.button.disabled, true);
  assert.equal(ui.attrs['aria-busy'], 'true');
  assert.equal(ui.status.textContent, '');
  ui.resolve(); await first;
  assert.match(ui.status.textContent, lang === 'es' ? /Si existe una cuenta/ : /If an account exists/);
  assert.equal(ui.button.disabled, false);
  assert.equal(ui.button.textContent, 'Send link');
  assert.equal(ui.attrs['aria-busy'], undefined);
  for (const error of [{code:'email_address_not_authorized', message:'Private account detail'}, {code:'over_email_send_rate_limit'}, {status:429}, new Error('User does not exist')]) {
    const failure = setup(lang);
    const request = failure.submit(); failure.reject(error); await request;
    assert.doesNotMatch(failure.status.textContent, /Private account detail|User does not exist/);
    assert.ok(failure.status.textContent.length > 0);
    assert.equal(failure.button.disabled, false);
    assert.equal(failure.resets(), 1);
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      assert.match(failure.status.textContent, lang === 'es' ? /Espera/ : /Wait/);
    }
    await failure.submit();
    assert.equal(failure.calls(), 2, 'Failed requests must permit an explicit retry');
  }
}
const captcha = setup('en', true);
await captcha.submit();
assert.equal(captcha.calls(), 0);
assert.equal(captcha.status.textContent, 'Complete CAPTCHA');
assert.equal(captcha.button.disabled, false);
console.log('PASS Recovery suppresses duplicate requests, preserves neutral feedback, handles delivery/rate errors and allows retry in ES/EN.');
