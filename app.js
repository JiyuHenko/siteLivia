import { siteConfig } from './config.js';

document.documentElement.classList.add('js');
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const arrow = '<svg aria-hidden="true"><use href="#diagonal"/></svg>';

// Every photograph and service description comes from the supplied portfolios.
const experiences = {
  noivas: {
    page: 'noivas.html',
    image: 'noivas.webp', alt: 'Noiva de vestido e véu com maquiagem de Lívia Lopes',
    label: 'PARA O SEU SIM', index: 'THE BRIDAL EXPERIENCE / 01',
    title: 'Você, em sua<br>versão mais <em>sua.</em>',
    description: 'Um olhar sensível para um dos dias mais especiais da sua vida. Da prévia à preparação, cada detalhe é pensado para que você se sinta segura, leve e presente.',
    details: ['Prévia personalizada de maquiagem', 'Beleza para o pré-wedding e a cerimônia', 'Atendimento no local da sua preferência', 'Pele leve, elegante e de longa duração'],
    cta: 'Vamos falar sobre o seu grande dia',
  },
  debutantes: {
    page: 'debutantes.html',
    image: 'debutantes.webp', alt: 'Debutante em vestido azul em sua festa de quinze anos',
    label: 'UM NOVO CAPÍTULO', index: 'EXPERIÊNCIA DEBUTANTE / 02',
    title: 'Sua noite.<br>Sua <em>essência.</em>',
    description: 'Quinze anos, tantos sonhos e uma beleza que acompanha quem você está se tornando. Uma experiência pensada para celebrar sua personalidade, com leveza e autenticidade.',
    details: ['Teste personalizado de maquiagem', 'Beleza para o dia da sua festa', 'Retoque para a valsa e a celebração', 'Atendimento no local da sua preferência'],
    cta: 'Vamos planejar a sua beleza',
  },
  social: {
    page: 'maquiagem-social.html',
    image: 'social.webp', alt: 'Maquiagem social com olhos definidos e pele luminosa por Lívia Lopes',
    label: 'PARA CELEBRAR A VIDA', index: 'BELEZA SOCIAL / 03',
    title: 'Ocasiões especiais.<br>Beleza <em>de verdade.</em>',
    description: 'Uma festa, uma formatura, um encontro importante. A maquiagem acompanha a ocasião sem deixar de ser sua: equilibrada, sofisticada e com atenção a cada detalhe.',
    details: ['Produção para festas e ocasiões especiais', 'Beleza para mães, madrinhas e convidadas', 'Um olhar atento aos seus traços e estilo', 'Atendimento com horário marcado'],
    cta: 'Quero uma beleza para o meu momento',
  },
};

const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 }) : null;
$$('.reveal').forEach((element) => observer ? observer.observe(element) : element.classList.add('is-visible'));

// Tab order and arrow keys follow the WAI-ARIA tabs pattern.
const tabs = $$('[role="tab"]');
function selectExperience(service, focus = false) {
  const experience = experiences[service];
  if (!experience || !$('#experience-panel')) return;
  tabs.forEach((tab) => {
    const selected = tab.dataset.service === service;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  const photo = $('#experience-image');
  photo.src = `./assets/${experience.image}`;
  photo.alt = experience.alt;
  $('#experience-label').textContent = experience.label;
  $('#experience-index').textContent = experience.index;
  $('#experience-title').innerHTML = experience.title;
  $('#experience-description').textContent = experience.description;
  $('#experience-details').replaceChildren(...experience.details.map((detail) => {
    const item = document.createElement('li');
    item.textContent = detail;
    return item;
  }));
  $('#experience-book').innerHTML = experience.cta + arrow;
  $('#experience-book').dataset.book = service;
  if ($('#experience-learn')) $('#experience-learn').href = `./${experience.page}`;
  $('#experience-panel').setAttribute('aria-labelledby', `tab-${service}`);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    [photo, $('.experience-content')].forEach((element, index) => {
      element.getAnimations().forEach((animation) => animation.cancel());
      element.animate([{ opacity: 0.35, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], {
        duration: 600, delay: index * 50, easing: 'cubic-bezier(.22,1,.36,1)',
      });
    });
  }
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectExperience(tab.dataset.service));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectExperience(tabs[next].dataset.service, true);
  });
});
function readExperienceHash() {
  const service = location.hash.slice(1);
  if (experiences[service] && $('#experiencias') && $('#experience-panel')) {
    selectExperience(service);
    $('#experiencias').scrollIntoView({ behavior: 'instant', block: 'start' });
  }
}
window.addEventListener('hashchange', readExperienceHash);
readExperienceHash();

const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
function closeMenu(restoreFocus = false) {
  if (restoreFocus && mobileNav.contains(document.activeElement)) menuToggle.focus({ preventScroll: true });
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menu');
  mobileNav.hidden = true;
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  mobileNav.hidden = !open;
});
$$('a, button', mobileNav).forEach((item) => item.addEventListener('click', () => closeMenu(true)));
document.addEventListener('click', (event) => {
  if (!mobileNav.hidden && !mobileNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(true); });
window.matchMedia('(min-width: 801px)').addEventListener('change', ({ matches }) => { if (matches) closeMenu(); });

const experienceMenus = $$('.nav-experiences');
document.addEventListener('click', (event) => experienceMenus.forEach((menu) => {
  if (!menu.contains(event.target)) menu.open = false;
}));
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  experienceMenus.forEach((menu) => {
    if (menu.open && menu.contains(document.activeElement)) $('summary', menu).focus();
    menu.open = false;
  });
});

// Native dialog focus is restored to the control that opened it.
const dialogOpeners = new WeakMap();
function openDialog(dialog, opener) {
  if (!dialog || dialog.open) return;
  const target = opener || document.activeElement;
  dialogOpeners.set(dialog, target?.getClientRects().length ? target : menuToggle);
  dialog.showModal();
  dialog.scrollTop = 0;
}
$$('dialog').forEach((dialog) => {
  $$('[data-close]', dialog).forEach((button) => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    const opener = dialogOpeners.get(dialog);
    const target = opener?.getClientRects().length ? opener : menuToggle;
    target?.focus({ preventScroll: true });
  });
});
$$('[data-privacy]').forEach((button) => button.addEventListener('click', () => openDialog($('#privacy-dialog'), button)));

// Filter and lightbox use the same visible set, including keyboard navigation.
const galleryItems = $$('.gallery-item');
const filters = $$('[data-filter]');
function filterGallery(button, updateUrl = true) {
  if (!button || !$('#gallery')) return;
  const filter = button.dataset.filter;
  filters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  $('#gallery').classList.toggle('is-filtered', filter !== 'all');
  galleryItems.forEach((item) => {
    item.hidden = filter !== 'all' && item.dataset.category !== filter;
    if (!item.hidden) item.classList.add('is-visible');
  });
  const visibleCount = galleryItems.filter((item) => !item.hidden).length;
  if ($('#gallery-count')) $('#gallery-count').textContent = `${String(visibleCount).padStart(2, '0')} fotografias`;
  if (updateUrl && document.body.classList.contains('gallery-page')) {
    const url = new URL(location.href);
    if (filter === 'all') url.searchParams.delete('categoria');
    else url.searchParams.set('categoria', filter);
    history.replaceState(null, '', url);
  }
}
filters.forEach((button) => button.addEventListener('click', () => filterGallery(button)));
if (filters.length) {
  const requested = new URLSearchParams(location.search).get('categoria');
  filterGallery(filters.find((button) => button.dataset.filter === requested) || filters[0], false);
}
const lightbox = $('#lightbox');
let lightboxIndex = 0;
let lightboxItems = [];
function updateLightbox() {
  const current = lightboxItems[lightboxIndex];
  const image = $('img', current);
  $('#lightbox-image').src = image.src;
  $('#lightbox-image').alt = image.alt;
  $('#lightbox-caption').textContent = current.dataset.caption;
  $('#lightbox-counter').textContent = `${String(lightboxIndex + 1).padStart(2, '0')} / ${String(lightboxItems.length).padStart(2, '0')}`;
}
function stepLightbox(direction) {
  lightboxIndex = (lightboxIndex + direction + lightboxItems.length) % lightboxItems.length;
  updateLightbox();
}
galleryItems.forEach((item) => item.addEventListener('click', () => {
  lightboxItems = galleryItems.filter((photo) => !photo.hidden);
  lightboxIndex = lightboxItems.indexOf(item);
  updateLightbox();
  openDialog(lightbox, item);
}));
$('.lightbox-prev')?.addEventListener('click', () => stepLightbox(-1));
$('.lightbox-next')?.addEventListener('click', () => stepLightbox(1));
lightbox?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    stepLightbox(event.key === 'ArrowRight' ? 1 : -1);
  }
});

const bookingDialog = $('#booking-dialog');
const bookingForm = $('#booking-form');
const serviceField = bookingForm.elements.service;
const status = $('#form-status');
let pendingSubmission = false;
let bookingAttempt = null;

function todayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type).value).join('-');
}
bookingForm.elements.date.min = todayInSaoPaulo();
function usesOnlineBooking() { return Boolean(String(siteConfig.bookingEndpoint || '').trim()) && serviceField.value !== 'curso'; }
function updateBookingMode() {
  const course = serviceField.value === 'curso';
  bookingForm.elements.date.min = todayInSaoPaulo();
  bookingForm.elements.date.required = !course;
  bookingForm.elements.time.required = !course;
  $('#submit-label').textContent = usesOnlineBooking() ? 'Solicitar meu horário' : 'Continuar no WhatsApp';
  $('.submit-button svg use')?.setAttribute('href', usesOnlineBooking() ? '#arrow' : '#whatsapp');
  $('#booking-notice').textContent = usesOnlineBooking()
    ? 'Esta é uma solicitação de pré-agendamento. A data e o horário dependem da confirmação pessoal da Lívia.'
    : course
      ? 'As datas e os detalhes do curso são combinados com a Lívia. Você pode deixar data e horário em branco. Vamos preparar sua mensagem para o WhatsApp.'
      : 'Vamos preparar uma mensagem para você enviar pelo WhatsApp. O horário será confirmado pessoalmente pela Lívia.';
}
serviceField.addEventListener('change', updateBookingMode);
$$('[data-book]').forEach((button) => button.addEventListener('click', () => {
  if (!pendingSubmission) {
    $('#booking-result').hidden = true;
    bookingForm.hidden = false;
    $('.booking-intro').hidden = false;
    status.textContent = '';
    status.classList.remove('is-error');
    // A visitor may keep typing across dialog openings; only their chosen service changes.
    const service = button.dataset.book || document.body.dataset.service;
    if (service) serviceField.value = service;
    updateBookingMode();
  }
  openDialog(bookingDialog, button);
}));

const serviceNames = { noivas: 'Noiva', debutantes: 'Debutante', social: 'Maquiagem social', curso: 'Curso presencial de automaquiagem' };
function whatsappUrl(data) {
  const date = data.date ? data.date.split('-').reverse().join('/') : 'a combinar';
  const message = [
    'Olá, Lívia! Vim pelo seu site e gostaria de conversar sobre uma experiência.',
    '', `Meu nome: ${data.name}`, `WhatsApp: ${data.phone}`, `Experiência: ${serviceNames[data.service]}`,
    `Data desejada: ${date}`, `Horário desejado: ${data.time || 'a combinar'}`,
    ...(data.notes ? [`Meus planos: ${data.notes}`] : []), '',
    'Entendo que a disponibilidade e o horário precisam ser confirmados por você.',
  ].join('\n');
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`;
}

function showResult(title, text, url) {
  bookingForm.hidden = true;
  $('.booking-intro').hidden = true;
  const result = $('#booking-result');
  result.hidden = false;
  $('h3', result).innerHTML = title;
  $('#booking-result-text').textContent = text;
  $('.result-symbol', result).innerHTML = `<svg aria-hidden="true"><use href="#${url ? 'whatsapp' : 'check'}"/></svg>`;
  $('.whatsapp-reopen', result)?.remove();
  if (url) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'text-link whatsapp-reopen';
    link.innerHTML = 'Abrir minha mensagem no WhatsApp ' + arrow;
    $('#booking-result-text').after(link);
  }
  bookingDialog.scrollTop = 0;
  $('h3', result).tabIndex = -1;
  $('h3', result).focus();
}

// Apps Script HtmlService lives inside a nested Google iframe. A real positive
// acknowledgement is required: an opaque/no-cors response is never success.
function sendOnlineRequest(data) {
  return new Promise((resolve, reject) => {
    let endpoint;
    try { endpoint = new URL(String(siteConfig.bookingEndpoint || '').trim()); } catch {
      reject(new Error('O agendamento online está indisponível. Fale com a Lívia pelo WhatsApp.'));
      return;
    }
    if (endpoint.origin !== 'https://script.google.com' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint.pathname)) {
      reject(new Error('O agendamento online está indisponível. Fale com a Lívia pelo WhatsApp.'));
      return;
    }
    const frame = document.createElement('iframe');
    frame.name = `booking-${data.requestId}`;
    frame.title = 'Envio privado da solicitação';
    frame.hidden = true;
    const transport = document.createElement('form');
    transport.method = 'POST';
    transport.action = endpoint.href;
    transport.target = frame.name;
    transport.hidden = true;
    Object.entries(data).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = key; input.value = String(value);
      transport.append(input);
    });
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove(); transport.remove();
    };
    const onMessage = (event) => {
      let origin;
      try { origin = new URL(event.origin); } catch { return; }
      const googleOrigin = origin.protocol === 'https:' && !origin.port && (origin.hostname === 'script.google.com' || origin.hostname.endsWith('.googleusercontent.com'));
      const payload = event.data;
      if (!googleOrigin || !payload || typeof payload !== 'object' || Array.isArray(payload) || payload.source !== 'livia-booking' || payload.requestId !== data.requestId) return;
      cleanup();
      if (payload.ok === true && typeof payload.reference === 'string' && /^LL-[A-F0-9]{12}$/.test(payload.reference)) resolve(payload);
      else if (payload.ok === false && typeof payload.error === 'string' && payload.error.trim()) reject(new Error(payload.error.slice(0, 500)));
      else reject(new Error('Não foi possível confirmar o recebimento. Tente novamente sem alterar os dados ou fale pelo WhatsApp.'));
    };
    window.addEventListener('message', onMessage);
    timer = setTimeout(() => {
      cleanup();
      reject(new Error('Não recebemos a confirmação do envio. Você pode tentar novamente sem duplicar a solicitação ou conversar pelo WhatsApp.'));
    }, 25000);
    try {
      document.body.append(frame, transport);
      transport.submit();
    } catch {
      cleanup();
      reject(new Error('Não foi possível confirmar o envio. Tente novamente ou fale com a Lívia pelo WhatsApp.'));
    }
  });
}

bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (pendingSubmission || !bookingForm.reportValidity()) return;
  if (bookingForm.elements.website.value) return;
  const fields = Object.fromEntries(new FormData(bookingForm));
  fields.name = fields.name.trim();
  fields.phone = fields.phone.trim();
  fields.notes = fields.notes.trim();
  if (fields.name.length < 2 || !/^(?:55)?\d{10,11}$/.test(fields.phone.replace(/\D/g, ''))) {
    status.textContent = 'Confira seu nome e informe um WhatsApp com DDD válido.';
    status.classList.add('is-error');
    return;
  }
  if (fields.date && fields.date < todayInSaoPaulo()) {
    status.textContent = 'Escolha uma data a partir de hoje.';
    status.classList.add('is-error');
    return;
  }
  if (!usesOnlineBooking()) {
    const url = whatsappUrl(fields);
    window.open(url, '_blank', 'noopener,noreferrer');
    showResult('Sua mensagem<br>está <em>pronta.</em>', 'Envie a mensagem no WhatsApp para concluir o contato. A Lívia vai conversar com você sobre disponibilidade e os próximos detalhes. Nenhum horário foi reservado pelo site.', url);
    return;
  }
  pendingSubmission = true;
  const disabledFields = Array.from(bookingForm.elements, (field) => ({ field, disabled: field.disabled }));
  disabledFields.forEach(({ field }) => { field.disabled = true; });
  status.classList.remove('is-error');
  status.textContent = 'Registrando sua solicitação…';
  try {
    const fingerprint = JSON.stringify(fields);
    if (!bookingAttempt || bookingAttempt.fingerprint !== fingerprint) {
      if (!globalThis.crypto?.randomUUID) throw new Error('Este navegador não permite enviar o formulário com segurança. Continue pelo WhatsApp.');
      bookingAttempt = { fingerprint, id: crypto.randomUUID() };
    }
    const data = { ...fields, action: 'request', consent: 'true', requestId: bookingAttempt.id };
    const response = await sendOnlineRequest(data);
    showResult('Recebemos os<br>seus <em>planos.</em>', `Sua solicitação ${response.reference} foi registrada. A Lívia retornará pelo WhatsApp para confirmar a disponibilidade. Seu horário ainda não está reservado.`);
    bookingForm.reset();
    bookingAttempt = null;
    updateBookingMode();
  } catch (error) {
    status.textContent = error.message;
    status.classList.add('is-error');
    const fallback = document.createElement('a');
    fallback.href = whatsappUrl(fields); fallback.target = '_blank'; fallback.rel = 'noopener noreferrer';
    fallback.textContent = 'Continuar pelo WhatsApp '; fallback.style.textDecoration = 'underline';
    fallback.insertAdjacentHTML('beforeend', arrow);
    status.append(fallback);
  } finally {
    pendingSubmission = false;
    disabledFields.forEach(({ field, disabled }) => { field.disabled = disabled; });
  }
});
updateBookingMode();
$('#year').textContent = new Date().getFullYear();

// A translated image layer gives Safari the same motion as desktop browsers.
// Only visible sections are measured, and reduced motion always gets a still image.
const parallaxSections = $$('[data-parallax]');
if (parallaxSections.length) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const activeSections = new Set();
  let scheduledFrame = 0;
  const paintParallax = () => {
    scheduledFrame = 0;
    if (motionPreference.matches) {
      parallaxSections.forEach((section) => section.style.removeProperty('--parallax-y'));
      return;
    }
    const viewportHeight = window.innerHeight;
    const distance = window.innerWidth <= 560 ? 90 : 150;
    activeSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const progress = Math.max(-0.5, Math.min(0.5, (viewportHeight / 2 - rect.top - rect.height / 2) / (viewportHeight + rect.height)));
      section.style.setProperty('--parallax-y', `${(progress * distance).toFixed(2)}px`);
    });
  };
  const scheduleParallax = () => {
    if (!scheduledFrame) scheduledFrame = requestAnimationFrame(paintParallax);
  };
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => isIntersecting ? activeSections.add(target) : activeSections.delete(target));
      scheduleParallax();
    }, { rootMargin: '150px' });
    parallaxSections.forEach((section) => visibility.observe(section));
  } else parallaxSections.forEach((section) => activeSections.add(section));
  window.addEventListener('scroll', scheduleParallax, { passive: true });
  window.addEventListener('resize', scheduleParallax, { passive: true });
  motionPreference.addEventListener('change', scheduleParallax);
  scheduleParallax();
}
