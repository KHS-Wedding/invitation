(() => {
  'use strict';

  const config = window.WEDDING_DATA;
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const lazyPlaceholder = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  let lazyImageObserver = null;

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
    window.gtag('event', eventName, {
      ...parameters,
      transport_type: 'beacon',
    });
  }


  if (!config || !app) {
    throw new Error('site-data.js 또는 화면 요소를 불러오지 못했습니다.');
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
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1800);
  }

  async function copyText(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      showToast(successMessage);
    }
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
    const weddingDate = new Date(`${dateString}T00:00:00+09:00`);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.ceil((weddingDate.getTime() - today.getTime()) / 86400000);
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
          const immediate = index < 3;
          const isExtra = index >= initialCount;
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
                src="${immediate ? escapeHtml(image.src) : lazyPlaceholder}"
                ${immediate ? '' : `data-src="${escapeHtml(image.src)}"`}
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
          <button type="button" class="copy-account" data-account="${escapeHtml(copyValue)}">복사</button>
        </div>`;
    }).join('');
  }

  function renderAccounts() {
    if (!config.accounts.show) return '';
    return `
      <section class="section account-section">
        ${sectionTitle('ACCOUNT', '마음 전하실 곳')}
        <p class="section-description reveal">${escapeHtml(config.accounts.message)}</p>
        <div class="account-group reveal">
          <button type="button" class="account-toggle" data-target="groom-accounts">
            <span>신랑 측</span><span class="toggle-symbol">+</span>
          </button>
          <div id="groom-accounts" class="account-list" hidden>${renderAccountRows(config.accounts.groom_side || [])}</div>
        </div>
        <div class="account-group reveal">
          <button type="button" class="account-toggle" data-target="bride-accounts">
            <span>신부 측</span><span class="toggle-symbol">+</span>
          </button>
          <div id="bride-accounts" class="account-list" hidden>${renderAccountRows(config.accounts.bride_side || [])}</div>
        </div>
      </section>`;
  }

  function renderMap() {
    const { images, venue } = config;
    if (!images.map_image) return '';
    return `
      <figure class="map-card reveal">
        <img src="${escapeHtml(images.map_image)}" alt="${escapeHtml(venue.name)} 약도" loading="lazy" decoding="async" draggable="false" />
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
        <p class="dday reveal">${escapeHtml(couple.groom)} · ${escapeHtml(couple.bride)}의 결혼식까지 <strong>${getDday(wedding.date)}</strong></p>
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
            <div class="modal-dots" aria-label="사진 위치"></div>
          </div>
          <button type="button" class="modal-nav modal-next" aria-label="다음 사진">›</button>
        </div>`);
    }
  }

  function loadLazyImage(image) {
    const source = image.dataset.src;
    if (!source) return;
    image.addEventListener('load', () => image.classList.add('is-loaded'), { once: true });
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
      copyText(event.currentTarget.dataset.address, '주소를 복사했습니다.');
    });

    document.getElementById('copy-url')?.addEventListener('click', () => {
      const shareUrl = config.site.share_url || config.site.url || window.location.href.split('#')[0];
      trackEvent('url_copy');
      copyText(shareUrl, '청첩장 주소를 복사했습니다.');
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
      galleryToggle.querySelector('.gallery-toggle-label').textContent = nextExpanded ? '사진 접기' : '사진 더보기';
      galleryToggle.querySelector('.gallery-toggle-icon').textContent = nextExpanded ? '⌃' : '⌄';
      if (nextExpanded) {
        observeLazyImages(document);
      } else {
        document.querySelector('.gallery-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    const gallery = config.images.gallery || [];
    const modal = document.getElementById('gallery-modal');
    const modalPhoto = modal?.querySelector('.modal-photo');
    const modalCounter = modal?.querySelector('.modal-counter');
    const modalDots = modal?.querySelector('.modal-dots');
    const modalDotIndicator = modalDots?.querySelector('.modal-dot-indicator');
    let currentGalleryIndex = 0;
    let swipeStartX = null;
    let dotIndicatorReady = false;

    if (modalDots && gallery.length) {
      modalDots.innerHTML = `
        <span class="modal-dot-indicator" aria-hidden="true"></span>
        ${gallery.map((_, index) => `
          <button type="button" class="modal-dot" data-dot-index="${index}" aria-label="${index + 1}번째 사진"></button>`).join('')}`;
    }

    const preloadAdjacent = () => {
      if (gallery.length < 2) return;
      [currentGalleryIndex - 1, currentGalleryIndex + 1].forEach((index) => {
        const normalized = (index + gallery.length) % gallery.length;
        const preload = new Image();
        preload.src = gallery[normalized].src;
      });
    };

    const updateDots = () => {
      if (!modalDots) return;

      const dots = [...modalDots.querySelectorAll('.modal-dot')];
      dots.forEach((dot, index) => {
        const active = index === currentGalleryIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });

      const activeDot = dots[currentGalleryIndex];
      if (!activeDot) return;

      if (modalDotIndicator) {
        const indicatorWidth = modalDotIndicator.offsetWidth || 14;
        const targetX = activeDot.offsetLeft + (activeDot.offsetWidth - indicatorWidth) / 2;

        if (!dotIndicatorReady) {
          modalDotIndicator.style.transition = 'none';
          modalDotIndicator.style.transform = `translate3d(${targetX}px, -50%, 0)`;
          void modalDotIndicator.offsetWidth;
          modalDotIndicator.style.transition = '';
          dotIndicatorReady = true;
        } else {
          modalDotIndicator.style.transform = `translate3d(${targetX}px, -50%, 0)`;
        }
      }

      const targetScrollLeft = activeDot.offsetLeft
        - (modalDots.clientWidth - activeDot.offsetWidth) / 2;
      modalDots.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: dotIndicatorReady ? 'smooth' : 'auto',
      });
    };

    const updateGalleryModal = (index, direction = 0) => {
      if (!modal || !modalPhoto || !gallery.length) return;
      currentGalleryIndex = (index + gallery.length) % gallery.length;
      const image = gallery[currentGalleryIndex];

      modalPhoto.classList.remove('slide-next', 'slide-prev');
      void modalPhoto.offsetWidth;
      modalPhoto.style.backgroundImage = `url("${encodeURI(image.src).replaceAll('"', '%22')}")`;
      modalPhoto.setAttribute('aria-label', image.alt || `웨딩 사진 ${currentGalleryIndex + 1}`);
      if (direction !== 0) modalPhoto.classList.add(direction > 0 ? 'slide-next' : 'slide-prev');
      if (modalCounter) modalCounter.textContent = `${currentGalleryIndex + 1} / ${gallery.length}`;
      updateDots();
      preloadAdjacent();
    };

    const openGalleryModal = (index) => {
      if (!modal || !gallery.length) return;
      trackEvent('gallery_open', {
        image_index: Number(index) + 1,
        image_count: gallery.length,
      });
      updateGalleryModal(index, 0);
      modal.hidden = false;
      document.body.classList.add('modal-open');
      modal.querySelector('.modal-close')?.focus({ preventScroll: true });
    };

    const closeGalleryModal = () => {
      if (!modal) return;
      modal.hidden = true;
      document.body.classList.remove('modal-open');
    };

    document.querySelectorAll('.gallery-item').forEach((button) => {
      button.addEventListener('click', () => openGalleryModal(Number(button.dataset.galleryIndex || 0)));
    });

    modal?.querySelector('.modal-close')?.addEventListener('click', closeGalleryModal);
    modal?.querySelector('.modal-prev')?.addEventListener('click', () => updateGalleryModal(currentGalleryIndex - 1, -1));
    modal?.querySelector('.modal-next')?.addEventListener('click', () => updateGalleryModal(currentGalleryIndex + 1, 1));
    modalDots?.querySelectorAll('.modal-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const nextIndex = Number(dot.dataset.dotIndex || 0);
        const direction = nextIndex >= currentGalleryIndex ? 1 : -1;
        updateGalleryModal(nextIndex, direction);
      });
    });
    modal?.addEventListener('click', (event) => {
      if (event.target === modal) closeGalleryModal();
    });
    modal?.addEventListener('pointerdown', (event) => {
      swipeStartX = event.clientX;
    });
    modal?.addEventListener('pointerup', (event) => {
      if (swipeStartX === null) return;
      const distance = event.clientX - swipeStartX;
      swipeStartX = null;
      if (Math.abs(distance) < 45) return;
      const direction = distance < 0 ? 1 : -1;
      updateGalleryModal(currentGalleryIndex + direction, direction);
    });
    modal?.addEventListener('pointercancel', () => {
      swipeStartX = null;
    });
    modal?.addEventListener('dblclick', (event) => event.preventDefault());
    modal?.addEventListener('wheel', (event) => {
      if (event.ctrlKey) event.preventDefault();
    }, { passive: false });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => {
      modal?.addEventListener(eventName, (event) => event.preventDefault(), { passive: false });
    });

    window.addEventListener('resize', () => {
      if (!modal || modal.hidden) return;
      dotIndicatorReady = false;
      updateDots();
    });

    document.addEventListener('keydown', (event) => {
      if (!modal || modal.hidden) return;
      if (event.key === 'Escape') closeGalleryModal();
      if (event.key === 'ArrowLeft') updateGalleryModal(currentGalleryIndex - 1, -1);
      if (event.key === 'ArrowRight') updateGalleryModal(currentGalleryIndex + 1, 1);
    });

    document.querySelectorAll('.account-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const target = document.getElementById(button.dataset.target);
        const symbol = button.querySelector('.toggle-symbol');
        const willOpen = target.hidden;
        target.hidden = !target.hidden;
        symbol.textContent = target.hidden ? '+' : '−';

        if (willOpen) {
          trackEvent('account_open', {
            account_side: button.dataset.target === 'groom-accounts' ? 'groom' : 'bride',
          });
        }
      });
    });

    document.querySelectorAll('.copy-account').forEach((button) => {
      button.addEventListener('click', () => copyText(button.dataset.account, '은행명과 계좌번호를 복사했습니다.'));
    });

    document.querySelectorAll('.protected-photo').forEach((photo) => {
      photo.addEventListener('contextmenu', (event) => event.preventDefault());
      photo.addEventListener('dragstart', (event) => event.preventDefault());
      photo.addEventListener('selectstart', (event) => event.preventDefault());
    });

    observeLazyImages(document);
    setupReveal();
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
    elements.forEach((element) => observer.observe(element));
  }

  setupAnalytics();
  render();
  setupInteractions();
})();
