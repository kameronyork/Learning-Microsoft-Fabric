// ==UserScript==
// @name         Hide 100% Watched YouTube Videos - iPhone Safari
// @namespace    https://coopernorman.com/userscripts
// @version      3.0.0
// @description  Hides fully watched videos throughout YouTube's mobile web interface and nudges infinite scrolling to load replacements.
// @match        https://m.youtube.com/*
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    /*
     * YouTube uses exactly 100% in the exported mobile DOM.
     * A tiny tolerance handles possible rendering/rounding variations.
     */
    const COMPLETE_PERCENT = 99.9;

    const HIDDEN_CLASS = 'cn-hide-fully-watched-video';
    const STYLE_ID = 'cn-hide-fully-watched-video-style';

    /*
     * The first selector is the exact progress element found in your
     * exported iPhone Safari HTML.
     *
     * The remaining selectors are fallbacks for other YouTube layouts
     * and future A/B-tested progress-bar renderers.
     */
    const PROGRESS_SELECTOR = [
        '.YtmThumbnailOverlayResumePlaybackRendererThumbnailOverlayResumePlaybackProgress',

        '[class*="ThumbnailOverlayResumePlaybackRendererThumbnailOverlayResumePlaybackProgress"]',

        '.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment',
        '.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegmentModern',
        '[class*="WatchedProgressBarSegment"]',

        'ytm-thumbnail-overlay-resume-playback-renderer #progress',
        'ytd-thumbnail-overlay-resume-playback-renderer #progress',

        '[role="progressbar"][aria-valuenow]'
    ].join(',');

    /*
     * Ordered from the complete outer video card to smaller fallback
     * containers.
     *
     * Selecting ytm-rich-item-renderer first removes the thumbnail,
     * title, channel information, menu button, margins, and reserved
     * feed space.
     */
    const CARD_SELECTORS = [
        'ytm-rich-item-renderer',
        'ytm-video-with-context-renderer',
        'ytm-compact-video-renderer',
        'ytm-grid-video-renderer',
        'ytm-playlist-video-renderer',
        'ytm-video-card-renderer',
        'ytm-media-item',
        'yt-lockup-view-model',

        /*
         * Desktop-layout fallbacks in case Safari is displaying
         * www.youtube.com rather than the mobile renderer.
         */
        'ytd-rich-item-renderer',
        'ytd-video-renderer',
        'ytd-compact-video-renderer',
        'ytd-grid-video-renderer',
        'ytd-playlist-video-renderer',
        'ytd-playlist-panel-video-renderer'
    ];

    const CARD_SELECTOR =
        CARD_SELECTORS.join(',');

    const CONTINUATION_SELECTOR = [
        'ytm-continuation-item-renderer',
        'ytd-continuation-item-renderer',
        'continuation-item-renderer'
    ].join(',');

    let scanTimer = 0;
    let refillTimer = 0;
    let refillAttempts = 0;

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style =
            document.createElement('style');

        style.id = STYLE_ID;

        /*
         * The :has() rules provide immediate hiding for the exact
         * structure found in your exported mobile YouTube HTML.
         *
         * JavaScript below handles percentages such as 99.9%, other
         * page layouts, and dynamically inserted cards.
         */
        style.textContent = `
            .${HIDDEN_CLASS} {
                display: none !important;
            }

            ytm-rich-item-renderer:has(
                .YtmThumbnailOverlayResumePlaybackRendererThumbnailOverlayResumePlaybackProgress[style*="width: 100%"]
            ),

            ytm-rich-item-renderer:has(
                .YtmThumbnailOverlayResumePlaybackRendererThumbnailOverlayResumePlaybackProgress[style*="width:100%"]
            ),

            ytm-video-with-context-renderer:has(
                .YtmThumbnailOverlayResumePlaybackRendererThumbnailOverlayResumePlaybackProgress[style*="width: 100%"]
            ),

            ytm-video-with-context-renderer:has(
                .YtmThumbnailOverlayResumePlaybackRendererThumbnailOverlayResumePlaybackProgress[style*="width:100%"]
            ) {
                display: none !important;
            }
        `;

        const parent =
            document.head ||
            document.documentElement;

        if (parent) {
            parent.appendChild(style);
        } else {
            window.setTimeout(
                injectStyle,
                20
            );
        }
    }

    function parseNumber(value) {
        const match = String(
            value ?? ''
        ).match(
            /-?\d+(?:\.\d+)?/
        );

        if (!match) {
            return null;
        }

        const number =
            Number.parseFloat(match[0]);

        return Number.isFinite(number)
            ? number
            : null;
    }

    function percentageFromTransform(transform) {
        if (
            !transform ||
            transform === 'none'
        ) {
            return null;
        }

        /*
         * Example:
         *
         * transform: scaleX(1)
         */
        const scaleX = transform.match(
            /scaleX\(\s*(-?\d+(?:\.\d+)?)\s*\)/i
        );

        if (scaleX) {
            const scale =
                Number.parseFloat(scaleX[1]);

            if (
                Number.isFinite(scale) &&
                scale >= 0 &&
                scale <= 1.01
            ) {
                return scale * 100;
            }
        }

        /*
         * Browsers can return computed transforms as:
         *
         * matrix(scaleX, 0, 0, scaleY, x, y)
         */
        const matrix = transform.match(
            /^matrix\(\s*(-?\d+(?:\.\d+)?)/i
        );

        if (matrix) {
            const scale =
                Number.parseFloat(matrix[1]);

            if (
                Number.isFinite(scale) &&
                scale >= 0 &&
                scale <= 1.01
            ) {
                return scale * 100;
            }
        }

        return null;
    }

    function readProgressPercent(progress) {
        /*
         * Exact structure from your exported mobile DOM:
         *
         * style="width: 100%;"
         */
        const inlineWidth =
            progress.style.width;

        if (
            inlineWidth &&
            inlineWidth.trim().endsWith('%')
        ) {
            const percent =
                parseNumber(inlineWidth);

            if (percent !== null) {
                return percent;
            }
        }

        /*
         * Read the raw style attribute in case Safari does not expose
         * the value through element.style.width.
         */
        const styleAttribute =
            progress.getAttribute('style') || '';

        const widthMatch =
            styleAttribute.match(
                /(?:^|;)\s*width\s*:\s*(\d+(?:\.\d+)?)\s*%/i
            );

        if (widthMatch) {
            return Number.parseFloat(
                widthMatch[1]
            );
        }

        /*
         * Accessible progress-bar fallback.
         */
        const ariaNow = parseNumber(
            progress.getAttribute(
                'aria-valuenow'
            )
        );

        const ariaMax = parseNumber(
            progress.getAttribute(
                'aria-valuemax'
            )
        );

        if (ariaNow !== null) {
            return (
                ariaMax !== null &&
                ariaMax > 0
            )
                ? (ariaNow / ariaMax) * 100
                : ariaNow;
        }

        /*
         * Possible data-attribute fallbacks.
         */
        const dataPercentValues = [
            progress.getAttribute(
                'data-progress'
            ),
            progress.getAttribute(
                'data-percent'
            ),
            progress.getAttribute(
                'data-percentage'
            )
        ];

        for (
            const value of
            dataPercentValues
        ) {
            const percent =
                parseNumber(value);

            if (
                percent !== null &&
                percent >= 0 &&
                percent <= 101
            ) {
                return percent;
            }
        }

        /*
         * Transform-based progress fallback.
         */
        const transformed =
            percentageFromTransform(
                progress.style.transform
            ) ??
            percentageFromTransform(
                window.getComputedStyle(
                    progress
                ).transform
            );

        if (transformed !== null) {
            return transformed;
        }

        /*
         * Pixel-width fallback for layouts that do not expose a
         * percentage directly.
         */
        const barRect =
            progress.getBoundingClientRect();

        let track =
            progress.parentElement;

        for (
            let depth = 0;
            track && depth < 4;
            depth += 1
        ) {
            const trackRect =
                track.getBoundingClientRect();

            if (
                barRect.width > 0 &&
                trackRect.width > 0 &&
                trackRect.width >=
                    barRect.width &&
                trackRect.height <= 20
            ) {
                return (
                    barRect.width /
                    trackRect.width
                ) * 100;
            }

            track =
                track.parentElement;
        }

        return null;
    }

    function findCard(element) {
        for (
            const selector of
            CARD_SELECTORS
        ) {
            const card =
                element.closest(selector);

            if (card) {
                return card;
            }
        }

        return null;
    }

    function cardIsFullyWatched(card) {
        const progressBars =
            card.querySelectorAll(
                PROGRESS_SELECTOR
            );

        for (
            const progress of
            progressBars
        ) {
            const percent =
                readProgressPercent(progress);

            if (
                percent !== null &&
                percent >= COMPLETE_PERCENT
            ) {
                return true;
            }
        }

        return false;
    }

    function updateCards() {
        const cards = new Set(
            document.querySelectorAll(
                CARD_SELECTOR
            )
        );

        /*
         * Also work outward from progress elements. This helps if
         * YouTube introduces another outer card element that is not
         * included in CARD_SELECTORS.
         */
        const progressElements =
            document.querySelectorAll(
                PROGRESS_SELECTOR
            );

        for (
            const progress of
            progressElements
        ) {
            const card =
                findCard(progress);

            if (card) {
                cards.add(card);
            }
        }

        let newlyHidden = 0;

        for (const card of cards) {
            const shouldHide =
                cardIsFullyWatched(card);

            const isHidden =
                card.classList.contains(
                    HIDDEN_CLASS
                );

            if (
                shouldHide &&
                !isHidden
            ) {
                card.classList.add(
                    HIDDEN_CLASS
                );

                newlyHidden += 1;
            } else if (
                !shouldHide &&
                isHidden
            ) {
                /*
                 * YouTube can recycle an existing card element for a
                 * different video while navigating or scrolling.
                 */
                card.classList.remove(
                    HIDDEN_CLASS
                );
            }
        }

        return newlyHidden;
    }

    function nudgeContinuationLoader() {
        window.clearTimeout(
            refillTimer
        );

        refillTimer =
            window.setTimeout(() => {
                const continuation =
                    document.querySelector(
                        CONTINUATION_SELECTOR
                    );

                if (!continuation) {
                    return;
                }

                const root =
                    document.scrollingElement ||
                    document.documentElement;

                const continuationRect =
                    continuation
                        .getBoundingClientRect();

                const pageIsShort =
                    root.scrollHeight <=
                    window.innerHeight * 2.2;

                const loaderIsNear =
                    continuationRect.top <=
                    window.innerHeight * 2.2;

                if (
                    !pageIsShort &&
                    !loaderIsNear
                ) {
                    return;
                }

                /*
                 * YouTube loads another batch when its continuation
                 * element approaches the viewport.
                 *
                 * Hiding watched videos moves that loader upward.
                 * These events and an imperceptible one-pixel movement
                 * make Safari recalculate the loader without refreshing
                 * the page or changing your location in the feed.
                 */
                const originalY =
                    window.scrollY;

                window.dispatchEvent(
                    new Event('scroll')
                );

                document.dispatchEvent(
                    new Event(
                        'scroll',
                        {
                            bubbles: true
                        }
                    )
                );

                window.dispatchEvent(
                    new Event('resize')
                );

                window.scrollTo(
                    0,
                    originalY + 1
                );

                window.requestAnimationFrame(
                    () => {
                        window.scrollTo(
                            0,
                            originalY
                        );

                        window.dispatchEvent(
                            new Event('scroll')
                        );
                    }
                );

                /*
                 * Allow several passes in case the next batch also
                 * contains mostly completed videos.
                 */
                if (refillAttempts < 8) {
                    refillAttempts += 1;
                    scheduleScan(500);
                }
            }, 100);
    }

    function scan() {
        scanTimer = 0;

        injectStyle();

        const newlyHidden =
            updateCards();

        if (newlyHidden > 0) {
            refillAttempts = 0;
            nudgeContinuationLoader();
        } else if (
            refillAttempts > 0 &&
            refillAttempts < 8
        ) {
            nudgeContinuationLoader();
        }
    }

    function scheduleScan(
        delay = 60
    ) {
        window.clearTimeout(
            scanTimer
        );

        scanTimer =
            window.setTimeout(
                scan,
                delay
            );
    }

    function resetForNavigation() {
        refillAttempts = 0;
        scheduleScan(40);
    }

    function start() {
        injectStyle();

        if (!document.documentElement) {
            window.setTimeout(
                start,
                20
            );

            return;
        }

        /*
         * YouTube is a single-page application. This watches for:
         *
         * - Newly inserted feed cards
         * - Infinite-scroll results
         * - Progress percentages being updated
         * - Navigation between Home, Subscriptions, search, and channels
         */
        const observer =
            new MutationObserver(
                (mutations) => {
                    for (
                        const mutation of
                        mutations
                    ) {
                        if (
                            mutation.type ===
                                'childList' ||
                            mutation.attributeName ===
                                'style' ||
                            mutation.attributeName ===
                                'aria-valuenow' ||
                            mutation.attributeName ===
                                'aria-valuemax'
                        ) {
                            scheduleScan();
                            return;
                        }
                    }
                }
            );

        observer.observe(
            document.documentElement,
            {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'style',
                    'aria-valuenow',
                    'aria-valuemax',
                    'data-progress',
                    'data-percent',
                    'data-percentage'
                ]
            }
        );

        scheduleScan(0);
    }

    start();

    /*
     * YouTube navigation usually occurs without a full browser reload.
     */
    document.addEventListener(
        'yt-navigate-finish',
        resetForNavigation,
        true
    );

    document.addEventListener(
        'yt-page-data-updated',
        resetForNavigation,
        true
    );

    window.addEventListener(
        'popstate',
        resetForNavigation,
        true
    );

    window.addEventListener(
        'pageshow',
        resetForNavigation,
        true
    );

    document.addEventListener(
        'visibilitychange',
        () => {
            if (!document.hidden) {
                resetForNavigation();
            }
        }
    );
})();