(() => {
  'use strict';

  const config = window.WEDDING_DATA;
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

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

    return `
      <div class="gallery-grid reveal">
        ${gallery.map((image, index) => `
          <button type="button" class="gallery-item" data-gallery-index="${index}" aria-label="웨딩 사진 ${index + 1} 크게 보기">
            <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" loading="lazy" />
          </button>`).join('')}
      </div>`;
  }

  function renderTransport() {
    const transport = config.transport;
    return `
      <div class="guide-label reveal">${escapeHtml(transport.draft_label || '')}</div>
      <div class="transport-list reveal">
        ${(transport.items || []).map((item) => `
          <article class="transport-item">
            <strong>${escapeHtml(item.title)}</strong>
            <div>${(item.lines || []).map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div>
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
    return list.map((account) => `
      <div class="account-row">
        <div>
          <span>${escapeHtml(account.relation)}</span>
          <strong>${escapeHtml(account.bank)} ${escapeHtml(account.number)}</strong>
          <small>예금주 ${escapeHtml(account.holder)}</small>
        </div>
        <button type="button" class="copy-account" data-account="${escapeHtml(account.number)}">복사</button>
      </div>`).join('');
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

  function render() {
    const { couple, wedding, invitation, venue, images, site } = config;
    const hasFamily = couple.groom_family || couple.bride_family;
    const coverMarkup = images.cover
      ? `<img src="${escapeHtml(images.cover)}" alt="${escapeHtml(images.cover_alt)}" />`
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
          <a class="venue-link" href="${safeUrl(venue.naver_place_url)}" target="_blank" rel="noopener">
            ${escapeHtml(venue.name)}${venue.hall ? ` · ${escapeHtml(venue.hall)}` : ''}
          </a>
        </div>
      </header>

      <div class="draft-notice">${escapeHtml(site.draft_notice)}</div>

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
        ${sectionTitle('DATE', '예식 일정')}
        <div class="date-summary reveal">
          <p class="date-large">${config.wedding.date.replaceAll('-', '. ')}</p>
          <p>${escapeHtml(wedding.display_date)} ${escapeHtml(wedding.display_time)}</p>
        </div>
        ${renderCalendar()}
        <p class="dday reveal">${escapeHtml(couple.groom)} · ${escapeHtml(couple.bride)}의 결혼식까지 <strong>${getDday(wedding.date)}</strong></p>
      </section>

      <section class="section gallery-section">
        ${sectionTitle('GALLERY', '우리의 순간')}
        ${renderGallery()}
      </section>

      <section class="section location-section">
        ${sectionTitle('LOCATION', '오시는 길')}
        <div class="venue-summary reveal">
          <h3>${escapeHtml(venue.name)}</h3>
          ${venue.hall ? `<p class="hall-name">${escapeHtml(venue.hall)}</p>` : ''}
          <p>${escapeHtml(venue.address)}</p>
          ${venue.phone ? `<a href="tel:${escapeHtml(venue.phone.replaceAll('-', ''))}">${escapeHtml(venue.phone)}</a>` : ''}
        </div>

        <figure class="map-card reveal">
          <img src="${escapeHtml(images.map_image)}" alt="${escapeHtml(venue.name)} 약도" />
          ${images.map_is_draft ? '<figcaption>임시 약도 · 예식장 확정 후 교체 예정</figcaption>' : ''}
        </figure>

        <div class="map-buttons reveal">
          <a class="map-button naver naver-directions" href="${safeUrl(venue.naver_directions_url)}" data-fallback-url="${safeUrl(venue.naver_directions_url)}">네이버 길찾기</a>
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

      <footer>
        <span>THANK YOU</span>
        <p>${escapeHtml(config.footer.message)}</p>
        <small>WEDDING INVITATION</small>
      </footer>

      <div id="gallery-modal" class="modal" hidden role="dialog" aria-modal="true" aria-label="사진 크게 보기">
        <button type="button" class="modal-close" aria-label="닫기">×</button>
        <button type="button" class="modal-nav modal-prev" aria-label="이전 사진">‹</button>
        <img id="modal-image" src="" alt="" />
        <button type="button" class="modal-nav modal-next" aria-label="다음 사진">›</button>
      </div>`;
  }

  function setupInteractions() {
    document.querySelector('.naver-directions')?.addEventListener('click', (event) => {
      event.preventDefault();
      const button = event.currentTarget;
      const fallbackUrl = button.dataset.fallbackUrl;
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (!isMobile) {
        window.open(fallbackUrl, '_blank', 'noopener');
        return;
      }

      const venue = config.venue;
      const appName = encodeURIComponent(config.site.url || window.location.href.split('#')[0]);
      const destinationName = encodeURIComponent(venue.name);
      const routeUrl = `nmap://route/car?dlat=${venue.latitude}&dlng=${venue.longitude}&dname=${destinationName}&appname=${appName}`;
      const clickedAt = Date.now();
      window.location.href = routeUrl;

      window.setTimeout(() => {
        if (document.visibilityState === 'visible' && Date.now() - clickedAt < 2200) {
          window.location.href = fallbackUrl;
        }
      }, 1400);
    });

    document.querySelector('.address-copy')?.addEventListener('click', (event) => {
      copyText(event.currentTarget.dataset.address, '주소를 복사했습니다.');
    });

    document.getElementById('copy-url')?.addEventListener('click', () => {
      copyText(window.location.href, '청첩장 주소를 복사했습니다.');
    });

    document.querySelectorAll('.account-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const target = document.getElementById(button.dataset.target);
        const symbol = button.querySelector('.toggle-symbol');
        target.hidden = !target.hidden;
        symbol.textContent = target.hidden ? '+' : '−';
      });
    });

    document.querySelectorAll('.copy-account').forEach((button) => {
      button.addEventListener('click', () => copyText(button.dataset.account, '계좌번호를 복사했습니다.'));
    });

    setupGalleryModal();
    setupReveal();
  }

  function setupGalleryModal() {
    const gallery = config.images.gallery || [];
    const modal = document.getElementById('gallery-modal');
    const modalImage = document.getElementById('modal-image');
    if (!modal || !modalImage || !gallery.length) return;

    let currentIndex = 0;
    const show = (index) => {
      currentIndex = (index + gallery.length) % gallery.length;
      modalImage.src = gallery[currentIndex].src;
      modalImage.alt = gallery[currentIndex].alt;
      modal.hidden = false;
      document.body.classList.add('modal-open');
    };
    const close = () => {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
    };

    document.querySelectorAll('.gallery-item').forEach((button) => {
      button.addEventListener('click', () => show(Number(button.dataset.galleryIndex)));
    });
    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.querySelector('.modal-prev').addEventListener('click', () => show(currentIndex - 1));
    modal.querySelector('.modal-next').addEventListener('click', () => show(currentIndex + 1));
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    document.addEventListener('keydown', (event) => {
      if (modal.hidden) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') show(currentIndex - 1);
      if (event.key === 'ArrowRight') show(currentIndex + 1);
    });
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

  render();
  setupInteractions();
})();
