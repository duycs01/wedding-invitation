'use strict';

/* ==========================================================
   CẤU HÌNH
   ========================================================== */

const CONFIG = {
    weddingDate: new Date('2026-11-29T18:00:00+07:00'),

    storageKeys: {
        wishes: 'wedding-duy-giang-wishes',
        rsvp: 'wedding-duy-giang-rsvp'
    },

    maxWishes: 100,

    gifts: [
        {
            key: 'groom',
            person: 'Lê Văn Duy',
            account: '817031',
            owner: 'LE VAN DUY',
            bankBin: 'ACB'
        },
        {
            key: 'bride',
            person: 'Hoàng Linh Giang',
            account: '19029383359014',
            owner: 'HOANG LINH GIANG',
            bankBin: '970407'
        }
    ],

    autoScrollSpeed: 55,
    autoScrollDelay: 3000,
    autoScrollOnOpen: 'auto'
};


/* ==========================================================
   TIỆN ÍCH
   ========================================================== */

const $ = (selector, root = document) =>
    root.querySelector(selector);

const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = {
    read(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    },

    write(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch {
            return false;
        }
    }
};

function setStatus(container, text) {
    if (!container) return;

    let el = $('.formStatus', container);

    if (!el) {
        el = document.createElement('p');
        el.className = 'formStatus';
        el.setAttribute('role', 'status');
        container.append(el);
    }

    el.textContent = text;
}


/* ==========================================================
   PHẦN TỬ CHÍNH
   ========================================================== */

const main = $('main');
const cover = $('.cover');
const paper = $('.paper');
const quickNav = $('.quick-nav');
const audio = $('audio');

const musicButtons = [
    $('#music-toggle'),
    $('[data-invitation-music-toggle]')
].filter(Boolean);

const floatingControls =
    $('[data-auto-scroll-toggle]')?.parentElement;

const rsvpShortcut =
    $('[data-invitation-rsvp="shortcut"]');

if (floatingControls) {
    floatingControls.style.display = 'none';
}

if (rsvpShortcut) {
    rsvpShortcut.style.display = 'none';
}


/* ==========================================================
   NHẠC NỀN
   ========================================================== */

function syncMusicUI() {
    if (!audio) return;

    const playing = !audio.paused;

    musicButtons.forEach(btn => {
        if (btn.id === 'music-toggle') {
            btn.textContent = playing ? '♫' : '♪';
        } else {
            const label = playing ? 'Tắt nhạc' : 'Phát nhạc';

            btn.setAttribute('aria-label', label);
            btn.setAttribute('title', label);

            btn.style.background =
                playing ? '#607B5B' : '#3f3f46';

            const status = $('[role="status"]', btn);

            if (status) {
                status.textContent =
                    playing ? 'Đang phát nhạc' : 'Đã tắt nhạc';
            }
        }

        btn.setAttribute('aria-pressed', String(playing));
    });
}

async function toggleMusic() {
    if (!audio) return;

    musicButtons.forEach(btn => {
        btn.setAttribute('aria-busy', 'true');
    });

    try {
        if (!audio.paused) {
            audio.pause();
        } else {
            await audio.play();
        }
    } catch {
        // Trình duyệt có thể chặn phát nhạc.
    } finally {
        musicButtons.forEach(btn => {
            btn.setAttribute('aria-busy', 'false');
        });

        syncMusicUI();
    }
}

audio?.addEventListener('play', syncMusicUI);
audio?.addEventListener('pause', syncMusicUI);

musicButtons.forEach(btn => {
    btn.addEventListener('click', toggleMusic);
});

syncMusicUI();


/* ==========================================================
   HIỆU ỨNG REVEAL THEO SCROLL
   ========================================================== */

const reveal = {
    observer: null,
    revealed: new WeakSet(),

    effects: {
        rise: [
            {
                opacity: 0,
                transform: 'translate3d(0, 26px, 0)'
            },
            {
                opacity: 1,
                transform: 'translate3d(0, 0, 0)'
            }
        ],

        fade: [
            { opacity: 0 },
            { opacity: 1 }
        ],

        zoom: [
            {
                opacity: 0,
                transform: 'scale(0.94)'
            },
            {
                opacity: 1,
                transform: 'scale(1)'
            }
        ],

        left: [
            {
                opacity: 0,
                transform: 'translate3d(-24px, 0, 0)'
            },
            {
                opacity: 1,
                transform: 'translate3d(0, 0, 0)'
            }
        ],

        right: [
            {
                opacity: 0,
                transform: 'translate3d(24px, 0, 0)'
            },
            {
                opacity: 1,
                transform: 'translate3d(0, 0, 0)'
            }
        ]
    },

    init(root) {
        if (!root) return;

        this.observer?.disconnect();
        this.revealed = new WeakSet();

        const elements = [];

        if (root.matches?.('[data-invitation-reveal]')) {
            elements.push(root);
        }

        elements.push(
            ...root.querySelectorAll('[data-invitation-reveal]')
        );

        if (
            prefersReducedMotion() ||
            !('IntersectionObserver' in window) ||
            !Element.prototype.animate
        ) {
            elements.forEach(element => {
                element.style.opacity = '1';
            });

            return;
        }

        this.observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const element = entry.target;

                this.observer.unobserve(element);

                const waitForImages =
                    element.hasAttribute(
                        'data-invitation-reveal-wait-for-images'
                    );

                if (waitForImages) {
                    this.waitForImages(element).then(() => {
                        this.play(element);
                    });
                } else {
                    this.play(element);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });

        elements.forEach(element => {
            this.observe(element);
        });
    },

    observe(element) {
        if (!element || !this.observer) return;

        if (this.revealed.has(element)) return;

        if (prefersReducedMotion()) {
            element.style.opacity = '1';
            return;
        }

        element.style.opacity = '0';

        this.observer.observe(element);
    },

    async waitForImages(root) {
        if (!root) return;

        const images = [
            ...(root.matches?.('img') ? [root] : []),
            ...root.querySelectorAll('img')
        ];

        await Promise.all(
            images.map(image => {
                if (image.complete) {
                    return image.decode?.().catch(() => { });
                }

                return new Promise(resolve => {
                    image.addEventListener('load', resolve, {
                        once: true
                    });

                    image.addEventListener('error', resolve, {
                        once: true
                    });
                });
            })
        );
    },

    play(element) {
        if (!element || this.revealed.has(element)) return;

        this.revealed.add(element);

        if (prefersReducedMotion()) {
            element.style.opacity = '1';
            return;
        }

        const kind = element.dataset.invitationReveal || 'rise';

        const keyframes =
            this.effects[kind] || this.effects.rise;

        const delay = Math.max(
            0,
            Number(element.dataset.invitationRevealDelay) || 0
        );

        const animation = element.animate(keyframes, {
            duration: kind === 'fade' ? 900 : 760,
            delay,
            easing: 'cubic-bezier(0.2, 0.65, 0.3, 1)',
            fill: 'both'
        });

        animation.onfinish = () => {
            // Giữ trạng thái cuối cùng sau khi animation kết thúc.
            element.style.opacity = '1';

            if (kind === 'rise' || kind === 'left' || kind === 'right') {
                element.style.transform = 'translate3d(0, 0, 0)';
            }

            if (kind === 'zoom') {
                element.style.transform = 'scale(1)';
            }

            animation.cancel();
        };
    }
};


/* ==========================================================
   HỖ TRỢ DATA-PAPER-REVEAL CŨ
   ========================================================== */

function initPaperReveal() {
    $$('[data-paper-reveal="true"]').forEach(element => {
        if (!element.hasAttribute('data-invitation-reveal')) {
            element.setAttribute('data-invitation-reveal', 'rise');
        }
    });
}


/* ==========================================================
   TỰ ĐỘNG CUỘN
   ========================================================== */

const autoScroll = {
    button: $('[data-auto-scroll-toggle]'),

    mode: null,
    running: false,
    rafId: 0,
    timerId: 0,
    lastTime: 0,
    expectedY: 0,

    icons: {
        pause: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="14" y="3" width="5" height="18" rx="1"></rect><rect x="5" y="3" width="5" height="18" rx="1"></rect></svg>',

        play: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>'
    },

    isDialogOpen() {
        return !!document.querySelector(
            'dialog[open], [role="dialog"][aria-modal="true"], .yarl__root'
        );
    },

    updateUI() {
        const btn = this.button;
        if (!btn) return;

        const active = this.mode !== null;

        const label = active
            ? 'Tắt tự động cuộn'
            : 'Bật tự động cuộn';

        btn.type = 'button';
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);

        btn.style.background =
            active ? '#607B5B' : '#3f3f46';

        btn.innerHTML =
            active ? this.icons.pause : this.icons.play;
    },

    tick(time) {
        const s = autoScroll;

        if (!s.running) return;

        const dt = Math.min(
            0.1,
            (time - s.lastTime) / 1000
        );

        s.lastTime = time;

        if (s.isDialogOpen()) {
            s.rafId = requestAnimationFrame(s.tick);
            return;
        }

        const maxScroll =
            document.documentElement.scrollHeight -
            window.innerHeight;

        if (
            maxScroll <= 0 ||
            window.scrollY >= maxScroll - 2
        ) {
            s.stop();
            return;
        }

        const step = Math.min(
            CONFIG.autoScrollSpeed * dt,
            Math.max(0, maxScroll - window.scrollY)
        );

        s.expectedY = window.scrollY + step;

        window.scrollBy({
            top: step,
            left: 0,
            behavior: 'instant'
        });

        s.rafId = requestAnimationFrame(s.tick);
    },

    begin() {
        if (this.running || this.mode === null) return;

        this.running = true;
        this.lastTime = performance.now();
        this.expectedY = window.scrollY;

        this.rafId = requestAnimationFrame(this.tick);
    },

    setMode(mode) {
        this.running = false;

        cancelAnimationFrame(this.rafId);
        clearTimeout(this.timerId);

        if (mode && prefersReducedMotion()) {
            mode = null;
        }

        this.mode = mode;
        this.updateUI();

        if (mode === 'manual') {
            this.begin();
        } else if (mode === 'auto') {
            this.timerId = window.setTimeout(() => {
                this.begin();
            }, CONFIG.autoScrollDelay);
        }
    },

    start() {
        this.setMode('manual');
    },

    stop() {
        this.setMode(null);
    },

    toggle() {
        this.mode ? this.stop() : this.start();
    },

    handleUserInput(event) {
        const target = event && event.target;

        if (
            target instanceof Element &&
            target.closest('[data-auto-scroll-toggle]')
        ) {
            return;
        }

        if (autoScroll.mode) {
            autoScroll.stop();
        }
    },

    handleScroll() {
        if (
            autoScroll.running &&
            Math.abs(window.scrollY - autoScroll.expectedY) > 3
        ) {
            autoScroll.stop();
        }
    }
};

autoScroll.button?.addEventListener('click', () => {
    autoScroll.toggle();
});

['wheel', 'touchstart', 'touchmove', 'pointerdown'].forEach(type => {
    window.addEventListener(
        type,
        autoScroll.handleUserInput,
        { passive: true }
    );
});

window.addEventListener('keydown', autoScroll.handleUserInput);

window.addEventListener(
    'scroll',
    autoScroll.handleScroll,
    { passive: true }
);

autoScroll.updateUI();


/* ==========================================================
   SCENE
   ========================================================== */

function initScene() {
    const scene = $('.gardenScene');

    if (!scene) return;

    scene.dataset.animate = 'true';
    scene.dataset.ready = 'false';

    const hero = scene.closest(
        '[data-invitation-reveal-group="hero"]'
    );

    reveal.waitForImages(hero || scene).then(() => {
        scene.dataset.ready = 'true';
    });
}


/* ==========================================================
   MỞ THIỆP
   ========================================================== */

const root = $('[data-invitation-root]');
const coverButton = $('.coverButton');

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.addEventListener('load', () => {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
    });
});

function openInvitation(event) {
    event?.preventDefault();

    if (
        !cover ||
        !cover.isConnected ||
        cover.classList.contains('coverOpening')
    ) {
        return;
    }

    coverButton?.setAttribute('aria-disabled', 'true');

    cover.classList.add('coverOpening');

    const delay = prefersReducedMotion() ? 0 : 700;

    window.setTimeout(() => {
        if (paper) {
            paper.hidden = false;
        }

        cover.remove();

        if (main) {
            main.dataset.invitationOpen = 'true';
        }

        if (root) {
            root.dataset.invitationShell = 'open';
        }

        if (floatingControls) {
            floatingControls.style.display = '';
        }

        if (rsvpShortcut) {
            rsvpShortcut.style.display = '';
        }
 
        requestAnimationFrame(() => {
            initScene();

            initPaperReveal();

            reveal.init(paper);
        });

        audio?.play().catch(() => { }).finally(syncMusicUI);

        window.scrollTo(0, 0);

        autoScroll.setMode(CONFIG.autoScrollOnOpen);

    }, delay);
}

coverButton?.addEventListener('click', openInvitation);


/* ==========================================================
   HỘP THOẠI DÙNG CHUNG
   ========================================================== */

function setupDialog(dialog, openers = []) {
    if (!dialog) return null;

    const open = () => {
        if (dialog.open) return;
        dialog.showModal();
    };

    const close = () => {
        if (dialog.open) {
            dialog.close();
        }
    };

    openers.filter(Boolean).forEach(el => {
        el.setAttribute('aria-haspopup', 'dialog');
        el.addEventListener('click', open);
    });

    $('.closeDialog', dialog)?.addEventListener('click', close);

    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;

        const rect = dialog.getBoundingClientRect();

        const outside =
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom;

        if (outside) close();
    });

    dialog.addEventListener('close', () => {
        document.body.style.overflow = '';
    });

    const originalShow = dialog.showModal.bind(dialog);

    dialog.showModal = () => {
        document.body.style.overflow = 'hidden';
        originalShow();
    };

    return { open, close };
}


/* ==========================================================
   HỘP MỪNG CƯỚI
   ========================================================== */

const giftSection = $('#mm-gift');

const giftDialog = $('.giftDialog', giftSection || document);

setupDialog(
    giftDialog,
    [$('.giftButton', giftSection || document)]
);

(function initGift() {
    if (!giftDialog) return;

    const tabs = $$('.giftTabs button', giftDialog);

    const personEl = $('.giftPerson', giftDialog);
    const accountEl = $('.bankAccount', giftDialog);
    const ownerEl = $('.bankOwner', giftDialog);

    const qrMissing = $('.qrMissing', giftDialog);
    const copyBtn = $('.textButton', giftDialog);
    const statusEl = $('.formStatus', giftDialog);

    let qrImage = null;
    let current = CONFIG.gifts[0];

    function renderQr(info) {
        qrImage?.remove();
        qrImage = null;

        if (!qrMissing) return;

        if (!info.bankBin) {
            qrMissing.hidden = false;
            return;
        }

        const url =
            `https://img.vietqr.io/image/${info.bankBin}-${info.account}-compact2.png` +
            `?accountName=${encodeURIComponent(info.owner)}`;

        qrImage = document.createElement('img');

        qrImage.className = 'giftQr';
        qrImage.alt = `Mã QR chuyển khoản cho ${info.person}`;

        qrImage.width = 220;
        qrImage.height = 220;
        qrImage.loading = 'lazy';

        qrImage.addEventListener('error', () => {
            qrImage?.remove();
            qrImage = null;

            qrMissing.hidden = false;
        });

        qrImage.addEventListener('load', () => {
            qrMissing.hidden = true;
        });

        qrImage.src = url;

        qrMissing.before(qrImage);
    }

    function selectGift(index) {
        current = CONFIG.gifts[index] || CONFIG.gifts[0];

        tabs.forEach((tab, i) => {
            tab.setAttribute('aria-pressed', String(i === index));
        });

        if (personEl) personEl.textContent = current.person;
        if (accountEl) accountEl.textContent = current.account;
        if (ownerEl) ownerEl.textContent = current.owner;

        if (qrMissing) {
            qrMissing.hidden = false;
        }

        renderQr(current);

        if (statusEl) {
            statusEl.textContent = '';
        }
    }

    tabs.forEach((tab, index) => {
        tab.type = 'button';

        tab.addEventListener('click', () => {
            selectGift(index);
        });
    });

    async function copyText(text) {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const temp = document.createElement('textarea');

        temp.value = text;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';

        document.body.append(temp);

        temp.select();

        const ok = document.execCommand('copy');

        temp.remove();

        if (!ok) {
            throw new Error('copy failed');
        }
    }

    copyBtn?.addEventListener('click', async () => {
        try {
            await copyText(current.account);

            if (statusEl) {
                statusEl.textContent =
                    `Đã sao chép số tài khoản của ${current.person}.`;
            }
        } catch {
            if (statusEl) {
                statusEl.textContent =
                    'Không sao chép được, bạn vui lòng chép thủ công nhé.';
            }
        }
    });

    giftDialog.addEventListener('close', () => {
        selectGift(0);
    });

    selectGift(0);
})();



/* ==========================================================
   XÁC NHẬN THAM GIA (RSVP) - GOOGLE SHEETS
   ========================================================== */

const rsvpDialog = $('#mm-rsvp-dialog');

setupDialog(rsvpDialog, [rsvpShortcut]);

const rsvpForm = $('form', rsvpDialog || document);

let isSubmittingRsvp = false;

rsvpForm?.addEventListener('submit', async event => {
    event.preventDefault();

    if (isSubmittingRsvp) return;

    const form = event.currentTarget;

    const name = form.elements.name.value.trim();
    const guests = Number(form.elements.guests.value);

    const statusTarget = form.closest('.rsvpLetter');

    // Kiểm tra tên
    if (!name) {
        return setStatus(
            statusTarget,
            'Vui lòng nhập tên của bạn.'
        );
    }

    // Kiểm tra số lượng khách
    if (
        !Number.isInteger(guests) ||
        guests < 1 ||
        guests > 10
    ) {
        return setStatus(
            statusTarget,
            'Số người tham dự từ 1 đến 10.'
        );
    }

    isSubmittingRsvp = true;

    const submitButton = $('button[type="submit"]', form);

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const params = new URLSearchParams();

        params.append('action', 'rsvp');
        params.append('name', name);
        params.append('guests', String(guests));

        await fetch(WISH_API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: params
        });

        form.reset();

        setStatus(
            statusTarget,
            'Đã gửi yêu cầu xác nhận tham dự. Cảm ơn bạn!'
        );

        console.log('[RSVP] Request sent:', {
            name,
            guests
        });

    } catch (error) {
        console.error('[RSVP] Error:', error);

        setStatus(
            statusTarget,
            'Không thể gửi xác nhận. Vui lòng thử lại.'
        );

    } finally {
        isSubmittingRsvp = false;

        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});



/* ==========================================================
   ĐẾM NGƯỢC NGÀY CƯỚI
   ========================================================== */

const countdownValues = $$('.countdown strong');

function updateCountdown() {
    const total = Math.max(
        0,
        Math.floor((CONFIG.weddingDate - new Date()) / 1000)
    );

    const values = [
        Math.floor(total / 86400),
        Math.floor(total / 3600) % 24,
        Math.floor(total / 60) % 60,
        total % 60
    ];

    countdownValues.forEach((el, i) => {
        el.textContent = String(values[i]).padStart(2, '0');
    });
}

updateCountdown();

setInterval(updateCountdown, 1000);


/* ==========================================================
   SỔ LƯU BÚT - GOOGLE SHEETS
   ========================================================== */

// URL Web App Google Apps Script
const WISH_API_URL = 'https://script.google.com/macros/s/AKfycbwbEAjULdwlZVAzwoxn0hEcTooIXHpLof3C2JfCYf7EZulBhA1MREoXLysesXbnaAKH/exec';

// DOM
const wishesSection = $('#mm-wishes');
const wishesForm = $('form', wishesSection || document);

const wishesCounter = $(
    '.formBottom > span',
    wishesForm || document
);

const emptyNote = $('.emptyNote', wishesSection || document);

const wishList = $(
    '[data-wish-list]',
    wishesSection || document
);

const wishesInput = wishesForm?.elements.name;
const wishesMessage = wishesForm?.elements.message;

// Dữ liệu lấy từ Google Sheets
let wishes = [];

// Trạng thái gửi
let isSubmittingWish = false;


/* ==========================================================
   LẤY DANH SÁCH LỜI CHÚC
   ========================================================== */

function loadWishes() {
    if (!wishList) return;

    const callbackName =
        '__wishesCallback_' + Date.now() +
        '_' + Math.random().toString(36).slice(2);

    const script = document.createElement('script');

    const cleanup = () => {
        delete window[callbackName];
        script.remove();
    };

    const timeout = setTimeout(() => {
        cleanup();
        setStatus(
            wishesForm,
            'Không thể tải danh sách lời chúc.'
        );
    }, 15000);

    window[callbackName] = result => {
        clearTimeout(timeout);
        cleanup();

        if (!result || result.result !== 'success') {
            setStatus(
                wishesForm,
                'Không thể tải lời chúc từ máy chủ.'
            );
            return;
        }

        wishes = Array.isArray(result.wishes)
            ? result.wishes
            : [];

        renderWishes();
    };

    script.onerror = error => {
        clearTimeout(timeout);
        cleanup();

        setStatus(
            wishesForm,
            'Lỗi kết nối đến máy chủ lời chúc.'
        );
    };

    script.src =
        WISH_API_URL +
        '?limit=' + CONFIG.maxWishes +
        '&callback=' + callbackName;

    document.head.appendChild(script);
}


wishList?.addEventListener('wheel', event => {
    const hasVerticalScroll =
        wishList.scrollHeight > wishList.clientHeight;

    if (!hasVerticalScroll) return;

    const atTop = wishList.scrollTop <= 0;
    const atBottom =
        wishList.scrollTop + wishList.clientHeight >=
        wishList.scrollHeight - 1;

    // Đã cuộn đến đầu hoặc cuối thì cho trang bên ngoài cuộn tiếp
    if (
        (event.deltaY < 0 && atTop) ||
        (event.deltaY > 0 && atBottom)
    ) {
        event.preventDefault();
        window.scrollBy({
            top: event.deltaY,
            behavior: 'auto'
        });
    }
}, { passive: false });


/* ==========================================================
   HIỂN THỊ LỜI CHÚC
   ========================================================== */

function renderWishes() {
    if (!wishList) return;

    wishList.replaceChildren();

    if (emptyNote) {
        emptyNote.hidden = wishes.length > 0;
    }

    wishes.forEach(wish => {
        const entry = document.createElement('article');

        entry.className = 'wish-entry';
        entry.dataset.invitationReveal = 'rise';

        const pin = document.createElement('span');
        pin.className = 'wish-pin';

        const message = document.createElement('p');

        // Dùng textContent để tránh chèn HTML không an toàn
        message.textContent = String(wish.message || '');

        const author = document.createElement('footer');

        author.textContent =
            '— ' + String(wish.name || 'Ẩn danh');

        entry.append(pin, message, author);

        wishList.append(entry);

        if (main?.dataset.invitationOpen === 'true') {
            reveal.observe(entry);
        }
    });
}


/* ==========================================================
   BỘ ĐẾM KÝ TỰ
   ========================================================== */

function updateCounter() {
    if (!wishesMessage || !wishesCounter) return;

    wishesCounter.textContent =
        `${wishesMessage.value.length}/500`;
}

wishesMessage?.addEventListener('input', updateCounter);


/* ==========================================================
   GỬI LỜI CHÚC LÊN GOOGLE SHEETS
   ========================================================== */

wishesForm?.addEventListener('submit', async event => {
    event.preventDefault();

    if (!wishesInput || !wishesMessage) return;

    if (isSubmittingWish) return;

    const name = wishesInput.value.trim();
    const message = wishesMessage.value.trim();

    if (!name || !message) {
        return setStatus(
            wishesForm,
            'Vui lòng nhập tên và lời chúc.'
        );
    }

    if (name.length > 100 || message.length > 500) {
        return setStatus(
            wishesForm,
            'Tên hoặc lời chúc vượt quá giới hạn cho phép.'
        );
    }

    isSubmittingWish = true;

    const submitButton = $(
        'button[type="submit"]',
        wishesForm
    );

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const params = new URLSearchParams();

        params.append('action', 'wish');
        params.append('name', name);
        params.append('message', message);

        setStatus(
            wishesForm,
            'Đang gửi lời chúc, vui lòng chờ...'
        );

        // no-cors: gửi request cross-origin mà không cần đọc response
        await fetch(WISH_API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: params
        });

        // Không thể đọc response ở chế độ no-cors.
        // Tải lại danh sách để kiểm tra dữ liệu đã được ghi.
        wishesForm.reset();
        updateCounter();

        setStatus(
            wishesForm,
            'Đã gửi lời chúc. Cảm ơn bạn!'
        );

        setTimeout(() => {
            loadWishes();
        }, 1000);

    } catch (error) {
        console.error('Submit wish error:', error);

        setStatus(
            wishesForm,
            'Không thể gửi lời chúc. Vui lòng thử lại.'
        );

    } finally {
        isSubmittingWish = false;

        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});


/* ==========================================================
   KHỞI TẠO
   ========================================================== */

updateCounter();
loadWishes();


/* ==========================================================
   TỰ MỞ THIỆP KHI CÓ ?open=1
   ========================================================== */

if (new URLSearchParams(location.search).get('open') === '1') {
    openInvitation();
}

