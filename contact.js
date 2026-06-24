/**
 * お問い合わせ専用ページ（contact.html）
 */
const CONTACT_API_PORT = 3456;
const CONTACT_API_HOST = '127.0.0.1';

function getApiBase() {
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    return '';
  }
  return `http://${CONTACT_API_HOST}:${CONTACT_API_PORT}`;
}

function hasContactConfig(cfg) {
  return Boolean(cfg?.contactFormEndpoint || cfg?.contactEmail);
}

function getFormSubmitEndpoint(cfg) {
  if (cfg?.contactFormEndpoint) {
    const endpoint = cfg.contactFormEndpoint.trim();
    if (endpoint.includes('/ajax/')) return endpoint;
    return endpoint.replace('https://formsubmit.co/', 'https://formsubmit.co/ajax/');
  }
  if (cfg?.contactEmail) {
    return `https://formsubmit.co/ajax/${encodeURIComponent(cfg.contactEmail)}`;
  }
  return '';
}

function buildFormSubmitPayload(input) {
  const name = input.get('name')?.trim() || '';
  const email = input.get('email')?.trim() || '';
  const phone = input.get('phone')?.trim() || '';
  const category = input.get('category')?.trim() || '';
  const message = input.get('message')?.trim() || '';
  const consent = input.get('consent')?.trim() || '';

  const out = new URLSearchParams();
  out.set('お名前', name);
  out.set('メールアドレス', email);
  out.set('email', email);
  if (phone) out.set('電話番号', phone);
  out.set('お問い合わせ種別', category);
  out.set('お問い合わせ内容', message);
  if (consent) out.set('個人情報の同意', consent);

  out.set('_replyto', email);
  out.set('_subject', category
    ? `AQUA LUMINA お問い合わせ（${category}）`
    : 'AQUA LUMINA お問い合わせ');
  out.set('_template', 'table');
  out.set('_captcha', 'false');

  return out.toString();
}

function isFormSubmitSuccess(data) {
  return data.success === 'true' || data.success === true;
}

function showSuccessModal() {
  const modal = document.getElementById('contact-success-modal');
  if (!modal) return;

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('contact-modal-open');
}

function showContactNotice(notice, cfg, err, data) {
  if (!notice) return;

  notice.hidden = false;
  const msg = String(err?.message || data?.message || '');
  const email = cfg?.contactEmail || '受信メールアドレス';

  if (data?.needsActivation || /activation/i.test(msg)) {
    notice.innerHTML = `<p><strong>初回の有効化が必要です。</strong></p><p><code>${email}</code> に届いた FormSubmit の「Activate Form」メールのリンクを開いてください（迷惑メールも確認）。有効化後にもう一度送信してください。</p>`;
    return;
  }

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  notice.innerHTML = isLocal
    ? '<p><strong>送信に失敗しました。</strong></p><p><code>npm start</code> でサーバーを起動してから、もう一度お試しください。</p>'
    : '<p><strong>送信に失敗しました。</strong></p><p>しばらくしてからもう一度お試しください。</p>';
}

async function submitContactForm(cfg, params) {
  const useServerProxy = window.location.protocol === 'file:';

  if (useServerProxy) {
    const res = await fetch(`${getApiBase()}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params.toString(),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data, ok: res.ok && data.ok };
  }

  const endpoint = getFormSubmitEndpoint(cfg);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Accept: 'application/json',
    },
    body: buildFormSubmitPayload(params),
  });
  const data = await res.json().catch(() => ({}));
  const ok = res.ok && isFormSubmitSuccess(data);
  return {
    res,
    data: {
      ...data,
      needsActivation: /activation/i.test(data.message || ''),
    },
    ok,
  };
}

function initContactForm() {
  const cfg = window.SITE_CONFIG || {};
  const form = document.getElementById('contact-form');
  const notice = document.getElementById('contact-setup-notice');
  const submitBtn = document.getElementById('contact-submit');

  if (!form) return;

  if (!hasContactConfig(cfg)) {
    if (notice) {
      notice.hidden = false;
      notice.textContent = 'config.js の contactEmail に受信アドレスを設定してください。';
    }
    submitBtn?.setAttribute('disabled', 'true');
    return;
  }

  if (window.location.protocol === 'file:' && notice) {
    notice.hidden = false;
    notice.innerHTML = '<p>ターミナルで <code>npm start</code> を実行した状態で送信してください。</p>';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    const category = document.getElementById('contact-category')?.value;

    const params = new URLSearchParams();
    params.set('name', document.getElementById('contact-name')?.value?.trim() || '');
    params.set('email', document.getElementById('contact-email')?.value?.trim() || '');
    params.set('phone', document.getElementById('contact-phone')?.value?.trim() || '');
    params.set('category', category || '');
    params.set('message', document.getElementById('contact-message')?.value?.trim() || '');
    if (document.getElementById('contact-consent')?.checked) {
      params.set('consent', '同意済み');
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '送信中…';
    }

    try {
      const { data, ok } = await submitContactForm(cfg, params);

      if (ok) {
        showSuccessModal();
        return;
      }

      throw Object.assign(new Error(data.message || 'send_failed'), { data });
    } catch (err) {
      showContactNotice(notice, cfg, err, err.data);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '送信する';
      }
    }
  });
}

initContactForm();
