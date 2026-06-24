// ===== Site loader =====
const siteLoader = document.getElementById('site-loader');
const loaderProgress = document.getElementById('loader-progress');
const loaderPercent = document.getElementById('loader-percent');
const loaderTagline = document.getElementById('loader-tagline');

const loaderTaglines = [
  '海の都市へ、降下中',
  '水深を計測しています',
  '展示エリアを起動中',
  'ようこそ、AQUA LUMINAへ',
];

function initSiteLoader() {
  if (!siteLoader) return;

  const minDuration = 2200;
  const start = performance.now();
  let taglineIndex = 0;

  const taglineTimer = setInterval(() => {
    taglineIndex = (taglineIndex + 1) % loaderTaglines.length;
    if (loaderTagline) loaderTagline.textContent = loaderTaglines[taglineIndex];
  }, 700);

  function tick() {
    const elapsed = performance.now() - start;
    const loadProgress = document.readyState === 'complete' ? 1 : 0.65;
    const timeProgress = Math.min(elapsed / minDuration, 1);
    const progress = Math.min(loadProgress * 0.4 + timeProgress * 0.6, 1);

    const percent = Math.min(Math.round(progress * 100), 100);

    if (loaderProgress) loaderProgress.style.width = `${percent}%`;
    if (loaderPercent) loaderPercent.textContent = `LOADING ${percent}%`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      finishLoader(taglineTimer);
    }
  }

  function finishLoader(timer) {
    clearInterval(timer);
    if (loaderProgress) loaderProgress.style.width = '100%';
    if (loaderPercent) loaderPercent.textContent = 'LOADING 100%';
    if (loaderTagline) loaderTagline.textContent = '到着しました';

    setTimeout(() => {
      siteLoader.classList.add('is-hidden');
      document.body.classList.remove('is-loading');
      siteLoader.setAttribute('aria-hidden', 'true');
      if (typeof syncCarouselAutoState === 'function') syncCarouselAutoState();
    }, 400);
  }

  window.addEventListener('load', () => {
    if (loaderProgress && document.readyState === 'complete') {
      loaderProgress.style.width = '100%';
    }
  });

  requestAnimationFrame(tick);
}

initSiteLoader();

// ===== Live clock =====
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const timeEl = document.getElementById('live-time');
  const dateEl = document.getElementById('board-date');
  if (timeEl) timeEl.textContent = time;
  if (dateEl) dateEl.textContent = date;
}

updateClock();
setInterval(updateClock, 30000);

// ===== Custom cursor =====
const cursor = document.getElementById('cursor');
const rippleLayer = document.getElementById('ripple-layer');
let cursorX = 0;
let cursorY = 0;
let ringX = 0;
let ringY = 0;
const isTouchDevice = matchMedia('(pointer: coarse)').matches;

if (cursor && !isTouchDevice) {
  document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
  });

  function animateRing() {
    ringX += (cursorX - ringX) * 0.15;
    ringY += (cursorY - ringY) * 0.15;
    const ring = cursor.querySelector('.cursor-ring');
    if (ring) ring.style.transform = `translate(${ringX - cursorX}px, ${ringY - cursorY}px)`;
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll('a, button, .to-top, .carousel-3d-item, .carousel-btn, .carousel-dot, .js-creature-card, .js-flip-card, .filter-btn').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });

  document.addEventListener('mousedown', () => cursor.classList.add('is-click'));
  document.addEventListener('mouseup', () => cursor.classList.remove('is-click'));
}

// ===== Click ripples =====
function spawnRipple(x, y) {
  if (!rippleLayer) return;
  rippleLayer.innerHTML = '';
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  const size = 80;
  ripple.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px`;
  rippleLayer.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.detail-close')) {
    spawnRipple(e.clientX, e.clientY);
  }
});

// ===== Parallax =====
const parallaxElements = document.querySelectorAll('[data-parallax]');
const heroBg = document.querySelector('.hero-bg');

function updateParallax() {
  const scrollY = window.scrollY;
  const mouseX = window._mouseX ?? 0.5;
  const mouseY = window._mouseY ?? 0.5;

  parallaxElements.forEach((el) => {
    const speed = parseFloat(el.dataset.parallax);
    const offset = scrollY * speed;
    const mx = (mouseX - 0.5) * speed * 40;
    const my = (mouseY - 0.5) * speed * 20;
    el.style.transform = `translate3d(${mx}px, ${offset + my}px, 0)`;
  });

  if (heroBg && scrollY < window.innerHeight) {
    heroBg.style.transform = `translate3d(0, ${scrollY * 0.35}px, 0) scale(${1 + scrollY * 0.00015})`;
  }
}

window.addEventListener('scroll', updateParallax, { passive: true });
window.addEventListener('mousemove', (e) => {
  window._mouseX = e.clientX / window.innerWidth;
  window._mouseY = e.clientY / window.innerHeight;
  updateParallax();
});

// ===== 3D Area Carousel =====
const AREA_IMAGE_DIR = 'エリア画像';

/** エリア名とファイル名が異なる場合のみ指定 */
const AREA_IMAGE_ALIASES = {
  オリジナルショップ: 'アクアルミナショップ',
};

function areaAssets(name) {
  const file = AREA_IMAGE_ALIASES[name] || name;
  return { image: `${AREA_IMAGE_DIR}/${file}.png` };
}

const AREAS = [
  {
    id: 'AREA-01',
    name: 'オーシャンホール',
    floor: '1F — 2F',
    desc: '高さ約35m、幅約60mの巨大水槽が広がるシンボルエリア。マンタやジンベエザメが悠々と泳ぎ、圧倒的なスケールを体感できます。',
    extra: 'ガイドツアー毎時開催。ダイバー解説付きフィーディングは14:00。',
    ...areaAssets('オーシャンホール'),
    specs: ['5,500,000 L', '42 種'],
    tag: 'SIGNATURE',
  },
  {
    id: 'AREA-02',
    name: 'ブルーオーシャンタワー',
    floor: '2F',
    desc: '360度を海に囲まれた円柱型水槽。光と音の演出が幻想的な、人気のフォトスポットです。',
    extra: '夜間はレーザー演出が追加されるスペシャルモードあり。',
    ...areaAssets('ブルーオーシャンタワー'),
    specs: ['1,800,000 L', '36 種'],
  },
  {
    id: 'AREA-03',
    name: 'アクアトンネル',
    floor: 'B1F',
    desc: '頭上を魚たちが泳ぐ海中トンネル。まるで海の中を歩いているかのような没入感を味わえます。',
    extra: 'マグロの群泳は秋冬が見頃。通過種は季節で変化します。',
    ...areaAssets('アクアトンネル'),
    specs: ['2,100,000 L', '28 種'],
  },
  {
    id: 'AREA-04',
    name: 'クラゲギャラリー',
    floor: '2F',
    desc: 'クラゲの浮遊する姿を光と映像で演出。静かで幻想的な癒しの空間です。',
    extra: '30分ごとにライトショー。最前列はアプリで予約可能。',
    ...areaAssets('クラゲギャラリー'),
    specs: ['180,000 L', '12 種'],
  },
  {
    id: 'AREA-05',
    name: 'ポーラーゾーン',
    floor: '3F',
    desc: '南極・北極の生きものたちが暮らすエリア。ペンギンやアザラシの姿を間近で観察できます。',
    extra: '氷下トンネルは写真撮影の定番スポット。',
    ...areaAssets('ポーラーゾーン'),
    specs: ['1,200,000 L', '24 種'],
  },
  {
    id: 'AREA-06',
    name: 'コーラルリーフガーデン',
    floor: '2F',
    desc: '色鮮やかなコーラルリーフと熱帯魚の世界。自然の美しさと多様性を感じられるエリアです。',
    extra: 'UVライトによる珊瑚の蛍光観察ツアーは週末限定。',
    ...areaAssets('コーラルリーフガーデン'),
    specs: ['820,000 L', '86 種'],
  },
  {
    id: 'AREA-07',
    name: 'タッチプール',
    floor: '1F',
    desc: 'ヒトデやナマコなど、海の生き物に直接触れることができる体験型エリア。お子さまにも大人気です。',
    extra: 'スタッフ常駐で安全案内。消毒後にタッチ可能。',
    ...areaAssets('タッチプール'),
    specs: ['120,000 L', '22 種'],
  },
  {
    id: 'AREA-08',
    name: 'ディープシーラボ',
    floor: 'B1F',
    desc: '深海の神秘に迫るエリア。珍しい深海生物や最新の研究を紹介しています。',
    extra: '水压体験コーナーで1000m相当の環境を体感。',
    ...areaAssets('ディープシーラボ'),
    specs: ['340,000 L', '38 種'],
  },
  {
    id: 'AREA-09',
    name: 'オーシャンシアター',
    floor: '3F',
    desc: '大迫力の映像と音響で海の世界を体感。クジラやイルカの映像がスクリーンに広がります。',
    extra: '1日4回上映。座席は先着順、ナイト上映は要予約。',
    ...areaAssets('オーシャンシアター'),
    specs: ['400席', '4本 / 日'],
  },
  {
    id: 'AREA-10',
    name: 'オーシャンビューカフェ',
    floor: '2F',
    desc: '大水槽を眺めながらくつろげるカフェ。オリジナルメニューやスイーツも楽しめます。',
    extra: '窓際席は混雑時は90分制。テイクアウトも可。',
    ...areaAssets('オーシャンビューカフェ'),
    specs: ['120席', '10:00—20:00'],
  },
  {
    id: 'AREA-11',
    name: 'オリジナルショップ',
    floor: '1F',
    desc: 'ここでしか買えない限定グッズやぬいぐるみ、雑貨などを豊富に取り揃えています。',
    extra: 'オンラインストア未掲載の限定品あり。',
    ...areaAssets('オリジナルショップ'),
    specs: ['—', '500+ SKU'],
  },
];

const carousel3d = document.getElementById('carousel-3d');
const carouselRing = document.getElementById('carousel-ring');
const carouselDots = document.getElementById('carousel-dots');
const carouselInfo = document.getElementById('carousel-info');
const carouselPrev = document.getElementById('carousel-prev');
const carouselNext = document.getElementById('carousel-next');
const carouselDetailBtn = document.getElementById('carousel-detail-btn');

let carouselIndex = 0;
let carouselItems = [];
let carouselDragging = false;
let carouselDragStartX = 0;
let carouselDragDelta = 0;
let carouselAutoTimer = null;
let carouselInView = false;
const CAROUSEL_AUTO_MS = 4500;

function isZonesSectionInView() {
  const el = document.getElementById('zones');
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top < vh * 0.85 && rect.bottom > vh * 0.12;
}

function ensureCarouselAuto() {
  if (!carousel3d) return;

  const inView = isZonesSectionInView();
  carouselInView = inView;
  carousel3d.classList.toggle('is-auto', inView);

  if (!inView || carouselDragging) {
    stopCarouselAuto();
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stopCarouselAuto();
    return;
  }
  if (carouselAutoTimer) return;

  carouselAutoTimer = window.setInterval(() => {
    if (!isZonesSectionInView() || carouselDragging) return;
    goToCarousel(carouselIndex + 1);
  }, CAROUSEL_AUTO_MS);
}

function syncCarouselAutoState() {
  ensureCarouselAuto();
}

function buildCarouselItem(area) {
  const item = document.createElement('article');
  item.className = 'carousel-3d-item';
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');

  const bgHtml = area.image
    ? `<div class="carousel-3d-item-bg"><img src="${area.image}"${area.imageFallback ? ` data-fallback="${area.imageFallback}"` : ''} alt="${area.name}" loading="lazy"></div>`
    : `<div class="carousel-3d-item-bg" data-depth="${area.depth}"></div>`;

  item.innerHTML = `
    ${bgHtml}
    <div class="carousel-3d-item-content">
      <h3>${area.name}</h3>
    </div>
  `;

  item.addEventListener('click', () => {
    const idx = Number(item.dataset.index);
    if (idx === carouselIndex) openZonePanelFromArea(AREAS[idx]);
    else goToCarousel(idx);
  });

  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      item.click();
    }
  });

  return item;
}

function getCarouselSpread() {
  const stage = document.querySelector('.carousel-3d-stage');
  const w = stage?.clientWidth || window.innerWidth;
  if (w < 768) return Math.min(w * 0.32, 150);
  if (w < 1100) return Math.min(w * 0.24, 220);
  return Math.min(w * 0.2, 300);
}

function getCarouselVisibleRange() {
  const w = window.innerWidth;
  if (w < 768) return 2;
  if (w < 1100) return 3;
  return 4;
}

function getWrappedOffset(index, activeIndex, count) {
  let offset = index - activeIndex;
  if (offset > count / 2) offset -= count;
  if (offset < -count / 2) offset += count;
  return offset;
}

function updateCarousel3D() {
  const count = AREAS.length;
  const spreadX = getCarouselSpread();
  const depthZ = window.innerWidth < 768 ? 90 : 130;
  const rotateStep = window.innerWidth < 768 ? 48 : 56;
  const visibleRange = getCarouselVisibleRange();

  carouselRing.style.transform = '';

  carouselItems.forEach((item, i) => {
    const offset = getWrappedOffset(i, carouselIndex, count);
    const absOffset = Math.abs(offset);
    const isActive = offset === 0;
    const isNear = absOffset === 1;
    const isFar = absOffset === 2;

    item.classList.toggle('is-active', isActive);
    item.classList.toggle('is-near', isNear);
    item.classList.toggle('is-far', isFar);
    item.classList.toggle('is-hidden', absOffset > visibleRange);

    if (absOffset > visibleRange) {
      item.style.visibility = 'hidden';
      item.style.pointerEvents = 'none';
      item.style.zIndex = '0';
      item.style.transform = 'translate3d(0, 0, -1200px) rotateY(0deg) scale(0.6)';
      return;
    }

    const x = offset * spreadX;
    const z = -absOffset * depthZ;
    const ry = -offset * rotateStep;
    const scale = isActive ? 1.06 : 1 - absOffset * 0.065;

    item.style.visibility = 'visible';
    item.style.pointerEvents = 'auto';
    item.style.removeProperty('opacity');
    item.style.zIndex = String(120 - absOffset * 10);
    item.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${ry}deg) scale(${scale})`;
  });

  const area = AREAS[carouselIndex];
  carouselInfo.querySelector('.carousel-info-id').textContent = area.id;
  carouselInfo.querySelector('.carousel-info-title').textContent = area.name;
  carouselInfo.querySelector('.carousel-info-desc').textContent = area.desc;

  carouselDots.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === carouselIndex);
    dot.setAttribute('aria-selected', i === carouselIndex ? 'true' : 'false');
  });
}

function goToCarousel(index) {
  const count = AREAS.length;
  carouselIndex = ((index % count) + count) % count;
  updateCarousel3D();
}

function stopCarouselAuto() {
  if (carouselAutoTimer) {
    clearInterval(carouselAutoTimer);
    carouselAutoTimer = null;
  }
}

function initCarousel3D() {
  if (!carouselRing) return;

  AREAS.forEach((area, i) => {
    const item = buildCarouselItem(area);
    item.dataset.index = String(i);
    carouselRing.appendChild(item);
    carouselItems.push(item);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', area.name);
    dot.addEventListener('click', () => goToCarousel(i));
    carouselDots.appendChild(dot);
  });

  carouselPrev?.addEventListener('click', () => goToCarousel(carouselIndex - 1));
  carouselNext?.addEventListener('click', () => goToCarousel(carouselIndex + 1));
  carouselDetailBtn?.addEventListener('click', () => openZonePanelFromArea(AREAS[carouselIndex]));

  carousel3d.addEventListener('mousedown', (e) => {
    carouselDragging = true;
    carouselDragStartX = e.clientX;
    carouselDragDelta = 0;
    carousel3d.classList.add('is-dragging');
    stopCarouselAuto();
  });

  window.addEventListener('mousemove', (e) => {
    if (!carouselDragging) return;
    carouselDragDelta = e.clientX - carouselDragStartX;
  });

  window.addEventListener('mouseup', () => {
    if (!carouselDragging) return;
    carouselDragging = false;
    carousel3d.classList.remove('is-dragging');
    if (Math.abs(carouselDragDelta) > 50) {
      goToCarousel(carouselIndex + (carouselDragDelta < 0 ? 1 : -1));
    }
    carouselDragDelta = 0;
    ensureCarouselAuto();
  });

  carousel3d.addEventListener('touchstart', (e) => {
    carouselDragging = true;
    carouselDragStartX = e.touches[0].clientX;
    carouselDragDelta = 0;
    carousel3d.classList.add('is-dragging');
    stopCarouselAuto();
  }, { passive: true });

  carousel3d.addEventListener('touchmove', (e) => {
    if (!carouselDragging) return;
    carouselDragDelta = e.touches[0].clientX - carouselDragStartX;
  }, { passive: true });

  carousel3d.addEventListener('touchend', () => {
    if (!carouselDragging) return;
    carouselDragging = false;
    carousel3d.classList.remove('is-dragging');
    if (Math.abs(carouselDragDelta) > 40) {
      goToCarousel(carouselIndex + (carouselDragDelta < 0 ? 1 : -1));
    }
    carouselDragDelta = 0;
    ensureCarouselAuto();
  });

  window.addEventListener('scroll', syncCarouselAutoState, { passive: true });
  window.addEventListener('resize', syncCarouselAutoState, { passive: true });
  window.addEventListener('load', syncCarouselAutoState);
  syncCarouselAutoState();
  requestAnimationFrame(() => syncCarouselAutoState());
  setTimeout(syncCarouselAutoState, 600);

  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('zones')?.getBoundingClientRect) return;
    const rect = document.getElementById('zones').getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;
    if (e.key === 'ArrowLeft') goToCarousel(carouselIndex - 1);
    if (e.key === 'ArrowRight') goToCarousel(carouselIndex + 1);
  });

  window.addEventListener('resize', updateCarousel3D);
  updateCarousel3D();

  document.querySelectorAll('.carousel-3d-item-bg img[data-fallback]').forEach((img) => {
    img.addEventListener('error', function onImgError() {
      const fallback = this.dataset.fallback;
      if (fallback && !this.dataset.fallbackUsed) {
        this.dataset.fallbackUsed = '1';
        this.src = fallback;
      }
    });
  });

  if (cursor && !isTouchDevice) {
    document.querySelectorAll('.carousel-3d-item, .carousel-btn, .carousel-dot').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
  }
}

initCarousel3D();

// ===== Zone detail panel =====
const zonePanel = document.getElementById('zone-panel');
const zonePanelVisual = document.getElementById('zone-panel-visual');
const zonePanelBody = document.getElementById('zone-panel-body');
const zonePanelClose = document.getElementById('zone-panel-close');
const zonePanelBackdrop = document.getElementById('zone-panel-backdrop');

function openZonePanelFromArea(area) {
  zonePanelVisual.innerHTML = '';
  if (area.image) {
    const img = document.createElement('img');
    img.src = area.image;
    img.alt = area.name;
    if (area.imageFallback) {
      img.addEventListener('error', function onPanelImgError() {
        if (area.imageFallback && img.src !== area.imageFallback) {
          img.src = area.imageFallback;
        }
      }, { once: true });
    }
    zonePanelVisual.appendChild(img);
  } else {
    const grad = document.createElement('div');
    grad.className = 'detail-gradient';
    grad.style.background = getDepthGradient(area.depth);
    zonePanelVisual.appendChild(grad);
  }

  zonePanelBody.innerHTML = `
    <span class="hud-id">${area.id}</span>
    <span class="zone-floor">${area.floor}</span>
    <h2>${area.name}</h2>
    <p>${area.desc}</p>
    <p>${area.extra || ''}</p>
    <div class="detail-specs">
      ${(area.specs || []).map((s) => `<span>${s}</span>`).join('')}
    </div>
    ${area.tag ? `<span class="zone-tag">${area.tag}</span>` : ''}
    <a href="#visit" class="btn btn-primary zone-panel-cta">このエリアを訪れる</a>
  `;

  zonePanel.classList.add('is-open');
  zonePanel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  zonePanelBody.querySelector('.zone-panel-cta')?.addEventListener('click', closeZonePanel);
}

function openZonePanel(card) {
  openZonePanelFromArea(AREAS[carouselIndex]);
}

function closeZonePanel() {
  zonePanel.classList.remove('is-open');
  zonePanel.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function getDepthGradient(depth) {
  const map = {
    jelly: 'linear-gradient(160deg, #0f0a20, #2a1550, #1a3060)',
    deep: 'linear-gradient(160deg, #050510, #101030, #0a2040)',
    polar: 'linear-gradient(160deg, #0a1520, #1a3050, #4a7090)',
    river: 'linear-gradient(160deg, #0a1a10, #1a4030, #2a6050)',
    kelp: 'linear-gradient(160deg, #0a1a15, #1a4035, #2a6050)',
    tunnel: 'linear-gradient(160deg, #051020, #102040, #1a3060)',
    bio: 'linear-gradient(160deg, #050510, #150525, #0a1530)',
    otter: 'linear-gradient(160deg, #1a1510, #3a3020, #5a5040)',
    touch: 'linear-gradient(160deg, #1a2025, #3a4550, #5a6570)',
    theater: 'linear-gradient(160deg, #050510, #1a1030, #0a1535)',
    cafe: 'linear-gradient(160deg, #0a1520, #1a3040, #2a4560)',
    reef: 'linear-gradient(160deg, #0a2840, #1a5a6a, #2a8a7a)',
    research: 'linear-gradient(160deg, #0a1015, #1a2535, #2a3545)',
  };
  return map[depth] || 'linear-gradient(160deg, #0a1520, #1a3050)';
}

zonePanelClose?.addEventListener('click', closeZonePanel);
zonePanelBackdrop?.addEventListener('click', closeZonePanel);

// ===== Creature images =====
function commonsImageUrl(filename, width = 640) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;
}

/** 生物画像フォルダにある生物のみ（日本語名 → ファイルパス） */
const creatureLocalImages = {
  ジンベエザメ: '生物画像/ジンベエザメ.jpg',
  アカエイ: '生物画像/アカエイ.jpg',
  イソギンチャク: '生物画像/イソギンチャク.jpg',
  シュモクザメ: '生物画像/シュモクザメ.jpg',
  ゼニガタアザラシ: '生物画像/ゼニガタアザラシ.jpg',
  チョウチョウウオ: '生物画像/チョウチョウオ.jpg',
  ホタルイカ: '生物画像/ホタルイカ.webp',
  スカンクシュリンプ: '生物画像/スカンクシュリンプ.jpg',
  ベルーガ: '生物画像/ベルーガ.jpg',
  ヨシキリザメ: '生物画像/ヨシキリザメ.jpg',
};

const creatureImageFiles = {
  'Rhincodon typus': 'Whale_shark_Georgia_aquarium.jpg',
  'Mobula birostris': 'Giant Manta AdF.jpg',
  'Paracanthurus hepatus': 'Blue tang (Paracanthurus hepatus) 02.jpg',
  'Amphiprion ocellaris': 'Amphiprion_ocellaris_(Clown_anemonefish)_by_Nick_Hobgood.jpg',
  'Aurelia aurita': 'Aurelia_aurita_1.jpg',
  'Octopus vulgaris': 'Octopus vulgaris 03.jpg',
  'Phyllopteryx taeniolatus': 'Phyllopteryx_taeniolatus1.jpg',
  'Pygoscelis papua': 'Gentoo penguin juvenile Petermann Island.jpg',
  'Himantura akajei': 'Dasyatis_akajei.jpg',
  'Heteractis magnifica': 'Anemone purple anemonefish.jpg',
  'Chelonia mydas': 'Chelonia mydas is going for the air edit.jpg',
  'Hucho perryi': 'Hucho_perryi.jpg',
  'Thunnus orientalis': 'Thunnus orientalis (Osaka Kaiyukan Aquarium).jpg',
  'Takifugu rubripes': 'Takifugu rubripes AQUAS.jpg',
  'Sphyrna lewini': 'Scalloped Hammerhead Shark Sphyrna lewini 01.jpg',
  'Phoca vitulina': 'Common seal (Phoca vitulina) 2.jpg',
  'Pantodon buchholzi': 'Pantodon_buchholzi.jpg',
  'Tursiops truncatus': 'Tursiops_truncatus_01.jpg',
  'Watasenia scintillans': 'Watasenia_scintillans.jpg',
  'Andrias japonicus': 'Andrias japonicus pair.jpg',
  'Lysmata amboinensis': 'Lysmata_amboinensis.jpg',
  'Delphinapterus leucas': 'Delphinapterus leucas at Vancouver Aquarium.jpg',
  'Carcharhinus dussumieri': 'Carcharhinus dussumieri terengganu.jpg',
  'Plecoglossus altivelis': 'Plecoglossus altivelis Totto.jpg',
};

function initCreatureImages() {
  document.querySelectorAll('.js-creature-card').forEach((card) => {
    const name = card.querySelector('h3')?.textContent.trim();
    const latin = card.querySelector('.creature-latin')?.textContent.trim();
    const img = card.querySelector('.creature-photo img');
    if (!img) return;

    const local = name && creatureLocalImages[name];
    if (local) {
      img.src = local;
      img.alt = name;
      return;
    }

    const file = latin && creatureImageFiles[latin];
    if (!file) return;

    img.src = commonsImageUrl(file);
    img.alt = name || img.alt;
  });
}

initCreatureImages();

// ===== Creature modal =====
const creatureModal = document.getElementById('creature-modal');
const creatureModalPhoto = document.getElementById('creature-modal-photo');
const creatureModalBody = document.getElementById('creature-modal-body');
const creatureModalClose = document.getElementById('creature-modal-close');
const creatureModalBackdrop = document.getElementById('creature-modal-backdrop');

const creatureExtras = {
  ジンベエザメ: '毎日11:00と15:00にフィーディング。最大12mの個体が3頭飼育。',
  オニイトマキエイ: '午前中の光が差し込む時間帯が撮影のベストタイム。',
  ミズクラゲ: '水温18℃管理。ライトショーと同期して発光演出。',
  ジェンツーペンギン: '餌やりショーは10:30 / 13:30 / 16:00。',
  ホタルイカ: '3月〜5月は繁殖期の特別展示を実施。',
};

function openCreatureModal(card) {
  const img = card.querySelector('.creature-photo img');
  const zone = card.querySelector('.creature-zone')?.textContent || '';
  const name = card.querySelector('h3')?.textContent || '';
  const latin = card.querySelector('.creature-latin')?.textContent || '';
  const desc = card.querySelector('.creature-info > p:last-child')?.textContent || '';
  const extra = creatureExtras[name] || '詳細情報はARガイドアプリでも閲覧できます。';

  card.classList.add('is-opening');
  setTimeout(() => card.classList.remove('is-opening'), 400);

  creatureModalPhoto.innerHTML = img ? img.outerHTML : '';
  creatureModalBody.innerHTML = `
    <span class="creature-zone">${zone}</span>
    <h2>${name}</h2>
    <p class="creature-latin">${latin}</p>
    <p>${desc}</p>
    <p>${extra}</p>
  `;

  creatureModal.classList.add('is-open');
  creatureModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCreatureModal() {
  creatureModal.classList.remove('is-open');
  creatureModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.querySelectorAll('.js-creature-card').forEach((card) => {
  const photo = card.querySelector('.creature-photo img');
  if (photo) {
    photo.addEventListener('error', () => {
      photo.alt = '';
      photo.classList.add('is-broken');
      photo.closest('.creature-photo')?.classList.add('has-fallback');
    }, { once: true });
  }

  card.addEventListener('click', () => openCreatureModal(card));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCreatureModal(card);
    }
  });
});

creatureModalClose?.addEventListener('click', closeCreatureModal);
creatureModalBackdrop?.addEventListener('click', closeCreatureModal);

// ===== Escape key =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeZonePanel();
    closeCreatureModal();
  }
});

// ===== Feature expand cards =====
const flipBackTexts = [
  'スマホをかざすだけで、生物名と生態データがAR表示されます。',
  '水温・塩分・pHをリアルタイム表示。研究データを一般公開。',
  '絶滅危惧種の繁殖をガラス越しに。週末はバックヤードツアー開催。',
  '閉館後の限定イベント。プロジェクションマッピングと光る生物の共演。',
];

document.querySelectorAll('.js-flip-card').forEach((card, i) => {
  const front = document.createElement('div');
  front.className = 'feature-front';
  while (card.firstChild) front.appendChild(card.firstChild);
  card.appendChild(front);

  const back = document.createElement('div');
  back.className = 'feature-back';
  back.innerHTML = `<p>${flipBackTexts[i] || ''}</p>`;
  card.appendChild(back);

  card.addEventListener('click', () => {
    const isExpanded = card.classList.toggle('is-expanded');
    document.querySelectorAll('.js-flip-card').forEach((c) => {
      if (c !== card) c.classList.remove('is-expanded');
    });
  });
});

// ===== Header scroll =====
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ===== To Top button =====
const toTopBtn = document.getElementById('to-top');

function updateToTopButton() {
  if (!toTopBtn) return;
  toTopBtn.classList.toggle('is-visible', window.scrollY > 480);
}

window.addEventListener('scroll', updateToTopButton, { passive: true });
updateToTopButton();

// ===== Mobile nav =====
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

function setNavOpen(isOpen) {
  if (!navLinks || !navToggle) return;
  navLinks.classList.toggle('open', isOpen);
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('nav-open', isOpen);
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setNavOpen(!navLinks.classList.contains('open'));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href?.startsWith('#') && href.length > 1) {
        const target = document.getElementById(href.slice(1));
        if (target) {
          e.preventDefault();
          setNavOpen(false);
          closeZonePanel();
          closeCreatureModal();
          window.requestAnimationFrame(() => {
            const header = document.querySelector('.header');
            const offset = (header?.offsetHeight ?? 0) + 8;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          });
          return;
        }
      }
      setNavOpen(false);
      closeZonePanel();
      closeCreatureModal();
    });
  });

  document.addEventListener('click', (e) => {
    if (!navLinks.classList.contains('open')) return;
    if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
      setNavOpen(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setNavOpen(false);
  });
}

// タッチ端末ではカスタムカーソルを無効化
if (isTouchDevice && document.body.classList.contains('has-custom-cursor')) {
  document.body.classList.remove('has-custom-cursor');
}

// ===== Creature filter =====
const filterBtns = document.querySelectorAll('.filter-btn');
const creatureCards = document.querySelectorAll('.creature-card');

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    creatureCards.forEach((card, i) => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('hidden', !show);
      if (show) {
        card.style.animation = `fadeUp 0.5s ${i * 0.03}s both`;
      }
    });
  });
});

// ===== Scroll reveal =====
const revealElements = document.querySelectorAll(
  '.section-header, .about-text, .about-visual, .feature-card, .carousel-3d, .creature-card, .schedule-board, .visit-grid > *, .visitor-rules, .interior-gate-content, .shop-feature, .contact-cta'
);

revealElements.forEach((el) => el.classList.add('reveal'));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
);

revealElements.forEach((el) => observer.observe(el));

// ===== Stat counter =====
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const isDecimal = target % 1 !== 0;
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;
    el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        statsObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('.stat-num').forEach((el) => statsObserver.observe(el));

updateParallax();
