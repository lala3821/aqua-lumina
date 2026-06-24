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

function showSuccessModal() {
  const modal = document.getElementById('contact-success-modal');
  if (!modal) return;

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('contact-modal-open');
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
      const res = await fetch(`${getApiBase()}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: params.toString(),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        showSuccessModal();
        return;
      }

      throw new Error(data.message || 'send_failed');
    } catch (err) {
      if (notice) {
        notice.hidden = false;
        const msg = String(err?.message || '');
        if (msg.includes('Activation')) {
          notice.innerHTML = '<p><strong>初回の有効化が必要です。</strong></p><p><code>yogenyo134@tapi.re</code> に届いた FormSubmit の「Activate Form」メールのリンクを開いてください（迷惑メールも確認）。有効化後にもう一度送信してください。</p>';
        } else {
          const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          notice.innerHTML = isLocal
            ? '<p><strong>送信に失敗しました。</strong></p><p><code>npm start</code> でサーバーを起動してから、もう一度お試しください。</p>'
            : '<p><strong>送信に失敗しました。</strong></p><p>しばらくしてからもう一度お試しください。</p>';
        }
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '送信する';
      }
    }
  });
}

initContactForm();
