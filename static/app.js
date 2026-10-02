(() => {
  'use strict';

  const config = window.WEDDING_DATA;
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const lazyPlaceholder = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  let lazyImageObserver = null;

  if (!config || !app || !config.site || !config.couple || !config.wedding
      || !config.venue || !config.images || !Array.isArray(config.invitation?.lines)) {
    const message = document.getElementById('loading-message');
    if (message) message.textContent = '청첩장을 불러오지 못했습니다. 예식 안내를 확인하시거나 다시 불러와 주세요.';
    return;
  }

  const analyticsConfig = config.analytics || {};
  const analyticsMeasurementId = String(analyticsConfig.measurement_id || '').trim();
  const analyticsEnabled = analyticsConfig.enabled !== false
    && /^G-[A-Z0-9]+$/i.test(analyticsMeasurementId)
    && analyticsMeasurementId !== 'G-XXXXXXXXXX';

  function setupAnalytics() {
    if (!analyticsEnabled) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', analyticsMeasurementId, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    if (!document.querySelector(`script[data-ga4-id="${analyticsMeasurementId}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsMeasurementId)}`;
      script.dataset.ga4Id = analyticsMeasurementId;
      document.head.appendChild(script);
    }
  }

  function trackEvent(eventName, parameters = {}) {
    if (!analyticsEnabled || typeof window.gtag !== 'function') return;
    try {
      window.gtag('event', eventName, {
        ...parameters,
        transport_type: 'beacon',
      });
    } catch (error) {
      console.warn('방문 통계 이벤트를 기록하지 못했습니다.', error);
    }
  }


  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const safeUrl = (value = '') => {
    const url = String(value).trim();
    return /^(https?:\/\/|tel:)/i.test(url) ? url : '#';
  };

  const safeCssPosition = (value = '50% 50%') => {
    const parts = String(value).trim().split(/\s+/).filter(Boolean);
    const validPart = /^(?:left|center|right|top|bottom|(?:100|\d{1,2})%)$/i;
    return parts.length >= 1 && parts.length <= 2 && parts.every((part) => validPart.test(part))
      ? parts.join(' ')
      : '50% 50%';
  };

  const backgroundStyle = (value = '') => {
    const url = encodeURI(String(value))
      .replaceAll('#', '%23')
      .replaceAll('?', '%3F')
      .replaceAll('"', '%22')
      .replaceAll("'", '%27')
      .replaceAll('(', '%28')
      .replaceAll(')', '%29');
    return `background-image: url(&quot;${url}&quot;);`;
  };

  const sectionTitle = (eyebrow, title) => `
    <div class="section-heading reveal">
      <span class="eyebrow">${escapeHtml(eyebrow)}</span>
      <h2>${escapeHtml(title)}</h2>
    </div>`;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1800);
  }

  async function copyText(text, successMessage, eventName = '', parameters = {}) {
    const value = String(text || '');
    let copied = false;
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch (error) {
      const textarea = document.createElement('textarea');
      const previousFocus = document.activeElement;
      textarea.value = value;
      textarea.readOnly = true;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      try {
        textarea.focus({ preventScroll: true });
        textarea.select();
        textarea.setSelectionRange(0, value.length);
        copied = document.execCommand('copy') === true;
      } catch (fallbackError) {
        copied = false;
      } finally {
        textarea.remove();
        previousFocus?.focus?.({ preventScroll: true });
      }
    }
    showToast(copied ? successMessage : '자동 복사가 되지 않았습니다. 아래 내용을 길게 눌러 복사해 주세요.');
    if (eventName) trackEvent(eventName, { ...parameters, copy_success: copied });
    if (!copied) {
      document.getElementById('manual-copy')?.remove();
      const panel = document.createElement('div');
      panel.id = 'manual-copy';
      panel.className = 'manual-copy';
      const label = document.createElement('p');
      label.textContent = '아래 내용을 길게 눌러 복사해 주세요.';
      const input = document.createElement('textarea');
      input.value = value;
      input.readOnly = true;
      input.setAttribute('aria-label', '직접 복사할 내용');
      const close = document.createElement('button');
      close.type = 'button';
      close.textContent = '닫기';
      close.addEventListener('click', () => panel.remove());
      panel.append(label, input, close);
      document.body.appendChild(panel);
      input.focus({ preventScroll: true });
      input.select();
    }
    return copied;
  }

  function getDateParts(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return { year, month, day };
  }

  function formatDisplayDate(dateString) {
    const { year, month, day } = getDateParts(dateString);
    return `${year}. ${String(month).padStart(2, '0')}. ${String(day).padStart(2, '0')}.`;
  }

  function getDday(dateString) {
    const { year, month, day } = getDateParts(dateString);
    const weddingDay = Date.UTC(year, month - 1, day);
    const koreaNow = new Date(Date.now() + 9 * 3600000);
    const today = Date.UTC(koreaNow.getUTCFullYear(), koreaNow.getUTCMonth(), koreaNow.getUTCDate());
    const diff = Math.round((weddingDay - today) / 86400000);
    if (diff > 0) return `D-${diff}`;
    if (diff === 0) return 'D-DAY';
    return `함께한 지 ${Math.abs(diff)}일`;
  }

  function renderCalendar() {
    const { year, month, day } = getDateParts(config.wedding.date);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const cells = Array(firstDay).fill(null).concat(Array.from({ length: lastDate }, (_, index) => index + 1));

    return `
      <div class="calendar reveal" aria-label="${year}년 ${month}월 달력">
        <div class="calendar-month">${year}. ${String(month).padStart(2, '0')}</div>
        <div class="calendar-grid weekday-grid">
          ${weekdays.map((weekday) => `<span>${weekday}</span>`).join('')}
        </div>
        <div class="calendar-grid day-grid">
          ${cells.map((cell, index) => {
            const classes = [cell === day ? 'wedding-day' : '', index % 7 === 0 ? 'sunday' : ''].filter(Boolean).join(' ');
            return `<span class="${classes}">${cell ?? ''}</span>`;
          }).join('')}
        </div>
      </div>`;
  }

  function renderGallery() {
    const gallery = config.images.gallery || [];
    if (!gallery.length) {
      return `
        <div class="image-placeholder gallery-placeholder reveal">
          <span>Gallery Photos</span>
          <small>photos/gallery 폴더에 사진을 넣고 Python으로 다시 빌드하세요</small>
        </div>`;
    }

    const configuredCount = Number(config.design?.gallery_initial_count ?? 9);
    const initialCount = Number.isFinite(configuredCount) && configuredCount > 0
      ? Math.floor(configuredCount)
      : 9;
    const hasMore = gallery.length > initialCount;

    return `
      <div class="gallery-grid reveal" aria-label="웨딩 사진 갤러리">
        ${gallery.map((image, index) => {
          const immediate = false;
          const isExtra = index >= initialCount;
          const thumbnailSource = image.thumbnail_src || image.src;
          return `
            <button
              type="button"
              class="gallery-item"
              data-gallery-index="${index}"
              aria-label="${escapeHtml(image.alt || `웨딩 사진 ${index + 1}`)} 보기"
              ${isExtra ? 'hidden data-gallery-extra="true"' : ''}
            >
              <img
                class="gallery-photo protected-photo${immediate ? '' : ' lazy-photo'}"
                src="${immediate ? escapeHtml(thumbnailSource) : lazyPlaceholder}"
                ${immediate ? '' : `data-src="${escapeHtml(thumbnailSource)}"`}
                alt="${escapeHtml(image.alt || `웨딩 사진 ${index + 1}`)}"
                loading="${immediate ? 'eager' : 'lazy'}"
                decoding="async"
                draggable="false"
              />
            </button>`;
        }).join('')}
      </div>
      ${hasMore ? `
        <div class="gallery-actions reveal">
          <button type="button" id="gallery-toggle" class="gallery-toggle" aria-expanded="false">
            <span class="gallery-toggle-label">사진 더보기</span>
            <span class="gallery-toggle-icon" aria-hidden="true">⌄</span>
          </button>
        </div>` : ''}`;
  }

  function transportIcon(title = '') {
    if (title.includes('버스')) {
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="3.5" width="14" height="15" rx="3"></rect>
        <path d="M7.5 7.5h9M8 13h.01M16 13h.01M8 18.5v2M16 18.5v2"></path>
      </svg>`;
    }
    if (title.includes('지하철')) {
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="6" y="2.8" width="12" height="16.2" rx="3"></rect>
        <path d="M8.5 7.2h7M9 14h.01M15 14h.01M8 19l-2 2M16 19l2 2"></path>
      </svg>`;
    }
    if (title.includes('자가용')) {
      return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 11.5 7 6.8A2 2 0 0 1 8.8 5.5h6.4A2 2 0 0 1 17 6.8l2 4.7"></path>
        <rect x="3.8" y="10.5" width="16.4" height="7.5" rx="2.2"></rect>
        <path d="M7 14h.01M17 14h.01M6.5 18v2M17.5 18v2"></path>
      </svg>`;
    }
    return '•';
  }

  function renderTransport() {
    const transport = config.transport;
    const items = transport.items || [];
    if (!items.length) return '';
    return `
      <div class="guide-label reveal">${escapeHtml(transport.draft_label || '')}</div>
      <div class="transport-list reveal">
        ${items.map((item) => `
          <article class="transport-item">
            <div class="transport-heading">
              <span class="transport-icon" aria-hidden="true">${transportIcon(item.title)}</span>
              <strong>${escapeHtml(item.title)}</strong>
            </div>
            <div class="transport-copy">${(item.lines || []).map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div>
          </article>`).join('')}
      </div>`;
  }

  function renderParking() {
    const parking = config.parking;
    return `
      <article class="parking-card reveal">
        <div class="parking-icon" aria-hidden="true">P</div>
        <div>
          <h3>${escapeHtml(parking.title)}</h3>
          ${(parking.lines || []).map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
        </div>
      </article>`;
  }


  function renderAccountRows(list) {
    if (!list.length) return '<p class="empty-account">계좌정보를 입력해 주세요.</p>';
    return list.map((account) => {
      const copyValue = `${account.bank} ${account.number}`;
      return `
        <div class="account-row">
          <div>
            <span>${escapeHtml(account.relation)}</span>
            <strong>${escapeHtml(account.bank)} ${escapeHtml(account.number)}</strong>
            <small>예금주 ${escapeHtml(account.holder)}</small>
          </div>
          <button type="button" class="copy-account" data-account="${escapeHtml(copyValue)}" aria-label="${escapeHtml(account.relation)} 계좌 복사">복사</button>
        </div>`;
    }).join('');
  }

  function renderAccounts() {
    if (!config.accounts?.show) return '';
    const sides = [
      { key: 'groom', label: '신랑 측', list: config.accounts.groom_side || [] },
      { key: 'bride', label: '신부 측', list: config.accounts.bride_side || [] },
    ].map((side) => ({ ...side, list: side.list.filter((account) => account.show !== false) }))
      .filter((side) => side.list.length);
    if (!sides.length) return '';
    return `
      <section class="section account-section">
        ${sectionTitle('ACCOUNT', '마음 전하실 곳')}
        <p class="section-description reveal">${escapeHtml(config.accounts.message)}</p>
        ${sides.map((side) => `
          <div class="account-group reveal">
            <button type="button" class="account-toggle" data-target="${side.key}-accounts" aria-controls="${side.key}-accounts" aria-expanded="false">
              <span>${side.label}</span><span class="toggle-symbol" aria-hidden="true">+</span>
            </button>
            <div id="${side.key}-accounts" class="account-list" hidden>${renderAccountRows(side.list)}</div>
          </div>`).join('')}
      </section>`;
  }

  function renderMap() {
    const { images, venue } = config;
    if (!images.map_image) return '';
    return `
      <figure class="map-card reveal">
        <img src="${escapeHtml(images.map_image)}" ${images.map_width && images.map_height ? `width="${images.map_width}" height="${images.map_height}"` : ''} alt="${escapeHtml(venue.name)} 약도" loading="lazy" decoding="async" draggable="false" />
      </figure>`;
  }

  function renderFooter() {
    const configuredLines = Array.isArray(config.footer?.lines) ? config.footer.lines : [];
    const lines = configuredLines.length
      ? configuredLines
      : [config.footer?.message || ''];
    return `
      <footer>
        <span>THANK YOU</span>
        <div class="footer-lines">
          ${lines.filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
        </div>
        <small>WEDDING INVITATION</small>
        ${analyticsEnabled && analyticsConfig.notice
          ? `<p class="analytics-notice">${escapeHtml(analyticsConfig.notice)}</p>`
          : ''}
      </footer>`;
  }

  function render() {
    const { couple, wedding, invitation, venue, images, site } = config;
    const hasFamily = couple.groom_family || couple.bride_family;
    const coverPosition = safeCssPosition(config.design?.cover_position || '50% 50%');
    const coverMarkup = images.cover
      ? `<div class="hero-photo protected-photo" role="img" aria-label="${escapeHtml(images.cover_alt)}" draggable="false" style="${backgroundStyle(images.cover)} background-position: ${coverPosition};"></div>`
      : `<div class="image-placeholder cover-placeholder"><span>Cover Photo</span><small>photos/cover 폴더에 대표사진 1장을 넣어주세요</small></div>`;

    app.innerHTML = `
      <header class="hero">
        <div class="hero-media ${images.cover ? 'has-image' : ''}">
          ${coverMarkup}
          <div class="hero-overlay"></div>
        </div>
        <div class="hero-copy">
          <p class="hero-kicker">WEDDING INVITATION</p>
          <h1>${escapeHtml(couple.groom)}<span class="ampersand">&amp;</span>${escapeHtml(couple.bride)}</h1>
          <div class="hero-rule"></div>
          <p>${escapeHtml(wedding.display_date)}</p>
          <p>${escapeHtml(wedding.display_time)}</p>
          ${wedding.display_fr ? `<p class="hero-date-fr">${escapeHtml(wedding.display_fr)}</p>` : ''}
          <a class="venue-link" href="${safeUrl(venue.naver_place_url)}" target="_blank" rel="noopener">
            <span class="venue-link-main">${escapeHtml(venue.name)}${venue.hall ? ` · ${escapeHtml(venue.hall)}` : ''}</span>
            ${venue.name_fr ? `<small>${escapeHtml(venue.name_fr)}${venue.hall_fr ? ` · ${escapeHtml(venue.hall_fr)}` : ''}</small>` : ''}
          </a>
        </div>
      </header>

      ${site.draft_notice ? `<div class="draft-notice">${escapeHtml(site.draft_notice)}</div>` : ''}

      <section class="section invitation-section">
        ${sectionTitle('INVITATION', invitation.title)}
        <div class="invitation-copy reveal">${invitation.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div>
        ${hasFamily ? `
          <div class="family-lines reveal">
            ${couple.groom_family ? `<p>${escapeHtml(couple.groom_family)} <strong>${escapeHtml(couple.groom)}</strong></p>` : ''}
            ${couple.bride_family ? `<p>${escapeHtml(couple.bride_family)} <strong>${escapeHtml(couple.bride)}</strong></p>` : ''}
          </div>` : ''}
      </section>

      <section class="section calendar-section">
        ${sectionTitle('DATE', wedding.section_title || '예식 안내')}
        <div class="date-summary reveal">
          <p class="date-large">${formatDisplayDate(config.wedding.date)}</p>
          <p>${escapeHtml(wedding.display_date)} ${escapeHtml(wedding.display_time)}</p>
          ${wedding.display_fr ? `<p class="date-fr">${escapeHtml(wedding.display_fr)}</p>` : ''}
        </div>
        ${renderCalendar()}
        <p class="dday reveal">${escapeHtml(couple.groom)} · ${escapeHtml(couple.bride)}${getDday(wedding.date).startsWith('함께한') ? ' · ' : '의 결혼식까지 '}<strong>${getDday(wedding.date)}</strong></p>
      </section>

      <section class="section gallery-section">
        <div class="gallery-label reveal">GALLERY</div>
        ${renderGallery()}
      </section>

      <section class="section location-section">
        ${sectionTitle('LOCATION', '오시는 길')}
        <div class="venue-summary reveal">
          <h3>${escapeHtml(venue.name)}</h3>
          ${venue.name_fr ? `<p class="venue-fr">${escapeHtml(venue.name_fr)}</p>` : ''}
          ${venue.hall ? `<p class="hall-name">${escapeHtml(venue.hall)}</p>` : ''}
          ${venue.hall_fr ? `<p class="hall-fr">${escapeHtml(venue.hall_fr)}</p>` : ''}
          <p class="venue-address">${escapeHtml(venue.address)}</p>
          ${venue.phone ? `<a href="tel:${escapeHtml(venue.phone.replaceAll('-', ''))}">${escapeHtml(venue.phone)}</a>` : ''}
        </div>

        ${renderMap()}

        <div class="map-buttons reveal">
          <a class="map-button naver" href="${safeUrl(venue.naver_directions_url)}" target="_blank" rel="noopener">네이버 길찾기</a>
          <a class="map-button kakao" href="${safeUrl(venue.kakao_directions_url)}" target="_blank" rel="noopener">카카오 길찾기</a>
        </div>

        <button type="button" class="address-copy reveal" data-address="${escapeHtml(venue.address)}">주소 복사</button>
        ${renderTransport()}
        ${renderParking()}
      </section>

      ${renderAccounts()}

      <section class="section share-section">
        ${sectionTitle('SHARE', '청첩장 공유')}
        <p class="section-description reveal">아래 버튼을 눌러 현재 청첩장 주소를 복사할 수 있습니다.</p>
        <button type="button" id="copy-url" class="outline-button reveal">청첩장 URL 복사</button>
      </section>

      ${renderFooter()}`;

    document.getElementById('gallery-modal')?.remove();
    if ((images.gallery || []).length) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="gallery-modal" class="modal" hidden role="dialog" aria-modal="true" aria-label="웨딩 사진 보기">
          <button type="button" class="modal-close" aria-label="사진 닫기">×</button>
          <button type="button" class="modal-nav modal-prev" aria-label="이전 사진">‹</button>
          <div class="modal-stage">
            <div class="modal-viewport">
              <div class="modal-photo protected-photo" role="img" draggable="false"></div>
            </div>
            <div class="modal-counter" aria-live="polite"></div>
            <div class="modal-status" hidden role="status"><span></span><button type="button" class="modal-retry" hidden>다시 시도</button></div>
            <div class="modal-dots" aria-label="사진 위치"></div>
          </div>
          <button type="button" class="modal-nav modal-next" aria-label="다음 사진">›</button>
        </div>`);
    }
  }

  function loadLazyImage(image) {
    const source = image.dataset.src;
    if (!source) return;
    const finish = () => {
      image.removeEventListener('error', failed);
      image.classList.add('is-loaded');
      image.closest('.gallery-item')?.classList.remove('image-failed');
      image.removeAttribute('data-src');
    };
    const failed = () => {
      image.removeEventListener('load', finish);
      image.closest('.gallery-item')?.classList.add('image-failed');
      image.dataset.src = source;
      image.dataset.lazyObserved = 'false';
    };
    image.addEventListener('load', finish, { once: true });
    image.addEventListener('error', failed, { once: true });
    image.loading = 'eager';
    image.src = source;
    image.removeAttribute('data-src');
    lazyImageObserver?.unobserve(image);
  }

  function observeLazyImages(root = document) {
    const images = root.querySelectorAll('img[data-src]');
    if (!images.length) return;

    if (!('IntersectionObserver' in window)) {
      images.forEach(loadLazyImage);
      return;
    }

    if (!lazyImageObserver) {
      lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) loadLazyImage(entry.target);
        });
      }, { rootMargin: '240px 0px', threshold: 0.01 });
    }

    images.forEach((image) => {
      if (image.dataset.lazyObserved === 'true') return;
      image.dataset.lazyObserved = 'true';
      lazyImageObserver.observe(image);
    });
  }

  function setupInteractions() {

    document.querySelectorAll('.map-button').forEach((link) => {
      link.addEventListener('click', () => {
        trackEvent('map_click', {
          map_provider: link.classList.contains('naver') ? 'naver' : 'kakao',
        });
      });
    });

    document.querySelector('.address-copy')?.addEventListener('click', (event) => {
      copyText(event.currentTarget.dataset.address, '주소를 복사했습니다.', 'address_copy');
    });

    document.getElementById('copy-url')?.addEventListener('click', () => {
      const shareUrl = config.site.share_url || config.site.url || window.location.href.split('#')[0];
      copyText(shareUrl, '청첩장 주소를 복사했습니다.', 'url_copy');
    });

    const galleryToggle = document.getElementById('gallery-toggle');
    galleryToggle?.addEventListener('click', () => {
      const extras = document.querySelectorAll('[data-gallery-extra="true"]');
      const expanded = galleryToggle.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !expanded;
      extras.forEach((item) => {
        item.hidden = !nextExpanded;
      });
      galleryToggle.setAttribute('aria-expanded', String(nextExpanded));
      trackEvent('gallery_more', { expanded: nextExpanded });
      galleryToggle.querySelector('.gallery-toggle-label').textContent = nextExpanded ? '사진 접기' : '사진 더보기';
      galleryToggle.querySelector('.gallery-toggle-icon').textContent = nextExpanded ? '⌃' : '⌄';
      if (nextExpanded) {
        observeLazyImages(document);
      } else {
        document.querySelector('.gallery-section')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      }
    });

    const gallery = config.images.gallery || [];
    const modal = document.getElementById('gallery-modal');
    const modalPhoto = modal?.querySelector('.modal-photo');
    const modalCounter = modal?.querySelector('.modal-counter');
    const modalDots = modal?.querySelector('.modal-dots');
    const modalStatus = modal?.querySelector('.modal-status');
    let currentGalleryIndex = 0;
    let swipeStartX = null;
    let swipeCurrentX = null;
    let swipePointerId = null;
    let swipeCaptureTarget = null;
    let dotScrubPointerId = null;
    let suppressNextDotClick = false;
    let modalImageRequestId = 0;
    let swipeTimer = null;
    let settleTimer = null;
    let adjacentTimer = null;
    let adjacentIdle = false;
    let loadingTimer = null;
    let lastGalleryTrigger = null;
    const galleryImageCache = new Map();
    const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cancelAdjacent = () => {
      if (adjacentTimer !== null) {
        if (adjacentIdle && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(adjacentTimer);
        else window.clearTimeout(adjacentTimer);
      }
      adjacentTimer = null;
    };

    const clearModalWork = () => {
      window.clearTimeout(swipeTimer);
      window.clearTimeout(settleTimer);
      window.clearTimeout(loadingTimer);
      swipeTimer = settleTimer = loadingTimer = null;
      cancelAdjacent();
      if (modalStatus) modalStatus.hidden = true;
    };

    const releaseCapture = (element, pointerId) => {
      if (pointerId !== null && element?.hasPointerCapture?.(pointerId)) {
        element.releasePointerCapture(pointerId);
      }
    };

    if (modalDots && gallery.length) {
      modalDots.innerHTML = gallery.map((_, index) => `
        <button type="button" class="modal-dot" data-dot-index="${index}" aria-label="${index + 1}번째 사진"></button>`).join('');
    }

    const preloadGalleryImage = (index) => {
      if (!gallery.length) return Promise.resolve(false);
      const normalized = ((index % gallery.length) + gallery.length) % gallery.length;
      const source = gallery[normalized].src;
      if (galleryImageCache.has(source)) return galleryImageCache.get(source);

      const image = new Image();
      image.decoding = 'async';
      const ready = new Promise((resolve) => {
        let finished = false;
        let timeout;
        const finish = (success) => {
          if (finished) return;
          finished = true;
          window.clearTimeout(timeout);
          image.onload = image.onerror = null;
          if (!success) {
            galleryImageCache.delete(source);
            image.removeAttribute('src');
          }
          resolve(success);
        };
        image.onload = async () => {
          try {
            if (typeof image.decode === 'function') await image.decode();
            finish(image.naturalWidth > 0);
          } catch (error) {
            finish(false);
          }
        };
        image.onerror = () => finish(false);
        timeout = window.setTimeout(() => finish(false), 15000);
      });
      galleryImageCache.set(source, ready);
      image.src = source;
      return ready;
    };

    const preloadAdjacent = (centerIndex, requestId) => {
      if (gallery.length < 2) return;
      cancelAdjacent();
      const prepare = () => {
        adjacentTimer = null;
        if (!modal || modal.hidden || requestId !== modalImageRequestId || dotScrubPointerId !== null) return;
        [1, -1].forEach((offset) => {
          preloadGalleryImage(centerIndex + offset);
        });
      };
      if ('requestIdleCallback' in window) {
        adjacentIdle = true;
        adjacentTimer = window.requestIdleCallback(prepare, { timeout: 900 });
      } else {
        adjacentIdle = false;
        adjacentTimer = window.setTimeout(prepare, 180);
      }
    };

    const updateDots = () => {
      if (!modalDots) return;
      modalDots.querySelectorAll('.modal-dot').forEach((dot, index) => {
        const active = index === currentGalleryIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
    };

    const prepareCurrentImage = (requestId = modalImageRequestId) => {
      if (!modal || modal.hidden || !gallery.length || !modalPhoto) return;
      const image = gallery[currentGalleryIndex];
      const index = currentGalleryIndex;
      window.clearTimeout(loadingTimer);
      if (modalStatus) {
        modalStatus.hidden = true;
        modalStatus.querySelector('button').hidden = true;
      }
      loadingTimer = window.setTimeout(() => {
        if (requestId !== modalImageRequestId || modal.hidden || !modalStatus) return;
        modalStatus.querySelector('span').textContent = '선명한 사진을 불러오고 있습니다.';
        modalStatus.hidden = false;
      }, 700);
      preloadGalleryImage(index).then((success) => {
        if (requestId !== modalImageRequestId || modal.hidden) return;
        window.clearTimeout(loadingTimer);
        if (success) {
          modalPhoto.style.backgroundImage = `url("${encodeURI(image.src).replaceAll('"', '%22')}")`;
          if (modalStatus) modalStatus.hidden = true;
        } else if (modalStatus) {
          modalStatus.querySelector('span').textContent = '작은 사진으로 표시 중입니다.';
          modalStatus.querySelector('button').hidden = false;
          modalStatus.hidden = false;
        }
        preloadAdjacent(index, requestId);
      });
    };

    const updateGalleryModal = (index, direction = 0, mode = 'normal') => {
      if (!modal || !modalPhoto || !gallery.length) return;
      clearModalWork();
      currentGalleryIndex = ((index % gallery.length) + gallery.length) % gallery.length;
      const image = gallery[currentGalleryIndex];
      const previewSource = image.thumbnail_src || image.src;
      const requestId = ++modalImageRequestId;

      modalPhoto.classList.remove('slide-next', 'slide-prev', 'scrub-change', 'is-dragging', 'is-settling');
      modalPhoto.style.removeProperty('transform');
      modalPhoto.style.removeProperty('opacity');
      if (mode !== 'scrub' && direction !== 0 && !reducedMotion()) void modalPhoto.offsetWidth;
      modalPhoto.style.backgroundImage = `url("${encodeURI(previewSource).replaceAll('"', '%22')}")`;
      modalPhoto.setAttribute('aria-label', image.alt || `웨딩 사진 ${currentGalleryIndex + 1}`);
      if (mode === 'scrub' && !reducedMotion()) {
        modalPhoto.classList.add('scrub-change');
      } else if (direction !== 0 && !reducedMotion()) {
        modalPhoto.classList.add(direction > 0 ? 'slide-next' : 'slide-prev');
      }
      if (modalCounter) modalCounter.textContent = `${currentGalleryIndex + 1} / ${gallery.length}`;
      updateDots();

      // 드래그 중에는 번호와 썸네일을 즉시 갱신하고, 놓은 사진의 full을 준비합니다.
      if (dotScrubPointerId === null) prepareCurrentImage(requestId);
    };

    const openGalleryModal = (index) => {
      if (!modal || !gallery.length) return;
      trackEvent('gallery_open', {
        image_index: Number(index) + 1,
        image_count: gallery.length,
      });
      lastGalleryTrigger = document.querySelector(`[data-gallery-index="${Number(index)}"]`);
      modal.hidden = false;
      updateGalleryModal(index, 0);
      document.body.classList.add('modal-open');
      app.inert = true;
      app.setAttribute('aria-hidden', 'true');
      modal.querySelector('.modal-close')?.focus({ preventScroll: true });
    };

    const closeGalleryModal = () => {
      if (!modal) return;
      const dotPointer = dotScrubPointerId;
      const photoPointer = swipePointerId;
      const photoCapture = swipeCaptureTarget;
      swipeStartX = swipeCurrentX = swipePointerId = dotScrubPointerId = null;
      swipeCaptureTarget = null;
      suppressNextDotClick = false;
      modalDots?.classList.remove('is-scrubbing');
      modalCounter?.setAttribute('aria-live', 'polite');
      modalImageRequestId += 1;
      modal.hidden = true;
      clearModalWork();
      releaseCapture(modalDots, dotPointer);
      releaseCapture(photoCapture, photoPointer);
      document.body.classList.remove('modal-open');
      app.inert = false;
      app.removeAttribute('aria-hidden');
      lastGalleryTrigger?.focus({ preventScroll: true });
    };

    document.querySelectorAll('.gallery-item').forEach((button) => {
      button.addEventListener('pointerdown', () => {
        preloadGalleryImage(Number(button.dataset.galleryIndex || 0));
      }, { passive: true });
      button.addEventListener('click', () => {
        const photo = button.querySelector('img[data-src]');
        if (photo && button.classList.contains('image-failed')) loadLazyImage(photo);
        openGalleryModal(Number(button.dataset.galleryIndex || 0));
      });
    });

    modal?.querySelector('.modal-close')?.addEventListener('click', closeGalleryModal);
    modal?.querySelector('.modal-prev')?.addEventListener('click', () => updateGalleryModal(currentGalleryIndex - 1, -1));
    modal?.querySelector('.modal-next')?.addEventListener('click', () => updateGalleryModal(currentGalleryIndex + 1, 1));
    modal?.querySelector('.modal-retry')?.addEventListener('click', () => prepareCurrentImage());

    const dotIndexAtPosition = (clientX) => {
      if (!modalDots || !gallery.length) return 0;
      const rect = modalDots.getBoundingClientRect();
      if (rect.width <= 0) return currentGalleryIndex;
      const position = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      return Math.min(gallery.length - 1, Math.floor((position / rect.width) * gallery.length));
    };

    const scrubToPosition = (clientX) => {
      const nextIndex = dotIndexAtPosition(clientX);
      if (nextIndex === currentGalleryIndex) return;
      updateGalleryModal(nextIndex, 0, 'scrub');
    };

    modalDots?.addEventListener('pointerdown', (event) => {
      if (event.isPrimary === false || dotScrubPointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      clearModalWork();
      event.stopPropagation();
      dotScrubPointerId = event.pointerId;
      suppressNextDotClick = true;
      modalDots.setPointerCapture?.(event.pointerId);
      modalDots.classList.add('is-scrubbing');
      modalCounter?.setAttribute('aria-live', 'off');
      scrubToPosition(event.clientX);
    });

    modalDots?.addEventListener('pointermove', (event) => {
      if (event.pointerId !== dotScrubPointerId) return;
      event.stopPropagation();
      scrubToPosition(event.clientX);
    });

    const finishDotScrub = (event) => {
      if (!modalDots || event.pointerId !== dotScrubPointerId) return;
      event.stopPropagation();
      scrubToPosition(event.clientX);
      releaseCapture(modalDots, event.pointerId);
      modalDots.classList.remove('is-scrubbing');
      dotScrubPointerId = null;
      modalCounter?.setAttribute('aria-live', 'polite');
      prepareCurrentImage();
      window.setTimeout(() => { suppressNextDotClick = false; }, 0);
    };

    modalDots?.addEventListener('pointerup', finishDotScrub);
    modalDots?.addEventListener('pointercancel', (event) => {
      if (event.pointerId !== dotScrubPointerId) return;
      event.stopPropagation();
      modalDots.classList.remove('is-scrubbing');
      dotScrubPointerId = null;
      suppressNextDotClick = false;
      modalCounter?.setAttribute('aria-live', 'polite');
      prepareCurrentImage();
    });
    modalDots?.addEventListener('lostpointercapture', () => {
      if (dotScrubPointerId === null) return;
      dotScrubPointerId = null;
      suppressNextDotClick = false;
      modalDots.classList.remove('is-scrubbing');
      modalCounter?.setAttribute('aria-live', 'polite');
      prepareCurrentImage();
    });

    modalDots?.addEventListener('click', (event) => {
      event.stopPropagation();
      if (suppressNextDotClick) {
        suppressNextDotClick = false;
        event.preventDefault();
        return;
      }
      const dot = event.target.closest('.modal-dot');
      if (!dot) return;
      const nextIndex = Number(dot.dataset.dotIndex || 0);
      if (nextIndex === currentGalleryIndex) return;
      const direction = nextIndex > currentGalleryIndex ? 1 : -1;
      updateGalleryModal(nextIndex, direction);
    });

    modal?.addEventListener('click', (event) => {
      if (event.target === modal) closeGalleryModal();
    });
    modal?.addEventListener('pointerdown', (event) => {
      if (event.isPrimary === false || swipePointerId !== null || dotScrubPointerId !== null
          || (event.pointerType === 'mouse' && event.button !== 0)) return;
      if (event.target.closest('.modal-dots')) return;
      if (!event.target.closest('.modal-viewport')) return;
      clearModalWork();
      swipePointerId = event.pointerId;
      swipeCaptureTarget = event.target.closest('.modal-viewport');
      swipeCaptureTarget.setPointerCapture?.(event.pointerId);
      swipeStartX = event.clientX;
      swipeCurrentX = event.clientX;
      modalPhoto?.classList.remove('slide-next', 'slide-prev', 'scrub-change', 'is-settling');
      modalPhoto?.classList.add('is-dragging');
    });
    modal?.addEventListener('pointermove', (event) => {
      if (event.pointerId !== swipePointerId || swipeStartX === null || !modalPhoto) return;
      swipeCurrentX = event.clientX;
      const distance = (swipeCurrentX - swipeStartX) * .58;
      const fade = 1 - Math.min(Math.abs(distance) / 420, .22);
      modalPhoto.style.transform = `translate3d(${distance}px, 0, 0)`;
      modalPhoto.style.opacity = String(fade);
    });
    modal?.addEventListener('pointerup', (event) => {
      if (event.pointerId !== swipePointerId || swipeStartX === null) return;
      const distance = event.clientX - swipeStartX;
      const captureTarget = swipeCaptureTarget;
      swipePointerId = null;
      swipeCaptureTarget = null;
      releaseCapture(captureTarget, event.pointerId);
      swipeStartX = null;
      swipeCurrentX = null;
      if (!modalPhoto) return;

      modalPhoto.classList.remove('is-dragging');
      modalPhoto.classList.add('is-settling');

      if (Math.abs(distance) < 45) {
        modalPhoto.style.transform = 'translate3d(0, 0, 0)';
        modalPhoto.style.opacity = '1';
        settleTimer = window.setTimeout(() => {
          modalPhoto.classList.remove('is-settling');
          modalPhoto.style.removeProperty('transform');
          modalPhoto.style.removeProperty('opacity');
          prepareCurrentImage();
        }, reducedMotion() ? 0 : 180);
        return;
      }

      const direction = distance < 0 ? 1 : -1;
      preloadGalleryImage(currentGalleryIndex + direction);
      modalPhoto.style.transform = `translate3d(${-direction * 70}px, 0, 0)`;
      modalPhoto.style.opacity = '.42';
      const nextIndex = currentGalleryIndex + direction;
      const requestId = modalImageRequestId;
      swipeTimer = window.setTimeout(() => {
        if (modal.hidden || requestId !== modalImageRequestId) return;
        updateGalleryModal(nextIndex, direction);
      }, reducedMotion() ? 0 : 120);
    });
    const cancelSwipe = (event) => {
      if (swipePointerId === null || event.pointerId !== swipePointerId) return;
      const captureTarget = swipeCaptureTarget;
      swipePointerId = null;
      swipeCaptureTarget = null;
      releaseCapture(captureTarget, event.pointerId);
      swipeStartX = null;
      swipeCurrentX = null;
      if (!modalPhoto) return;
      modalPhoto.classList.remove('is-dragging');
      modalPhoto.classList.add('is-settling');
      modalPhoto.style.transform = 'translate3d(0, 0, 0)';
      modalPhoto.style.opacity = '1';
      settleTimer = window.setTimeout(() => {
        modalPhoto.classList.remove('is-settling');
        modalPhoto.style.removeProperty('transform');
        modalPhoto.style.removeProperty('opacity');
        prepareCurrentImage();
      }, reducedMotion() ? 0 : 180);
    };
    modal?.addEventListener('pointercancel', cancelSwipe);
    modal?.addEventListener('lostpointercapture', cancelSwipe);
    modal?.addEventListener('dblclick', (event) => event.preventDefault());
    modal?.addEventListener('wheel', (event) => {
      if (event.ctrlKey) event.preventDefault();
    }, { passive: false });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => {
      modal?.addEventListener(eventName, (event) => event.preventDefault(), { passive: false });
    });

    document.addEventListener('keydown', (event) => {
      if (!modal || modal.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); closeGalleryModal(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); updateGalleryModal(currentGalleryIndex - 1, -1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); updateGalleryModal(currentGalleryIndex + 1, 1); }
      if (event.key === 'Tab') {
        const buttons = Array.from(modal.querySelectorAll('button:not([disabled])'))
          .filter((button) => button.getClientRects().length);
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
          event.preventDefault(); first?.focus();
        }
      }
    });

    document.querySelectorAll('.account-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const target = document.getElementById(button.dataset.target);
        const symbol = button.querySelector('.toggle-symbol');
        if (!target) return;
        const willOpen = target.hidden;
        target.hidden = !target.hidden;
        symbol.textContent = target.hidden ? '+' : '−';
        button.setAttribute('aria-expanded', String(willOpen));

        if (willOpen) {
          trackEvent('account_open', {
            account_side: button.dataset.target === 'groom-accounts' ? 'groom' : 'bride',
          });
        }
      });
    });

    document.querySelectorAll('.copy-account').forEach((button) => {
      button.addEventListener('click', () => copyText(button.dataset.account, '은행명과 계좌번호를 복사했습니다.', 'account_copy', {
        account_side: button.closest('.account-list')?.id === 'groom-accounts' ? 'groom' : 'bride',
      }));
    });

    document.querySelector('.venue-summary a[href^="tel:"]')?.addEventListener('click', () => trackEvent('venue_call'));

    document.querySelectorAll('.protected-photo').forEach((photo) => {
      photo.addEventListener('contextmenu', (event) => event.preventDefault());
      photo.addEventListener('dragstart', (event) => event.preventDefault());
      photo.addEventListener('selectstart', (event) => event.preventDefault());
    });

    observeLazyImages(document);
  }

  function setupReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.body.classList.add('reveal-pending');
    elements.forEach((element) => observer.observe(element));
  }

  const fallbackMarkup = app.innerHTML;
  try {
    render();
  } catch (error) {
    app.innerHTML = fallbackMarkup;
    console.error('화면을 준비하지 못했습니다.', error);
    return;
  }
  try { setupAnalytics(); } catch (error) { console.warn('방문 통계를 준비하지 못했습니다.', error); }
  try { setupInteractions(); } catch (error) { console.error('일부 버튼을 준비하지 못했습니다.', error); }
  try { setupReveal(); } catch (error) { document.body.classList.remove('reveal-pending'); }
})();
