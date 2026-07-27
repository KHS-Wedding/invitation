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
    const modal = document.getElementById('gallery-modal');
    const modalViewport = modal?.querySelector('.modal-viewport');
    const modalTrack = modal?.querySelector('.modal-track');
    const modalPrevPhoto = modal?.querySelector('.modal-photo-prev');
    const modalCurrentPhoto = modal?.querySelector('.modal-photo-current');
    const modalNextPhoto = modal?.querySelector('.modal-photo-next');
    const modalCounter = modal?.querySelector('.modal-counter');
    const modalDots = modal?.querySelector('.modal-dots');

    let currentGalleryIndex = 0;
    let swipePointerId = null;
    let swipeStartX = 0;
    let swipeCurrentX = 0;
    let swipeStartTime = 0;
    let isDraggingGallery = false;
    let isAnimatingGallery = false;

    const normalizeGalleryIndex = (index) => (
      (index + gallery.length) % gallery.length
    );

    if (modalDots && gallery.length) {
      modalDots.innerHTML = gallery.map((_, index) => `
        <button type="button" class="modal-dot" data-dot-index="${index}" aria-label="${index + 1}번째 사진"></button>`).join('');
    }

    const encodedBackground = (src) => (
      `url("${encodeURI(src).replaceAll('"', '%22')}")`
    );

    const setPhoto = (element, index) => {
      if (!element || !gallery.length) return;
      const normalized = normalizeGalleryIndex(index);
      const image = gallery[normalized];
      element.style.backgroundImage = encodedBackground(image.src);
      element.setAttribute('aria-label', image.alt || `웨딩 사진 ${normalized + 1}`);
    };

    const preloadAround = (index = currentGalleryIndex) => {
      if (gallery.length < 2) return;
      [-2, -1, 1, 2].forEach((offset) => {
        const preload = new Image();
        preload.decoding = 'async';
        preload.src = gallery[normalizeGalleryIndex(index + offset)].src;
      });
    };

    const updateDots = () => {
      if (!modalDots) return;
      modalDots.querySelectorAll('.modal-dot').forEach((dot, index) => {
        const active = index === currentGalleryIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
      const activeDot = modalDots.querySelector('.modal-dot.is-active');
      activeDot?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    };

    const renderGalleryTrack = () => {
      if (!gallery.length || !modalTrack) return;
      setPhoto(modalPrevPhoto, currentGalleryIndex - 1);
      setPhoto(modalCurrentPhoto, currentGalleryIndex);
      setPhoto(modalNextPhoto, currentGalleryIndex + 1);
      modalTrack.style.transition = 'none';
      modalTrack.style.transform = 'translate3d(-100%, 0, 0)';
      if (modalCounter) {
        modalCounter.textContent = `${currentGalleryIndex + 1} / ${gallery.length}`;
      }
      updateDots();
      preloadAround();
    };

    const finishGallerySlide = (direction) => {
      if (!modalTrack || isAnimatingGallery || !direction) {
        renderGalleryTrack();
        return;
      }
      isAnimatingGallery = true;
      modalTrack.style.transition = 'transform 320ms cubic-bezier(.22,.72,.24,1)';
      modalTrack.style.transform = `translate3d(${direction > 0 ? '-200%' : '0%'}, 0, 0)`;

      const complete = () => {
        modalTrack.removeEventListener('transitionend', complete);
        currentGalleryIndex = normalizeGalleryIndex(currentGalleryIndex + direction);
        isAnimatingGallery = false;
        renderGalleryTrack();
      };
      modalTrack.addEventListener('transitionend', complete, { once: true });
      window.setTimeout(() => {
        if (isAnimatingGallery) complete();
      }, 380);
    };

    const snapGalleryBack = () => {
      if (!modalTrack) return;
      modalTrack.style.transition = 'transform 240ms cubic-bezier(.22,.72,.24,1)';
      modalTrack.style.transform = 'translate3d(-100%, 0, 0)';
    };

    const updateGalleryModal = (index, direction = 0) => {
      if (!modal || !gallery.length || isAnimatingGallery) return;
      const nextIndex = normalizeGalleryIndex(index);
      if (!direction || nextIndex === currentGalleryIndex) {
        currentGalleryIndex = nextIndex;
        renderGalleryTrack();
        return;
      }

      const directDistance = nextIndex - currentGalleryIndex;
      const wrappedForward = normalizeGalleryIndex(currentGalleryIndex + 1) === nextIndex;
      const wrappedBackward = normalizeGalleryIndex(currentGalleryIndex - 1) === nextIndex;

      if (wrappedForward) {
        finishGallerySlide(1);
      } else if (wrappedBackward) {
        finishGallerySlide(-1);
      } else {
        currentGalleryIndex = nextIndex;
        renderGalleryTrack();
      }
    };

    const openGalleryModal = (index) => {
      if (!modal || !gallery.length) return;
      trackEvent('gallery_open', {
        image_index: Number(index) + 1,
        image_count: gallery.length,
      });
      currentGalleryIndex = normalizeGalleryIndex(index);
      renderGalleryTrack();
      modal.hidden = false;
      document.body.classList.add('modal-open');
      modal.querySelector('.modal-close')?.focus({ preventScroll: true });
    };

    const closeGalleryModal = () => {
      if (!modal) return;
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      swipePointerId = null;
      isDraggingGallery = false;
      snapGalleryBack();
    };

    document.querySelectorAll('.gallery-item').forEach((button) => {
      button.addEventListener('click', () => openGalleryModal(Number(button.dataset.galleryIndex || 0)));
    });

    modal?.querySelector('.modal-close')?.addEventListener('click', closeGalleryModal);
    modal?.querySelector('.modal-prev')?.addEventListener('click', () => finishGallerySlide(-1));
    modal?.querySelector('.modal-next')?.addEventListener('click', () => finishGallerySlide(1));

    modalDots?.querySelectorAll('.modal-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const nextIndex = Number(dot.dataset.dotIndex || 0);
        updateGalleryModal(nextIndex, nextIndex >= currentGalleryIndex ? 1 : -1);
      });
    });

    modal?.addEventListener('click', (event) => {
      if (event.target === modal) closeGalleryModal();
    });

    modalViewport?.addEventListener('pointerdown', (event) => {
      if (isAnimatingGallery || gallery.length < 2) return;
      swipePointerId = event.pointerId;
      swipeStartX = event.clientX;
      swipeCurrentX = event.clientX;
      swipeStartTime = performance.now();
      isDraggingGallery = true;
      modalViewport.setPointerCapture?.(event.pointerId);
      modalTrack?.classList.add('is-dragging');
      if (modalTrack) modalTrack.style.transition = 'none';
    });

    modalViewport?.addEventListener('pointermove', (event) => {
      if (!isDraggingGallery || event.pointerId !== swipePointerId || !modalTrack) return;
      swipeCurrentX = event.clientX;
      const width = Math.max(modalViewport.clientWidth, 1);
      const deltaPercent = ((swipeCurrentX - swipeStartX) / width) * 100;
      const resisted = Math.max(-100, Math.min(100, deltaPercent));
      modalTrack.style.transform = `translate3d(calc(-100% + ${resisted}%), 0, 0)`;
    });

    const endGalleryDrag = (event) => {
      if (!isDraggingGallery || event.pointerId !== swipePointerId) return;
      const distance = swipeCurrentX - swipeStartX;
      const elapsed = Math.max(performance.now() - swipeStartTime, 1);
      const velocity = distance / elapsed;
      const width = Math.max(modalViewport?.clientWidth || 1, 1);
      const shouldMove = Math.abs(distance) > Math.min(90, width * 0.18) || Math.abs(velocity) > 0.48;
      const direction = distance < 0 ? 1 : -1;

      isDraggingGallery = false;
      swipePointerId = null;
      modalTrack?.classList.remove('is-dragging');
      modalViewport?.releasePointerCapture?.(event.pointerId);

      if (shouldMove) {
        finishGallerySlide(direction);
      } else {
        snapGalleryBack();
      }
    };

    modalViewport?.addEventListener('pointerup', endGalleryDrag);
    modalViewport?.addEventListener('pointercancel', (event) => {
      if (event.pointerId !== swipePointerId) return;
      isDraggingGallery = false;
      swipePointerId = null;
      modalTrack?.classList.remove('is-dragging');
      snapGalleryBack();
    });

    modal?.addEventListener('dblclick', (event) => event.preventDefault());
    modal?.addEventListener('wheel', (event) => {
      if (event.ctrlKey) event.preventDefault();
    }, { passive: false });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => {
      modal?.addEventListener(eventName, (event) => event.preventDefault(), { passive: false });
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
      button.addEventListener('click', () => {
        trackEvent('account_copy', {
          account_side: button.closest('.account-list')?.id === 'groom-accounts' ? 'groom' : 'bride',
        });
        copyText(button.dataset.account, '은행명과 계좌번호를 복사했습니다.');
      });
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
