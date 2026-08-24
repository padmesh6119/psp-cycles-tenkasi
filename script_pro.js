document.addEventListener('DOMContentLoaded', function () {
    initScrollProgress();
    initNavigation();
    initReveal();
    initCounters();
    initArchiveStrip();
    initGallery();
    initFormHandling();
    initScrollTop();
    initImageFallback();

    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
});

/* ------------------------------- Scroll progress ------------------------ */
function initScrollProgress() {
    const bar = document.getElementById('progressBar');
    const cycle = document.getElementById('progressCycle');
    if (!bar) return;

    const update = () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min((window.pageYOffset / docHeight) * 100, 100) : 0;
        bar.style.width = pct + '%';
        if (cycle) cycle.style.left = `calc(${pct}% - 14px)`;
    };

    window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    update();
}

/* --------------------------------- Navigation --------------------------- */
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.getElementById('navbar');
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

    window.addEventListener('scroll', () => {
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    // Scrollspy
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

/* ------------------------------ Reveal on scroll ------------------------ */
function initReveal() {
    const items = document.querySelectorAll('.reveal, .category-card, .service-card, .brand-card, .timeline-item, .contact-item, .gallery-item');
    if (!items.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'none';
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    items.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(22px)';
        el.style.transition = `opacity .7s cubic-bezier(.22,.61,.36,1) ${(i % 8) * 0.06}s, transform .7s cubic-bezier(.22,.61,.36,1) ${(i % 8) * 0.06}s`;
        observer.observe(el);
    });
}

/* --------------------------------- Counters ----------------------------- */
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

    const duration = 1400;
    const start = performance.now();

    const step = now => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
}

/* ------------------------------ Archive strip --------------------------- */
function initArchiveStrip() {
    const track = document.getElementById('stripTrack');
    if (!track) return;

    const picks = ['h000', 'h012', 'h001', 'h014', 'h003', 'h030', 'h015', 'h007', 'h038', 'h010', 'h009', 'h037', 'h005', 'h013'];
    const html = picks.map(id =>
        `<img src="heritage/thumb/${id}.jpg" alt="" loading="lazy" data-open="${id}">`
    ).join('');

    track.innerHTML = html + html;

    track.addEventListener('click', e => {
        const id = e.target.dataset && e.target.dataset.open;
        if (!id) return;
        const item = document.querySelector(`.gallery-item[data-full="heritage/full/${id}.jpg"]`);
        if (item) {
            document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => item.click(), 500);
        }
    });
}

/* ================================ GALLERY =============================== */
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

    let active = allItems.slice();
    let index = 0;
    let lastFocus = null;

    /* -- filtering -- */
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            filters.forEach(b => b.classList.toggle('active', b === btn));
            allItems.forEach(item => {
                const show = filter === 'all' || item.dataset.cat === filter;
                item.classList.toggle('is-hidden', !show);
            });
            active = allItems.filter(i => !i.classList.contains('is-hidden'));
        });
    });

    /* -- open -- */
    allItems.forEach(item => {
        item.addEventListener('click', () => {
            active = allItems.filter(i => !i.classList.contains('is-hidden'));
            index = active.indexOf(item);
            if (index < 0) { active = allItems.slice(); index = allItems.indexOf(item); }
            open();
        });
    });

    function render() {
        const item = active[index];
        if (!item) return;
        lbImage.src = item.dataset.full;
        lbImage.alt = item.dataset.title;
        lbEra.textContent = item.dataset.era || '';
        lbTitle.innerHTML = item.dataset.title || '';
        lbDesc.innerHTML = item.dataset.desc || '';
        lbCounter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(active.length).padStart(2, '0');
        preload(index + 1);
        preload(index - 1);
    }

    function preload(i) {
        const item = active[(i + active.length) % active.length];
        if (item) { const img = new Image(); img.src = item.dataset.full; }
    }

    function open() {
        lastFocus = document.activeElement;
        render();
        lightbox.classList.add('open');
        requestAnimationFrame(() => lightbox.classList.add('visible'));
        document.body.style.overflow = 'hidden';
        document.getElementById('lbClose').focus();
    }

    function close() {
        lightbox.classList.remove('visible');
        setTimeout(() => {
            lightbox.classList.remove('open');
            lbImage.src = '';
        }, 300);
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }

    function move(step) {
        index = (index + step + active.length) % active.length;
        render();
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

    /* -- swipe -- */
    let touchX = null;
    lightbox.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', e => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
        touchX = null;
    }, { passive: true });
}

/* -------------------------------- Form ---------------------------------- */
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

/* ----------------------------- Notifications ---------------------------- */
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

/* --------------------------- Broken image guard ------------------------- */
function initImageFallback() {
    document.querySelectorAll('.cycle-image img, .model-image img').forEach(img => {
        const fail = () => img.parentElement.classList.add('img-failed');
        img.addEventListener('error', fail);
        if (img.complete && img.naturalWidth === 0) fail();
    });
}

/* ------------------------------ Scroll to top --------------------------- */
function initScrollTop() {
    const btn = document.createElement('button');
    btn.className = 'scroll-top-btn';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        btn.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });

    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
