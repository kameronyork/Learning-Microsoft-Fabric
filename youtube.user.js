// ==UserScript==
// @name         Hide Fully Watched YouTube Videos (Mobile Safari)
// @namespace    https://coopernorman.com/userscripts
// @version      1.0.0
// @description  Hides videos that YouTube marks as fully watched across mobile and desktop-layout pages, including Subscriptions.
// @match        https://m.youtube.com/*
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    /*
     * Hide only completed videos.
     *
     * The small tolerance accounts for fractional pixel/rendering math
     * where a visually complete 100% progress bar may measure as 99.99%.
     */
    const FULLY_WATCHED_THRESHOLD = 100;
    const RENDERING_TOLERANCE = 0.05;

    const HIDDEN_CLASS = 'cn-fully-watched-video-hidden';
    const EMPTY_SECTION_CLASS = 'cn-empty-watched-section-hidden';
    const STYLE_ID = 'cn-hide-fully-watched-youtube-style';

    /*
     * These are thumbnail progress indicators, not the progress bar
     * inside the video player itself.
     */
    const PROGRESS_SELECTOR = [
        '.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment',
        '[class*="ThumbnailOverlayProgressBarHostWatchedProgressBarSegment"]',
        'ytm-thumbnail-overlay-resume-playback-renderer .thumbnail-overlay-resume-playback-progress',
        'ytm-thumbnail-overlay-resume-playback-renderer [class*="resume-playback-progress"]',
        'ytd-thumbnail-overlay-resume-playback-renderer #progress',
        'yt-thumbnail-overlay-progress-bar-view-model [role="progressbar"]',
        'ytm-thumbnail-overlay-resume-playback-renderer [role="progressbar"]',
        'ytd-thumbnail-overlay-resume-playback-renderer [role="progressbar"]'
    ].join(',');

    /*
     * Video-card wrappers used by mobile and desktop-layout YouTube.
     */
    const CARD_SELECTORS = [
        'ytm-rich-item-renderer',
        'ytm-video-with-context-renderer',
        'ytm-compact-video-renderer',
        'ytm-playlist-video-renderer',
        'ytm-grid-video-renderer',
        'ytm-video-card-renderer',
        'ytm-media-item',
        'ytd-rich-item-renderer',
        'ytd-video-renderer',
        'ytd-compact-video-renderer',
        'ytd-grid-video-renderer',
        'ytd-playlist-video-renderer',
        'ytd-playlist-panel-video-renderer',
        'yt-lockup-view-model'
    ];

    const CARD_SELECTOR = CARD_SELECTORS.join(',');

    const SECTION_SELECTOR = [
        'ytm-rich-section-renderer',
        'ytm-shelf-renderer',
        'ytm-item-section-renderer',
        'grid-shelf-view-model',
        'ytd-rich-section-renderer',
        'ytd-shelf-renderer',
        'ytd-item-section-renderer'
    ].join(',');

    const CONTINUATION_SELECTOR = [
        'ytm-continuation-item-renderer',
        'ytd-continuation-item-renderer',
        'continuation-item-renderer'
    ].join(',');

    let scanTimer = 0;
    let refillTimer = 0;
    let observer = null;

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `
            .${HIDDEN_CLASS},
            .${EMPTY_SECTION_CLASS} {
                display: none !important;
            }
        `;

        const parent = document.head || document.documentElement;

        if (parent) {
            parent.appendChild(style);
        } else {
            window.setTimeout(injectStyle, 20);
        }
    }

    function parsePercentage(value) {
        if (value === null || value === undefined) {
            return null;
        }

        const match = String(value).match(/-?\d+(?:\.\d+)?/);

        if (!match) {
            return null;
        }

        const number = Number.parseFloat(match[0]);

        return Number.isFinite(number) ? number : null;
    }

    function percentageFromTransform(transform) {
        if (!transform || transform === 'none') {
            return null;
        }

        /*
         * matrix(a, b, c, d, tx, ty)
         *
         * The first value, "a", is the horizontal scale.
         */
        const matrix = transform.match(
            /^matrix\(\s*(-?\d+(?:\.\d+)?)/i
        );

        if (matrix) {
            const scaleX = Number.parseFloat(matrix[1]);

            if (
                Number.isFinite(scaleX) &&
                scaleX >= 0 &&
                scaleX <= 1.001
            ) {
                return scaleX * 100;
            }
        }

        const scale = transform.match(
            /scaleX\(\s*(-?\d+(?:\.\d+)?)\s*\)/i
        );

        if (scale) {
            const scaleX = Number.parseFloat(scale[1]);

            if (
                Number.isFinite(scaleX) &&
                scaleX >= 0 &&
                scaleX <= 1.001
            ) {
                return scaleX * 100;
            }
        }

        return null;
    }

    function readProgressPercentage(progressElement) {
        const directValues = [
            progressElement.getAttribute('aria-valuenow'),
            progressElement.getAttribute('data-progress'),
            progressElement.getAttribute('data-percent'),
            progressElement.style.getPropertyValue('--progress'),
            progressElement.style.getPropertyValue('--progress-percent')
        ];

        for (const value of directValues) {
            const percentage = parsePercentage(value);

            if (
                percentage !== null &&
                percentage >= 0 &&
                percentage <= 100.5
            ) {
                return percentage;
            }
        }

        /*
         * Check for an inline width such as:
         *
         * style="width: 100%"
         */
        const inlineStyle =
            progressElement.getAttribute('style') || '';

        const widthMatch = inlineStyle.match(
            /(?:^|;)\s*width\s*:\s*(\d+(?:\.\d+)?)%/i
        );

        if (widthMatch) {
            return Number.parseFloat(widthMatch[1]);
        }

        /*
         * Check for an inline scaleX transform.
         */
        const inlineTransform = percentageFromTransform(
            progressElement.style.transform
        );

        if (inlineTransform !== null) {
            return inlineTransform;
        }

        /*
         * Some YouTube layouts use pixel widths rather than percentage
         * values. Compare the progress element with its parent track.
         */
        const parent = progressElement.parentElement;

        if (parent) {
            const progressRect =
                progressElement.getBoundingClientRect();

            const parentRect =
                parent.getBoundingClientRect();

            if (
                progressRect.width > 0 &&
                parentRect.width > 0
            ) {
                const percentage =
                    (progressRect.width / parentRect.width) * 100;

                if (
                    percentage >= 0 &&
                    percentage <= 101
                ) {
                    return percentage;
                }
            }
        }

        /*
         * Finally, check the computed transform supplied by YouTube's
         * styles rather than directly in the element's style attribute.
         */
        const computedTransform = percentageFromTransform(
            window.getComputedStyle(progressElement).transform
        );

        if (computedTransform !== null) {
            return computedTransform;
        }

        return null;
    }

    function findBestCard(element) {
        for (const selector of CARD_SELECTORS) {
            const card = element.closest(selector);

            if (card) {
                return card;
            }
        }

        /*
         * Last-resort wrappers for occasional YouTube experiments.
         */
        return element.closest('li, article');
    }

    function cardIsFullyWatched(card) {
        const progressElements =
            card.querySelectorAll(PROGRESS_SELECTOR);

        for (const progressElement of progressElements) {
            const percentage =
                readProgressPercentage(progressElement);

            if (
                percentage !== null &&
                percentage + RENDERING_TOLERANCE >=
                    FULLY_WATCHED_THRESHOLD
            ) {
                return true;
            }
        }

        return false;
    }

    function collectCards() {
        const cards = new Set(
            document.querySelectorAll(CARD_SELECTOR)
        );

        /*
         * Work outward from every known progress bar. This allows the
         * script to handle some newly tested YouTube card wrappers even
         * when their custom-element name is not listed above.
         */
        for (
            const progressElement of
            document.querySelectorAll(PROGRESS_SELECTOR)
        ) {
            const card = findBestCard(progressElement);

            if (card) {
                cards.add(card);
            }
        }

        return cards;
    }

    function updateCards() {
        let newlyHidden = 0;

        for (const card of collectCards()) {
            const shouldHide = cardIsFullyWatched(card);
            const wasHidden =
                card.classList.contains(HIDDEN_CLASS);

            if (shouldHide !== wasHidden) {
                card.classList.toggle(
                    HIDDEN_CLASS,
                    shouldHide
                );

                if (shouldHide) {
                    newlyHidden += 1;
                }
            }
        }

        return newlyHidden;
    }

    function cardIsActuallyVisible(card) {
        return (
            !card.classList.contains(HIDDEN_CLASS) &&
            !card.closest(`.${HIDDEN_CLASS}`)
        );
    }

    function updateEmptySections() {
        for (
            const section of
            document.querySelectorAll(SECTION_SELECTOR)
        ) {
            /*
             * Do not hide a container that owns YouTube's infinite-scroll
             * loader. Removing it could stop new videos from loading.
             */
            if (section.querySelector(CONTINUATION_SELECTOR)) {
                section.classList.remove(EMPTY_SECTION_CLASS);
                continue;
            }

            const cards = Array.from(
                section.querySelectorAll(CARD_SELECTOR)
            );

            if (cards.length === 0) {
                section.classList.remove(EMPTY_SECTION_CLASS);
                continue;
            }

            const hasVisibleCard =
                cards.some(cardIsActuallyVisible);

            section.classList.toggle(
                EMPTY_SECTION_CLASS,
                !hasVisibleCard
            );
        }
    }

    function pulseInfiniteScroll() {
        window.clearTimeout(refillTimer);

        refillTimer = window.setTimeout(() => {
            const root =
                document.scrollingElement ||
                document.documentElement;

            if (!root) {
                return;
            }

            const distanceFromBottom =
                root.scrollHeight -
                (root.scrollTop + window.innerHeight);

            const nearBottom =
                distanceFromBottom < window.innerHeight * 2;

            const feedUnderfilled =
                root.scrollHeight <= window.innerHeight * 1.5;

            if (!nearBottom && !feedUnderfilled) {
                return;
            }

            /*
             * YouTube normally loads another batch when its continuation
             * element reaches the viewport. Hiding cards changes the
             * layout, so these events encourage YouTube to recalculate
             * whether more items need to load.
             *
             * This does not reload the page or change the scroll position.
             */
            window.dispatchEvent(new Event('scroll'));

            document.dispatchEvent(
                new Event('scroll', {
                    bubbles: true
                })
            );

            root.dispatchEvent(
                new Event('scroll', {
                    bubbles: true
                })
            );

            window.requestAnimationFrame(() => {
                window.dispatchEvent(new Event('resize'));
                scheduleScan(250);
            });
        }, 120);
    }

    function scan() {
        scanTimer = 0;

        injectStyle();

        const newlyHidden = updateCards();

        updateEmptySections();

        if (newlyHidden > 0) {
            pulseInfiniteScroll();
        }
    }

    function scheduleScan(delay = 90) {
        window.clearTimeout(scanTimer);

        scanTimer = window.setTimeout(
            scan,
            delay
        );
    }

    function startObserver() {
        if (!document.documentElement) {
            window.setTimeout(startObserver, 20);
            return;
        }

        if (observer) {
            observer.disconnect();
        }

        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (
                    mutation.type === 'childList' ||
                    mutation.attributeName === 'style' ||
                    mutation.attributeName === 'aria-valuenow' ||
                    mutation.attributeName === 'data-progress' ||
                    mutation.attributeName === 'data-percent'
                ) {
                    scheduleScan();
                    return;
                }
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: [
                'style',
                'aria-valuenow',
                'data-progress',
                'data-percent'
            ]
        });

        scheduleScan(0);
    }

    injectStyle();
    startObserver();

    /*
     * YouTube switches between pages without performing a full browser
     * reload, so listen for its internal navigation events.
     */
    document.addEventListener(
        'yt-navigate-finish',
        () => scheduleScan(50),
        true
    );

    document.addEventListener(
        'yt-page-data-updated',
        () => scheduleScan(50),
        true
    );

    window.addEventListener(
        'popstate',
        () => scheduleScan(50),
        true
    );

    window.addEventListener(
        'pageshow',
        () => scheduleScan(50),
        true
    );

    window.addEventListener(
        'resize',
        () => scheduleScan(150),
        true
    );

    document.addEventListener(
        'visibilitychange',
        () => {
            if (!document.hidden) {
                scheduleScan(50);
            }
        }
    );
})();