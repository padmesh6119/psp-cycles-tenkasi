const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

document.addEventListener('DOMContentLoaded', function () {
    initPageTransition();
    initSplitText();
    initScrollProgress();
    initNavigation();
    initReveal();
    initHero();
    initCounters();
    initBloom();
    initArchiveStrip();
    initGallery();
    initTimelineDraw();
    initCursor();
    initFormHandling();
    initScrollTop();
    initImageFallback();
    initMagnetic();

    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
});

/* ======================= Shared scroll dispatcher ======================== */
const scrollHandlers = [];
let ticking = false;

function onScroll(fn) {
    scrollHandlers.push(fn);
}

window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        const y = window.pageYOffset;
        scrollHandlers.forEach(fn => fn(y));
        ticking = false;
    });
}, { passive: true });

/* ============================ Page transition ============================ */
function initPageTransition() {
    if (REDUCED) return;

    const wipe = document.createElement('div');
    wipe.className = 'page-wipe';
    document.body.appendChild(wipe);
    setTimeout(() => wipe.remove(), 900);

    document.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (!/\.html($|[?#])/.test(href) || href.startsWith('http')) return;
        // same page, just an anchor
        if (href.split('#')[0] === location.pathname.split('/').pop()) return;

        e.preventDefault();
        const out = document.createElement('div');
        out.className = 'page-wipe leaving';
        document.body.appendChild(out);
        requestAnimationFrame(() => {
            out.classList.add('go');
            setTimeout(() => { location.href = href; }, 480);
        });
    });
}

/* ============================ Split text reveal ========================== */
function splitWords(root) {
    const walk = node => {
        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                if (!child.textContent.trim()) return;
                const frag = document.createDocumentFragment();
                child.textContent.split(/(\s+)/).forEach(tok => {
                    if (!tok) return;
                    if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
                    const outer = document.createElement('span');
                    outer.className = 'sw';
                    const inner = document.createElement('span');
                    inner.textContent = tok;
                    outer.appendChild(inner);
                    frag.appendChild(outer);
                });
                child.replaceWith(frag);
            } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains('sw')) {
                walk(child);
            }
        });
    };
    walk(root);
    return root.querySelectorAll('.sw > span');
}

function initSplitText() {
    const targets = document.querySelectorAll(
        '.section-header h2, .collection-header h1, .pull-quote blockquote, .legacy-info h3, .hero-title'
    );
    if (!targets.length) return;

    targets.forEach(el => {
        const words = splitWords(el);
        words.forEach((w, i) => w.style.setProperty('--d', (i * 0.045).toFixed(3) + 's'));
    });

    if (REDUCED) {
        targets.forEach(el => el.classList.add('split-in'));
        return;
    }

    const hero = document.querySelector('.hero-title');
    if (hero) setTimeout(() => hero.classList.add('split-in'), 180);

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('split-in');
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(el => { if (el !== hero) observer.observe(el); });
}

/* ------------------------------- Hero ----------------------------------- */
function initHero() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const bits = hero.querySelectorAll('.hero-eyebrow, .hero-tamil, .hero-subtitle, .hero-buttons, .hero-stats, .hero-scroll');
    bits.forEach((el, i) => el.style.setProperty('--d', (0.25 + i * 0.09).toFixed(2) + 's'));
    requestAnimationFrame(() => hero.classList.add('hero-ready'));

    if (REDUCED) return;

    const content = hero.querySelector('.hero-content');

    onScroll(y => {
        const h = hero.offsetHeight;
        if (y > h) return;
        const p = y / h;
        hero.style.setProperty('--hero-p', p.toFixed(4));
        if (content) {
            content.style.transform = `translate3d(0, ${y * 0.28}px, 0)`;
            content.style.opacity = String(Math.max(0, 1 - p * 1.5));
        }
    });

    // Ambient zoom on the backdrop, paused once the hero leaves the viewport.
    let t = 0, inView = true;
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(hero);

    const drift = () => {
        if (inView) {
            t += 0.0016;
            hero.style.setProperty('--hero-scale', (1.08 + Math.sin(t) * 0.035).toFixed(4));
        }
        requestAnimationFrame(drift);
    };
    drift();

    const style = document.createElement('style');
    style.textContent = '.hero::before{transform:scale(var(--hero-scale,1.08)) translate3d(0,calc(var(--hero-p,0) * 60px),0)}';
    document.head.appendChild(style);
}

/* ------------------------------ Scroll progress -------------------------- */
function initScrollProgress() {
    const bar = document.getElementById('progressBar');
    const cycle = document.getElementById('progressCycle');
    if (!bar) return;

    const update = y => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min((y / docHeight) * 100, 100) : 0;
        bar.style.width = pct + '%';
        if (cycle) cycle.style.left = `calc(${pct}% - 14px)`;
    };

    onScroll(update);
    update(window.pageYOffset);
}

/* --------------------------------- Navigation ---------------------------- */
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.getElementById('navbar');
    const progress = document.querySelector('.scroll-progress');
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }

    navLinks.forEach(link => link.addEventListener('click', () => {
        if (hamburger && navMenu) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }));

    let lastY = 0;

    onScroll(y => {
        if (navbar) navbar.classList.toggle('scrolled', y > 40);

        const menuOpen = navMenu && navMenu.classList.contains('active');
        const hide = !menuOpen && y > 400 && y > lastY + 4;
        const show = y < lastY - 4 || y < 400;

        if (navbar && (hide || show)) {
            navbar.classList.toggle('nav-hidden', hide);
            if (progress) progress.classList.toggle('nav-hidden', hide);
        }
        lastY = y;
    });

    const sections = navLinks
        .map(l => l.getAttribute('href'))
        .filter(h => h && h.startsWith('#'))
        .map(h => document.querySelector(h))
        .filter(Boolean);

    if (!sections.length) return;

    const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(s => spy.observe(s));
}

/* ------------------------------ Reveal on scroll ------------------------- */
function initReveal() {
    const items = document.querySelectorAll(
        '.reveal, .category-card, .service-card, .brand-card, .timeline-item, .contact-item, .gallery-item, .founder-facts li'
    );

    const wipes = document.querySelectorAll('.cycle-image, .model-image, .founder-portrait');
    wipes.forEach(el => el.classList.add('img-wipe'));

    if (REDUCED) {
        items.forEach(el => el.classList.add('reveal-in'));
        wipes.forEach(el => el.classList.add('in'));
        return;
    }

    items.forEach(el => el.classList.add('reveal-init'));

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.remove('reveal-init');
            entry.target.classList.add('reveal-in');
            obs.unobserve(entry.target);
            // the entrance delay must not leak into later FLIP moves
            if (entry.target.classList.contains('gallery-item')) {
                setTimeout(() => entry.target.style.setProperty('--d', '0s'), 1400);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

    items.forEach(el => {
        const i = Array.from(el.parentElement.children).indexOf(el);
        el.style.setProperty('--d', ((Math.max(0, i) % 8) * 0.07).toFixed(2) + 's');
        observer.observe(el);
    });

    const wipeObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('in');
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.15 });

    wipes.forEach(el => wipeObserver.observe(el));
}

/* ----------------------------- Timeline draw ----------------------------- */
function initTimelineDraw() {
    const timeline = document.querySelector('.timeline');
    if (!timeline) return;

    if (REDUCED) { timeline.style.setProperty('--tl', '1'); return; }

    onScroll(() => {
        const r = timeline.getBoundingClientRect();
        const start = window.innerHeight * 0.82;
        const p = (start - r.top) / (r.height + start - window.innerHeight * 0.35);
        timeline.style.setProperty('--tl', Math.max(0, Math.min(1, p)).toFixed(4));
    });
}

/* --------------------------------- Counters ------------------------------ */
function initCounters() {
    const counters = document.querySelectorAll('.stat-item h3[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.4 });

    counters.forEach(c => observer.observe(c));
}

function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (isNaN(target)) return;

    if (REDUCED) { el.textContent = target + suffix; return; }

    const duration = 1900;
    const start = performance.now();

    const step = now => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
}


/* ================================== BLOOM ================================ */
/* A single circular control that opens into a radial ring of every category. */
function initBloom() {
    const bloom = document.getElementById('bloom');
    const stage = document.getElementById('bloomStage');
    const core = document.getElementById('bloomCore');
    const section = document.querySelector('.cycles-section');
    const cards = Array.from(document.querySelectorAll('.category-card[data-slug]'));
    if (!bloom || !stage || !core || !section || !cards.length) return;

    section.classList.add('bloom-mode');

    // Petals live in their own layer so the layout can switch from a ring
    // to a grid on narrow screens without disturbing the core button.
    const ring = document.createElement('div');
    ring.className = 'bloom-ring';
    stage.appendChild(ring);

    // Build one petal per category, reusing each card's own image and title.
    const nodes = cards.map(card => {
        const slug = card.dataset.slug;
        const img = card.querySelector('.cycle-image img');
        const title = card.querySelector('h3');

        const a = document.createElement('a');
        a.className = 'bloom-node';
        a.href = slug + '.html';
        a.setAttribute('aria-label', title ? title.textContent.trim() : slug);
        a.tabIndex = -1;
        a.innerHTML =
            '<span class="bloom-node-disc">' +
                '<img src="' + (img ? img.getAttribute('src') : '') + '" alt="" loading="lazy">' +
            '</span>' +
            '<span class="bloom-node-label">' + (card.dataset.short || slug) + '</span>';

        ring.appendChild(a);
        return a;
    });

    // Lay the petals out on a circle, starting at twelve o'clock.
    function layout() {
        const r = parseFloat(getComputedStyle(bloom).getPropertyValue('--r')) || 290;
        const step = (Math.PI * 2) / nodes.length;
        nodes.forEach((node, i) => {
            const angle = -Math.PI / 2 + step * i;
            node.style.setProperty('--x', (Math.cos(angle) * r).toFixed(1) + 'px');
            node.style.setProperty('--y', (Math.sin(angle) * r).toFixed(1) + 'px');
        });
    }

    layout();
    window.addEventListener('resize', debounce(layout, 150));

    // Petals spring out from the top and around; they fold back in reverse.
    function stagger(opening) {
        nodes.forEach((node, i) => {
            const order = opening ? i : nodes.length - 1 - i;
            node.style.setProperty('--d', REDUCED ? '0s' : (order * 0.045).toFixed(3) + 's');
        });
    }

    let open = false;

    function setOpen(next) {
        open = next;
        stagger(open);
        bloom.classList.toggle('open', open);
        core.setAttribute('aria-expanded', String(open));
        nodes.forEach(n => { n.tabIndex = open ? 0 : -1; });
        if (open) {
            const first = nodes[0];
            if (first && FINE_POINTER === false) first.focus({ preventScroll: true });
        }
    }

    core.addEventListener('click', () => setOpen(!open));

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && open) { setOpen(false); core.focus(); }
    });

    // Clicking outside the ring folds it back up.
    document.addEventListener('click', e => {
        if (!open) return;
        if (stage.contains(e.target)) return;
        if (e.target.closest('.bloom-grid-toggle')) return;
        setOpen(false);
    });

    // Fallback view with the full feature lists.
    const toggle = document.getElementById('bloomGridToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const showing = section.classList.toggle('show-grid');
            toggle.textContent = showing ? 'Back to the wheel' : 'See full specifications';
            if (showing && open) setOpen(false);
        });
    }

}

function debounce(fn, ms) {
    let t;
    return function () {
        clearTimeout(t);
        t = setTimeout(fn, ms);
    };
}

/* ------------------------------ Archive strip ---------------------------- */
function initArchiveStrip() {
    const track = document.getElementById('stripTrack');
    if (!track) return;

    const picks = ['h000', 'h012', 'h001', 'h014', 'h003', 'h030', 'h015', 'h007', 'h038', 'h010', 'h009', 'h037', 'h005', 'h013'];
    const html = picks.map(id => `<img src="heritage/thumb/${id}.jpg" alt="" loading="lazy" data-open="${id}">`).join('');
    track.innerHTML = html + html;

    track.addEventListener('click', e => {
        const id = e.target.dataset && e.target.dataset.open;
        if (!id) return;
        const item = document.querySelector(`.gallery-item[data-full="heritage/full/${id}.jpg"]`);
        if (!item) return;
        document.getElementById('gallery').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
        setTimeout(() => item.click(), REDUCED ? 0 : 620);
    });

    if (REDUCED) return;

    // Scroll velocity feeds the marquee speed and direction.
    let offset = 0, half = 0, boost = 0, lastY = window.pageYOffset, paused = false;

    const measure = () => { half = track.scrollWidth / 2; };
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    measure();

    track.parentElement.addEventListener('mouseenter', () => { paused = true; });
    track.parentElement.addEventListener('mouseleave', () => { paused = false; });

    onScroll(y => {
        boost = Math.max(-14, Math.min(14, (y - lastY) * 0.22));
        lastY = y;
    });

    const loop = () => {
        if (!half) measure();
        const speed = (paused ? 0.06 : 0.55) + boost;
        offset -= speed;
        boost *= 0.93;
        if (half) {
            if (offset <= -half) offset += half;
            if (offset > 0) offset -= half;
        }
        track.style.transform = `translate3d(${offset.toFixed(2)}px,0,0)`;
        requestAnimationFrame(loop);
    };
    loop();
}

/* ================================= GALLERY =============================== */
function initGallery() {
    const grid = document.getElementById('galleryGrid');
    const lightbox = document.getElementById('lightbox');
    if (!grid || !lightbox) return;

    const allItems = Array.from(grid.querySelectorAll('.gallery-item'));
    const filters = Array.from(document.querySelectorAll('.filter-btn'));
    const lbImage = document.getElementById('lbImage');
    const lbEra = document.getElementById('lbEra');
    const lbTitle = document.getElementById('lbTitle');
    const lbDesc = document.getElementById('lbDesc');
    const lbCounter = document.getElementById('lbCounter');
    const lbFoot = document.querySelector('.lb-foot');

    let active = allItems.slice();
    let index = 0;
    let lastFocus = null;

    /* ---- FLIP filtering ---- */
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            filters.forEach(b => b.classList.toggle('active', b === btn));

            if (REDUCED) {
                allItems.forEach(it => it.classList.toggle('is-hidden', !(filter === 'all' || it.dataset.cat === filter)));
                active = allItems.filter(i => !i.classList.contains('is-hidden'));
                return;
            }

            const first = new Map();
            allItems.forEach(it => {
                if (!it.classList.contains('is-hidden')) first.set(it, it.getBoundingClientRect());
            });

            allItems.forEach(it => {
                it.classList.toggle('is-hidden', !(filter === 'all' || it.dataset.cat === filter));
            });

            allItems.forEach(it => {
                if (it.classList.contains('is-hidden')) return;
                const last = it.getBoundingClientRect();
                const f = first.get(it);

                it.classList.add('flipping');
                if (f) {
                    const dx = f.left - last.left;
                    const dy = f.top - last.top;
                    it.style.transform = `translate(${dx}px, ${dy}px)`;
                } else {
                    it.style.transform = 'scale(.92)';
                    it.style.opacity = '0';
                }

                requestAnimationFrame(() => {
                    it.classList.remove('flipping');
                    it.style.transform = '';
                    it.style.opacity = '';
                });
            });

            active = allItems.filter(i => !i.classList.contains('is-hidden'));
        });
    });

    /* ---- open ---- */
    allItems.forEach(item => {
        item.addEventListener('click', () => {
            active = allItems.filter(i => !i.classList.contains('is-hidden'));
            index = active.indexOf(item);
            if (index < 0) { active = allItems.slice(); index = allItems.indexOf(item); }
            open(item);
        });
    });

    function paint() {
        const item = active[index];
        if (!item) return;
        lbImage.src = item.dataset.full;
        lbImage.alt = item.dataset.title;
        lbEra.textContent = item.dataset.era || '';
        lbTitle.innerHTML = item.dataset.title || '';
        lbDesc.innerHTML = item.dataset.desc || '';
        lbCounter.textContent =
            String(index + 1).padStart(2, '0') + ' / ' + String(active.length).padStart(2, '0');
        preload(index + 1);
        preload(index - 1);
    }

    function preload(i) {
        if (!active.length) return;
        const item = active[(i + active.length) % active.length];
        if (item) { const img = new Image(); img.src = item.dataset.full; }
    }

    /* ---- shared-element zoom from the thumbnail ---- */
    function zoomFrom(thumbEl) {
        if (REDUCED || !thumbEl) return;
        const thumb = thumbEl.querySelector('img');
        if (!thumb) return;

        const from = thumb.getBoundingClientRect();

        const run = () => {
            const to = lbImage.getBoundingClientRect();
            if (!to.width || !to.height) return;

            const sx = from.width / to.width;
            const sy = from.height / to.height;
            const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
            const dy = (from.top + from.height / 2) - (to.top + to.height / 2);

            lbImage.classList.remove('zooming');
            lbImage.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
            lbImage.style.opacity = '0.6';

            requestAnimationFrame(() => {
                lbImage.classList.add('zooming');
                lbImage.style.transform = '';
                lbImage.style.opacity = '';
            });
        };

        if (lbImage.complete && lbImage.naturalWidth) run();
        else lbImage.addEventListener('load', run, { once: true });
    }

    function open(fromEl) {
        lastFocus = document.activeElement;
        paint();
        lightbox.classList.add('open');
        requestAnimationFrame(() => lightbox.classList.add('visible'));
        document.body.style.overflow = 'hidden';
        zoomFrom(fromEl);
        document.getElementById('lbClose').focus();
    }

    function close() {
        lightbox.classList.remove('visible');
        setTimeout(() => {
            lightbox.classList.remove('open');
            lbImage.src = '';
            lbImage.classList.remove('zooming');
            lbImage.style.transform = '';
            lbImage.style.opacity = '';
        }, 300);
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }

    let swapping = false;

    function move(step) {
        if (!active.length || swapping) return;
        index = (index + step + active.length) % active.length;

        if (REDUCED) { paint(); return; }

        swapping = true;
        const out = step > 0 ? -36 : 36;
        const IN = step > 0 ? 36 : -36;

        // slide the current frame out
        lbImage.classList.add('zooming');
        lbImage.style.transform = `translateX(${out}px)`;
        lbImage.style.opacity = '0';
        if (lbFoot) lbFoot.classList.add('swapping');

        setTimeout(() => {
            paint();                                  // swap src while fully hidden
            lbImage.classList.remove('zooming');      // jump to the entry position
            lbImage.style.transform = `translateX(${IN}px)`;

            requestAnimationFrame(() => {
                lbImage.classList.add('zooming');
                lbImage.style.transform = '';
                lbImage.style.opacity = '';
                if (lbFoot) lbFoot.classList.remove('swapping');
                setTimeout(() => { swapping = false; }, 240);
            });
        }, 240);
    }

    document.getElementById('lbClose').addEventListener('click', close);
    document.getElementById('lbPrev').addEventListener('click', e => { e.stopPropagation(); move(-1); });
    document.getElementById('lbNext').addEventListener('click', e => { e.stopPropagation(); move(1); });

    lightbox.addEventListener('click', e => {
        if (e.target === lightbox || e.target.classList.contains('lb-stage')) close();
    });

    document.addEventListener('keydown', e => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight') move(1);
        else if (e.key === 'ArrowLeft') move(-1);
    });

    let touchX = null;
    lightbox.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', e => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
        touchX = null;
    }, { passive: true });
}

/* ------------------------------ Custom cursor ---------------------------- */
function initCursor() {
    if (REDUCED || !FINE_POINTER) return;
    if (!document.querySelector('.gallery-item')) return;

    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.textContent = 'View';
    document.body.appendChild(cursor);

    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let cx = x, cy = y;

    window.addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; }, { passive: true });

    const loop = () => {
        cx += (x - cx) * 0.18;
        cy += (y - cy) * 0.18;
        cursor.style.left = cx.toFixed(1) + 'px';
        cursor.style.top = cy.toFixed(1) + 'px';
        requestAnimationFrame(loop);
    };
    loop();

    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('mouseenter', () => cursor.classList.add('on'));
        item.addEventListener('mouseleave', () => cursor.classList.remove('on'));
    });

    document.querySelectorAll('.strip-track').forEach(track => {
        track.addEventListener('mouseenter', () => cursor.classList.add('on'));
        track.addEventListener('mouseleave', () => cursor.classList.remove('on'));
    });
}

/* --------------------------- Magnetic buttons ---------------------------- */
function initMagnetic() {
    if (REDUCED || !FINE_POINTER) return;

    document.querySelectorAll('.btn, .lb-nav, .scroll-top-btn, .lb-close').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            const mx = e.clientX - r.left - r.width / 2;
            const my = e.clientY - r.top - r.height / 2;
            btn.style.transform = `translate(${(mx * 0.18).toFixed(1)}px, ${(my * 0.28).toFixed(1)}px)`;
        });

        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
}

/* ---------------------------------- Form --------------------------------- */
function initFormHandling() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));

        if (validateForm(data)) {
            showNotification('Thank you — your message has reached us. We will get back to you shortly.', 'success');
            form.reset();
        } else {
            showNotification('Please fill in your name, a valid email, and a message.', 'error');
        }
    });

    form.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => { if (input.classList.contains('error')) validateField(input); });
    });
}

function validateForm(data) {
    let valid = true;

    ['name', 'email', 'message'].forEach(field => {
        if (!data[field] || !data[field].trim()) {
            valid = false;
            const input = document.querySelector(`[name="${field}"]`);
            if (input) input.classList.add('error');
        }
    });

    if (data.email && !isValidEmail(data.email)) {
        valid = false;
        const input = document.querySelector('[name="email"]');
        if (input) input.classList.add('error');
    }

    return valid;
}

function validateField(field) {
    const value = field.value.trim();
    field.classList.remove('error');

    if (['name', 'email', 'message'].includes(field.name) && !value) {
        field.classList.add('error');
        return false;
    }
    if (field.name === 'email' && value && !isValidEmail(value)) {
        field.classList.add('error');
        return false;
    }
    return true;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ------------------------------ Notifications ---------------------------- */
function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.innerHTML = `<div class="notification-content"><span>${message}</span><button class="notification-close" aria-label="Dismiss">&times;</button></div>`;
    document.body.appendChild(note);

    requestAnimationFrame(() => note.classList.add('show'));

    const dismiss = () => {
        note.classList.remove('show');
        setTimeout(() => note.remove(), 400);
    };

    note.querySelector('.notification-close').addEventListener('click', dismiss);
    setTimeout(dismiss, 5500);
}

/* --------------------------- Broken image guard -------------------------- */
function initImageFallback() {
    document.querySelectorAll('.cycle-image img, .model-image img').forEach(img => {
        const fail = () => img.parentElement.classList.add('img-failed');
        img.addEventListener('error', fail);
        if (img.complete && img.naturalWidth === 0) fail();
    });
}

/* ------------------------------ Scroll to top ---------------------------- */
function initScrollTop() {
    const btn = document.createElement('button');
    btn.className = 'scroll-top-btn';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(btn);

    onScroll(y => btn.classList.toggle('show', y > 600));

    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }));
}
