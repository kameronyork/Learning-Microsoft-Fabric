// ==UserScript==
// @name         Hide 100% Watched YouTube Videos Except History & Likes
// @namespace    https://coopernorman.com/userscripts
// @version      4.0.0
// @description  Hides fully watched videos everywhere on YouTube mobile except Watch History and the Liked Videos playlist.
// @match        https://m.youtube.com/*
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const COMPLETE_PERCENT = 99.9;

    const HIDDEN_CLASS =
        'cn-hide-fully-watched-video';

    const ENABLED_ROOT_CLASS =
        'cn-hide-watched-filter-enabled';

    const STYLE_ID =
        'cn-hide-fully-watched-video-style';

    /*
     * This is the exact progress-bar class found in your exported
     * iPhone YouTube DOM.
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

    const CARD_SELECTORS = [
        /*
         * Mobile YouTube cards.
         */
        'ytm-rich-item-renderer',
        'ytm-video-with-context-renderer',
        'ytm-compact-video-renderer',
        'ytm-grid-video-renderer',
        'ytm-playlist-video-renderer',
        'ytm-video-card-renderer',
        'ytm-media-item',
        'yt-lockup-view-model',

        /*
         * Desktop-layout fallbacks.
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
    let previousUrl = location.href;

    /*
     * Return true on pages where watched videos must remain visible.
     */
    function isExemptPage() {
        const path =
            location.pathname.replace(/\/+$/, '') || '/';

        const parameters =
            new URLSearchParams(location.search);

        /*
         * Watch History:
         *
         * https://m.youtube.com/feed/history
         */
        const isHistory =
            path === '/feed/history';

        /*
         * Liked Videos:
         *
         * https://m.youtube.com/playlist?list=LL
         *
         * Only LL is exempted. Other playlists, including Watch Later,
         * continue hiding completed videos.
         */
        const isLikedVideos =
            path === '/playlist' &&
            parameters.get('list') === 'LL';

        return isHistory || isLikedVideos;
    }

    function filteringIsEnabled() {
        return !isExemptPage();
    }

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style =
            document.createElement('style');

        style.id = STYLE_ID;

        /*
         * Every hiding rule requires ENABLED_ROOT_CLASS.
         *
         * Removing that class immediately disables the filter on
         * History and Liked Videos, including the direct CSS rules.
         */
        style.textContent = `
            html.${ENABLED_ROOT_CLASS}
            .${HIDDEN_CLASS} {
                display: none !important;
            }

            html.${ENABLED_ROOT_CLASS}
            ytm-rich-item-renderer:has(
                .YtmThumbnailOverlayResumePlaybackRendererThumbnailOverlayResumePlaybackProgress[style*="width: 100%"]
            ),

            html.${ENABLED_ROOT_CLASS}
            ytm-rich-item-renderer:has(
                .YtmThumbnailOverlayResumePlaybackRendererThumbnailOverlayResumePlaybackProgress[style*="width:100%"]
            ),

            html.${ENABLED_ROOT_CLASS}
            ytm-video-with-context-renderer:has(
                .YtmThumbnailOverlayResumePlaybackRendererThumbnailOverlayResumePlaybackProgress[style*="width: 100%"]
            ),

            html.${ENABLED_ROOT_CLASS}
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

    /*
     * Restore every card hidden by this script.
     *
     * This is important because YouTube can reuse existing DOM elements
     * when moving between pages without doing a full browser refresh.
     */
    function restoreAllHiddenCards() {
        document
            .querySelectorAll(
                `.${HIDDEN_CLASS}`
            )
            .forEach((element) => {
                element.classList.remove(
                    HIDDEN_CLASS
                );
            });
    }

    function updateFilteringState() {
        if (!document.documentElement) {
            return false;
        }

        const enabled =
            filteringIsEnabled();

        document.documentElement.classList.toggle(
            ENABLED_ROOT_CLASS,
            enabled
        );

        if (!enabled) {
            restoreAllHiddenCards();

            refillAttempts = 0;

            window.clearTimeout(
                refillTimer
            );
        }

        return enabled;
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
         * Exact structure found in your mobile DOM:
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

        const ariaNow =
            parseNumber(
                progress.getAttribute(
                    'aria-valuenow'
                )
            );

        const ariaMax =
            parseNumber(
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

        const attributeValues = [
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

        for (const value of attributeValues) {
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
         * Pixel-width fallback.
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
        for (const selector of CARD_SELECTORS) {
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

        for (const progress of progressBars) {
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
        if (!filteringIsEnabled()) {
            restoreAllHiddenCards();
            return 0;
        }

        const cards = new Set(
            document.querySelectorAll(
                CARD_SELECTOR
            )
        );

        /*
         * Work outward from every progress element in case YouTube
         * introduces another outer card renderer.
         */
        const progressElements =
            document.querySelectorAll(
                PROGRESS_SELECTOR
            );

        for (const progress of progressElements) {
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
                 * YouTube sometimes reuses a card element for another
                 * video during navigation.
                 */
                card.classList.remove(
                    HIDDEN_CLASS
                );
            }
        }

        return newlyHidden;
    }

    function nudgeContinuationLoader() {
        if (!filteringIsEnabled()) {
            return;
        }

        window.clearTimeout(
            refillTimer
        );

        refillTimer =
            window.setTimeout(() => {
                /*
                 * Recheck because the user may have navigated to History
                 * or Liked Videos while this timer was waiting.
                 */
                if (!filteringIsEnabled()) {
                    return;
                }

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

                if (refillAttempts < 8) {
                    refillAttempts += 1;
                    scheduleScan(500);
                }
            }, 100);
    }

    function scan() {
        scanTimer = 0;

        injectStyle();

        const enabled =
            updateFilteringState();

        if (!enabled) {
            return;
        }

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

    function scheduleScan(delay = 60) {
        window.clearTimeout(
            scanTimer
        );

        scanTimer =
            window.setTimeout(
                scan,
                delay
            );
    }

    function handleNavigation() {
        previousUrl = location.href;
        refillAttempts = 0;

        /*
         * Update the root class immediately so CSS stops hiding cards
         * as soon as History or Liked Videos opens.
         */
        updateFilteringState();
        scheduleScan(30);
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

        updateFilteringState();

        const observer =
            new MutationObserver(
                (mutations) => {
                    /*
                     * YouTube may change the URL through its internal
                     * navigation without performing a normal page load.
                     */
                    if (location.href !== previousUrl) {
                        handleNavigation();
                        return;
                    }

                    for (const mutation of mutations) {
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

        /*
         * Backup URL watcher for mobile YouTube navigation experiments
         * that do not dispatch the expected navigation events.
         */
        window.setInterval(() => {
            if (location.href !== previousUrl) {
                handleNavigation();
            }
        }, 400);
    }

    start();

    document.addEventListener(
        'yt-navigate-start',
        handleNavigation,
        true
    );

    document.addEventListener(
        'yt-navigate-finish',
        handleNavigation,
        true
    );

    document.addEventListener(
        'yt-page-data-updated',
        handleNavigation,
        true
    );

    window.addEventListener(
        'popstate',
        handleNavigation,
        true
    );

    window.addEventListener(
        'pageshow',
        handleNavigation,
        true
    );

    document.addEventListener(
        'visibilitychange',
        () => {
            if (!document.hidden) {
                handleNavigation();
            }
        }
    );
})();