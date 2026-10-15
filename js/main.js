(function () {
  'use strict';

  var WA_NUMBER = '77769860358';
  var WEBINAR_START = new Date('2026-10-27T19:00:00+05:00');
  var WEBINAR_LENGTH_MS = 2.5 * 60 * 60 * 1000;

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOK = (!reduce || root.classList.contains('force-motion')) && window.gsap && window.ScrollTrigger;
  if (motionOK) root.classList.add('motion');

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  /* ---------- nav ---------- */
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- plate story ---------- */
  var stories = Array.prototype.slice.call(document.querySelectorAll('[data-stories] .story'));
  var foods = Array.prototype.slice.call(document.querySelectorAll('.plate .food'));
  var counterNum = document.querySelector('[data-counter]');
  var counterLabel = document.querySelector('[data-counter-label]');
  var lastStep = stories.length - 1;

  function countFor(step) {
    return foods.filter(function (f) { return +f.dataset.step <= step; }).length;
  }
  function setCounter(step) {
    var n = countFor(step);
    counterNum.textContent = n;
    counterLabel.textContent = plural(n, 'продукт', 'продукта', 'продуктов') + ' на тарелке';
  }

  if (!motionOK) {
    setCounter(lastStep);
  } else {
    gsap.registerPlugin(ScrollTrigger);

    // hero: one entrance — the plate lands, then the pasta
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-title', { y: 40, opacity: 0, duration: .8 })
      .from('.hero-kicker, .hero-lead, .hero-actions', { y: 24, opacity: 0, duration: .6, stagger: .08 }, '-=.5')
      .from('.hero-photo', { y: 60, opacity: 0, duration: .9 }, 0.1)
      .from('.hero-disc', { scale: .7, opacity: 0, duration: .9 }, 0)
      .from('.hero-plate', { y: 160, rotate: -12, duration: .9, ease: 'back.out(1.4)' }, .35)
      .from('.hero-pasta', { y: -120, scale: 1.4, opacity: 0, duration: .55, ease: 'back.out(2)' }, .95)
      .from('.hero-float', { scale: 0, opacity: 0, duration: .5, stagger: .1, ease: 'back.out(2)' }, 1.05)
      .from('.sticker', { scale: 0, rotate: -90, duration: .6, ease: 'back.out(1.8)' }, 1.2);

    gsap.set(foods, { opacity: 0, y: -90, scale: 1.25 });
    // at the start the pasta sits alone in the middle of the plate, then moves to its slot
    var pasta = document.querySelector('.fd-pasta');
    var pastaSlot = { left: '33%', top: '34%', width: '31%' };
    var pastaAlone = { left: '50%', top: '50%', width: '38%' };
    var shown = new Set();
    var current = -1;

    function setStep(step) {
      if (step === current) return;
      current = step;
      stories.forEach(function (s, i) { s.classList.toggle('is-active', i === step); });
      var wave = 0;
      foods.forEach(function (f) {
        var on = +f.dataset.step <= step;
        if (on && !shown.has(f)) {
          shown.add(f);
          gsap.to(f, { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'back.out(1.7)', delay: wave * .07, overwrite: true });
          wave++;
        } else if (!on && shown.has(f)) {
          shown.delete(f);
          gsap.to(f, { opacity: 0, y: -90, scale: 1.25, duration: .3, ease: 'power2.in', overwrite: true });
        }
      });
      gsap.to(pasta, Object.assign({ duration: .6, ease: 'power3.inOut' }, step === 0 ? pastaAlone : pastaSlot));
      setCounter(step);
    }

    ScrollTrigger.create({
      trigger: '.plate-story',
      pin: '.plate-pin',
      start: 'top top',
      end: function () { return '+=' + window.innerHeight * 0.75 * stories.length; },
      scrub: false,
      anticipatePin: 1,
      onUpdate: function (self) {
        setStep(Math.min(lastStep, Math.floor(self.progress * stories.length * 0.999)));
      }
    });
    setStep(0);
  }

  /* ---------- pains ---------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var painsResult = document.querySelector('[data-pains-result]');
  function updatePains() {
    var n = chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; }).length;
    if (n === 0) {
      painsResult.textContent = 'Пока ничего не отмечено.';
    } else if (n < 3) {
      painsResult.innerHTML = 'Отмечено ' + n + '. Именно это разберём на вебинаре. <a href="#register">Забронировать место</a>';
    } else {
      painsResult.innerHTML = 'Отмечено ' + n + ' из ' + chips.length + '. Это типичная картина малоежки, и её можно поменять без давления. <a href="#register">Приходите 27 октября</a>';
    }
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      updatePains();
    });
  });

  /* ---------- countdown ---------- */
  var cd = document.querySelector('[data-countdown]');
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var diff = WEBINAR_START - Date.now();
    if (diff <= 0) {
      cd.classList.add('is-live');
      cd.textContent = diff > -WEBINAR_LENGTH_MS ? 'Эфир идёт прямо сейчас. Ссылка — в WhatsApp-канале.' : 'Вебинар прошёл. Новую дату объявим в Instagram.';
      return false;
    }
    var d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60;
    cd.querySelector('[data-cd="d"]').textContent = d;
    cd.querySelector('[data-cd="h"]').textContent = pad(h);
    cd.querySelector('[data-cd="m"]').textContent = pad(m);
    cd.querySelector('[data-cd="d"]').nextElementSibling.textContent = plural(d, 'день', 'дня', 'дней');
    cd.querySelector('[data-cd="h"]').nextElementSibling.textContent = plural(h, 'час', 'часа', 'часов');
    cd.querySelector('[data-cd="m"]').nextElementSibling.textContent = plural(m, 'минута', 'минуты', 'минут');
    return true;
  }
  if (tick()) {
    var timer = setInterval(function () { if (!tick()) clearInterval(timer); }, 15000);
  }

  /* ---------- reels: drag to scroll on desktop ---------- */
  var track = document.querySelector('[data-reels]');
  var drag = null;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) { drag.moved = true; track.classList.add('is-dragging'); }
    track.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!drag) return;
    var moved = drag.moved;
    drag = null;
    track.classList.remove('is-dragging');
    if (moved) track.addEventListener('click', function stop(ev) { ev.preventDefault(); track.removeEventListener('click', stop, true); }, true);
  });

  /* ---------- lightbox ---------- */
  var box = document.querySelector('[data-lightbox]');
  var boxImg = box.querySelector('img');
  document.querySelectorAll('.shot').forEach(function (b) {
    b.addEventListener('click', function () {
      boxImg.src = b.dataset.full;
      if (box.showModal) box.showModal(); else window.open(b.dataset.full, '_blank');
    });
  });
  box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('lightbox-close')) box.close(); });

  /* ---------- form → WhatsApp ---------- */
  var form = document.querySelector('[data-form]');
  var msg = document.querySelector('[data-form-msg]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    var digits = phone.replace(/\D/g, '');
    form.name.closest('.field').classList.toggle('is-invalid', !name);
    form.phone.closest('.field').classList.toggle('is-invalid', digits.length < 10);
    if (!name || digits.length < 10) {
      msg.className = 'form-msg is-error';
      msg.textContent = !name ? 'Напишите, как к вам обращаться.' : 'Проверьте номер: нужно минимум 10 цифр.';
      (!name ? form.name : form.phone).focus();
      return;
    }
    var age = (form.querySelector('input[name="age"]:checked') || {}).value;
    var eats = form.eats.value.trim();
    var text = 'Здравствуйте! Хочу на вебинар «Малоежки» 27 октября.\n' +
      'Имя: ' + name + '\nWhatsApp: ' + phone +
      (age ? '\nВозраст ребёнка: ' + age : '') +
      (eats ? '\nСейчас ест: ' + eats : '');
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    msg.className = 'form-msg is-ok';
    msg.textContent = 'Открыли WhatsApp с готовой заявкой. Отправьте сообщение, и вас добавят в канал вебинара.';
  });
})();
