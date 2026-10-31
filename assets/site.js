(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- night mode ---------- */
  const root = document.documentElement;
  if (store.get('karuthal-night') === '1') root.classList.add('night');
  const navLinks = document.querySelector('header nav > div:last-child');
  if (navLinks) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'night-btn';
    const paint = () => {
      const on = root.classList.contains('night');
      btn.setAttribute('aria-pressed', String(on));
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${on
        ? '<circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'
        : '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'}</svg>${on ? 'DAY' : 'NIGHT'}`;
    };
    paint();
    btn.addEventListener('click', () => {
      root.classList.toggle('night');
      store.set('karuthal-night', root.classList.contains('night') ? '1' : '0');
      paint();
    });
    navLinks.insertBefore(btn, navLinks.lastElementChild);
  }

  /* ---------- hero draws itself, then comes alive ---------- */
  const hero = document.getElementById('hero-art');
  if (hero) {
    if (reduce) {
      hero.classList.add('alive');
    } else {
      const shapes = hero.querySelectorAll('g path, g line, g polyline, g polygon, g rect, g circle, g ellipse');
      let i = 0;
      shapes.forEach((el) => {
        if (el.closest('defs')) return;
        const d = Math.min(i * 14, 3200);
        if (el.getAttribute('stroke') === 'none') {
          el.classList.add('fo');
          el.style.animationDelay = `${d + 600}ms`;
        } else {
          el.setAttribute('pathLength', '1');
          el.classList.add('ink');
          const fill = el.getAttribute('fill');
          if (fill && fill !== 'none') {
            el.classList.add('f');
            el.style.animationDelay = `${d}ms, ${d + 700}ms`;
          } else {
            el.style.animationDelay = `${d}ms`;
          }
        }
        i++;
      });
      const total = Math.min(i * 14, 3200) + 1300;
      hero.querySelectorAll('text').forEach((t) => {
        t.classList.add('lbl');
        t.style.animationDelay = `${total - 300}ms`;
      });
      hero.classList.add('drawing');
      setTimeout(() => {
        hero.classList.remove('drawing');
        hero.querySelectorAll('.ink, .fo, .lbl').forEach((el) => {
          el.classList.remove('ink', 'f', 'fo', 'lbl');
          el.style.animationDelay = '';
          el.removeAttribute('pathLength');
        });
        hero.classList.add('alive');
      }, total + 500);
    }
  }

  /* ---------- dream-home builder ---------- */
  const dream = document.getElementById('dream-form');
  const dreamSvg = document.getElementById('dream-svg');
  if (dream && dreamSvg) {
    const words = {
      roof: { sloped: 'sloping tiled-roof', flat: 'flat-terrace', butterfly: 'butterfly-roof' },
      windows: { jali: 'laterite jali', glass: 'big glass' }
    };
    const summaryEl = document.getElementById('dream-summary');
    const read = () => Object.fromEntries(new FormData(dream).entries());
    const describe = (v) => {
      const extras = [];
      if (v.verandah === 'yes') extras.push('a sit-out verandah');
      if (v.courtyard === 'yes') extras.push('a nadumuttam courtyard');
      extras.push(`${words.windows[v.windows]} windows`);
      const last = extras.pop();
      return `A ${words.roof[v.roof]} home with ${extras.length ? extras.join(', ') + ' and ' : ''}${last}.`;
    };
    const update = () => {
      const v = read();
      Object.entries(v).forEach(([k, val]) => { dreamSvg.dataset[k] = val; });
      summaryEl.textContent = describe(v);
    };
    dream.addEventListener('change', update);
    update();
    dream.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = document.getElementById('enq-msg');
      if (msg) {
        msg.value = `Here's the home I sketched on your site: ${describe(read())}\n\nAbout my plot: `;
        document.getElementById('enquiry').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
        setTimeout(() => document.getElementById('enq-name').focus({ preventScroll: true }), reduce ? 0 : 600);
      }
    });
  }

  /* ---------- enquiry form (prototype) ---------- */
  const enq = document.getElementById('enq-form');
  if (enq) {
    enq.addEventListener('submit', (e) => {
      e.preventDefault();
      enq.querySelector('.status').textContent = "Prototype — not sent yet. On the real site this lands straight in the studio's inbox.";
    });
  }

  /* ---------- drawing <-> photo slider ---------- */
  document.querySelectorAll('.compare').forEach((c) => {
    const input = c.querySelector('input[type=range]');
    const set = (v) => { c.style.setProperty('--pos', `${v}%`); };
    input.addEventListener('input', () => set(input.value));
    if (reduce || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const keys = [[0, 50], [700, 88], [1500, 14], [2200, 50]];
      const start = performance.now();
      const tick = (t) => {
        const el = t - start;
        let k = 0;
        while (k < keys.length - 2 && el > keys[k + 1][0]) k++;
        const [t0, v0] = keys[k]; const [t1, v1] = keys[k + 1];
        const p = Math.min(1, Math.max(0, (el - t0) / (t1 - t0)));
        const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const v = v0 + (v1 - v0) * e;
        set(v); input.value = v;
        if (el < keys[keys.length - 1][0]) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(c);
  });

  /* ---------- the studio cat ---------- */
  const cat = document.createElement('div');
  cat.className = 'kcat';
  cat.setAttribute('aria-hidden', 'true');
  cat.innerHTML = `<span class="kcat-say">mrrp.</span>
  <svg viewBox="0 0 120 90" fill="none" stroke="#141414" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="28,42 30,8 54,30" fill="#141414"/><polygon points="66,30 90,8 92,42" fill="#141414"/>
    <ellipse cx="60" cy="60" rx="40" ry="32" fill="#141414"/>
    <circle cx="45" cy="56" r="9" fill="#F4F1EA" stroke="none"/><circle cx="75" cy="56" r="9" fill="#F4F1EA" stroke="none"/>
    <ellipse cx="47" cy="57" rx="3" ry="6" fill="#141414" stroke="none"/><ellipse cx="77" cy="57" rx="3" ry="6" fill="#141414" stroke="none"/>
    <polygon points="56,68 64,68 60,73" fill="#F4F1EA" stroke="none"/>
    <path d="M30 70 L12 66 M30 75 L12 78 M90 70 L108 66 M90 75 L108 78" stroke="#141414" stroke-width="2"/>
    <ellipse cx="36" cy="88" rx="15" ry="9" fill="#141414"/><ellipse cx="84" cy="88" rx="15" ry="9" fill="#141414"/>
    <path d="M31 84 v6 M37 83 v7 M79 84 v6 M85 83 v7" stroke="#F4F1EA" stroke-width="1.6"/>
  </svg>`;
  document.body.appendChild(cat);
  const lines = ['mrrp.', 'measure twice.', 'nice roof.', 'is it lunch yet?', 'I approve this courtyard.', 'more chai, please.'];
  cat.addEventListener('mouseenter', () => {
    cat.querySelector('.kcat-say').textContent = lines[Math.floor(Math.random() * lines.length)];
  });
  const peek = () => cat.classList.toggle('up', window.scrollY > 500);
  window.addEventListener('scroll', peek, { passive: true });
  peek();
})();
