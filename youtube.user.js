// ==UserScript==
// @name         Hide Fully Watched YouTube Videos - Mobile Safari (Fixed)
// @namespace    https://coopernorman.com/userscripts
// @version      2.2.0
// @description  Hides completed YouTube videos throughout mobile Safari, including Subscriptions.
// @match        https://m.youtube.com/*
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    /*
     * YouTube sometimes renders a completed progress bar as 99.x%
     * instead of exactly 100%.
     *
     * Set this to 100 for exact-100-only detection, but doing so may
     * cause some visually completed videos to remain visible.
     */
    const COMPLETE_PERCENT = 99;

    const HIDDEN_CLASS = 'cn-fully-watched-hidden';
    const STYLE_ID = 'cn-fully-watched-style';

    /*
     * Known complete video-card containers used across mobile YouTube
     * and the desktop-layout version that Safari can occasionally load.
     */
    const CARD_SELECTOR = [
        'ytm-video-with-context-renderer',
        'ytm-rich-item-renderer',
        'ytm-compact-video-renderer',
        'ytm-grid-video-renderer',
        'ytm-playlist-video-renderer',
        'ytm-video-card-renderer',
        'ytm-media-item',
        'yt-lockup-view-model',

        'ytd-rich-item-renderer',
        'ytd-video-renderer',
        'ytd-compact-video-renderer',
        'ytd-grid-video-renderer',
        'ytd-playlist-video-renderer',
        'ytd-playlist-panel-video-renderer'
    ].join(',');

    /*
     * Known YouTube watch-progress elements.
     *
     * This includes:
     * - Current view-model progress bars
     * - Current "Modern" progress bars
     * - Older mobile resume-playback renderers
     * - Desktop-layout fallbacks
     * - Generic A/B-test fallbacks
     */
    const PROGRESS_SELECTOR = [
        '.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment',
        '.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegmentModern',
        '[class*="WatchedProgressBarSegment"]',

        'ytm-thumbnail-overlay-resume-playback-renderer #progress',
        'ytm-thumbnail-overlay-resume-playback-renderer [role="progressbar"]',

        'ytd-thumbnail-overlay-resume-playback-renderer #progress',
        'ytd-thumbnail-overlay-resume-playback-renderer [role="progressbar"]',

        'yt-thumbnail-overlay-progress-bar-view-model [role="progressbar"]',
        'yt-thumbnail-overlay-progress-bar-view-model [style*="width"]',

        '[class*="resume-playback-progress"]',
        '[class*="watched-progress"]'
    ].join(',');

    const VIDEO_LINK_SELECTOR = [
        'a[href*="/watch"]',
        'a[href*="youtu.be/"]',
        'a[href*="/live/"]'
    ].join(',');

    /*
     * Stop walking upward once we reach a section containing multiple
     * videos. This prevents accidentally hiding a complete feed.
     */
    const STOP_SELECTOR = [
        'ytm-item-section-renderer',
        'ytm-rich-section-renderer',
        'ytm-shelf-renderer',

        'ytd-item-section-renderer',
        'ytd-rich-section-renderer',
        'ytd-shelf-renderer',

        'ytm-app',
        'ytd-app',
        'main',
        '[role="main"]'
    ].join(',');

    const CONTINUATION_SELECTOR = [
        'ytm-continuation-item-renderer',
        'ytd-continuation-item-renderer',
        'continuation-item-renderer'
    ].join(',');

    let scanTimer = 0;
    let refillTimer = 0;

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement('style');

        style.id = STYLE_ID;

        style.textContent = `
            .${HIDDEN_CLASS} {
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
        if (
            value === null ||
            value === undefined
        ) {
            return null;
        }

        const match = String(value).match(
            /-?\d+(?:\.\d+)?/
        );

        if (!match) {
            return null;
        }

        const number = Number.parseFloat(
            match[0]
        );

        return Number.isFinite(number)
            ? number
            : null;
    }

    function percentFromTransform(transform) {
        if (
            !transform ||
            transform === 'none'
        ) {
            return null;
        }

        /*
         * Example:
         *
         * transform: scaleX(0.995)
         */
        const scale = transform.match(
            /scaleX\(\s*(-?\d+(?:\.\d+)?)\s*\)/i
        );

        if (scale) {
            const value = Number.parseFloat(
                scale[1]
            );

            return (
                value >= 0 &&
                value <= 1.01
            )
                ? value * 100
                : null;
        }

        /*
         * Computed transforms are frequently represented as:
         *
         * matrix(scaleX, 0, 0, scaleY, x, y)
         */
        const matrix = transform.match(
            /^matrix\(\s*(-?\d+(?:\.\d+)?)/i
        );

        if (matrix) {
            const value = Number.parseFloat(
                matrix[1]
            );

            return (
                value >= 0 &&
                value <= 1.01
            )
                ? value * 100
                : null;
        }

        return null;
    }

    function explicitPercent(element) {
        /*
         * First check accessible progress attributes.
         */
        const ariaNow = parseNumber(
            element.getAttribute('aria-valuenow')
        );

        const ariaMax = parseNumber(
            element.getAttribute('aria-valuemax')
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
         * Check common data attributes and CSS variables.
         */
        const directValues = [
            element.getAttribute(
                'data-progress'
            ),
            element.getAttribute(
                'data-percent'
            ),
            element.getAttribute(
                'data-percentage'
            ),
            element.style.getPropertyValue(
                '--progress'
            ),
            element.style.getPropertyValue(
                '--progress-percent'
            ),
            element.style.getPropertyValue(
                '--yt-progress-percent'
            )
        ];

        for (const value of directValues) {
            const percent = parseNumber(value);

            if (
                percent !== null &&
                percent >= 0 &&
                percent <= 101
            ) {
                return percent;
            }
        }

        /*
         * Check an inline style such as:
         *
         * style="width: 100%;"
         */
        const inlineStyle =
            element.getAttribute('style') || '';

        const width = inlineStyle.match(
            /(?:^|;)\s*width\s*:\s*(\d+(?:\.\d+)?)\s*%/i
        );

        if (width) {
            return Number.parseFloat(
                width[1]
            );
        }

        /*
         * Finally check inline and computed scale transforms.
         */
        return (
            percentFromTransform(
                element.style.transform
            ) ??
            percentFromTransform(
                window.getComputedStyle(
                    element
                ).transform
            )
        );
    }

    function geometricPercent(element) {
        const bar =
            element.getBoundingClientRect();

        if (
            bar.width <= 0 ||
            bar.height <= 0
        ) {
            return null;
        }

        let track = element.parentElement;

        /*
         * Walk upward until we find the narrow progress track that
         * contains the colored watched segment.
         */
        for (
            let depth = 0;
            track && depth < 5;
            depth += 1
        ) {
            const rect =
                track.getBoundingClientRect();

            if (
                rect.width >= bar.width &&
                rect.width > 40 &&
                rect.height > 0 &&
                rect.height <= 18
            ) {
                return (
                    bar.width /
                    rect.width
                ) * 100;
            }

            track = track.parentElement;
        }

        return null;
    }

    function isYouTubeRed(color) {
        const match = String(color).match(
            /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i
        );

        if (!match) {
            return false;
        }

        const red = Number(match[1]);
        const green = Number(match[2]);
        const blue = Number(match[3]);

        const alpha =
            match[4] === undefined
                ? 1
                : Number(match[4]);

        /*
         * Accept YouTube's red and its brighter pink/red mobile
         * progress-bar variants.
         */
        return (
            alpha > 0.15 &&
            red >= 175 &&
            green <= 110 &&
            blue <= 145 &&
            red >= green * 1.5
        );
    }

    function looksRed(element) {
        const styles = [
            window.getComputedStyle(
                element
            ),
            window.getComputedStyle(
                element,
                '::before'
            ),
            window.getComputedStyle(
                element,
                '::after'
            )
        ];

        return styles.some((style) =>
            [
                style.backgroundColor,
                style.borderTopColor,
                style.borderBottomColor
            ].some(isYouTubeRed)
        );
    }

    function getThumbnailRect(card) {
        /*
         * The largest image inside a card is normally its video
         * thumbnail. Channel avatars are much smaller.
         */
        const images = Array.from(
            card.querySelectorAll('img')
        )
            .map((image) =>
                image.getBoundingClientRect()
            )
            .filter((rect) =>
                rect.width > 120 &&
                rect.height > 60
            )
            .sort(
                (a, b) =>
                    b.width * b.height -
                    a.width * a.height
            );

        if (images.length > 0) {
            return images[0];
        }

        /*
         * Fallback if the thumbnail image has not loaded yet.
         */
        const thumbnail = card.querySelector(
            [
                'ytm-thumbnail',
                'ytd-thumbnail',
                'yt-thumbnail-view-model'
            ].join(',')
        );

        return thumbnail
            ? thumbnail.getBoundingClientRect()
            : null;
    }

    function hasFullVisualProgressBar(card) {
        const thumbnail =
            getThumbnailRect(card);

        if (
            !thumbnail ||
            thumbnail.width <= 0
        ) {
            return false;
        }

        /*
         * This is the important mobile-Safari fallback.
         *
         * It identifies the thin pink/red horizontal line spanning the
         * bottom of the thumbnail, even when YouTube gives it an unknown
         * or newly A/B-tested class name.
         */
        const possibleBars =
            card.querySelectorAll(
                [
                    'div',
                    'span',
                    'progress',
                    '[role="progressbar"]'
                ].join(',')
            );

        for (const element of possibleBars) {
            const rect =
                element.getBoundingClientRect();

            if (
                rect.width <
                    thumbnail.width *
                    (COMPLETE_PERCENT / 100) ||
                rect.height < 1 ||
                rect.height > 12
            ) {
                continue;
            }

            const horizontallyAligned =
                Math.abs(
                    rect.left -
                    thumbnail.left
                ) <= 12 &&
                Math.abs(
                    rect.right -
                    thumbnail.right
                ) <= 12;

            const atThumbnailBottom =
                Math.abs(
                    rect.bottom -
                    thumbnail.bottom
                ) <= 18 ||
                Math.abs(
                    rect.top -
                    thumbnail.bottom
                ) <= 18;

            if (
                horizontallyAligned &&
                atThumbnailBottom &&
                looksRed(element)
            ) {
                return true;
            }
        }

        return false;
    }

    function isFullyWatched(card) {
        /*
         * First use YouTube's known progress elements.
         */
        const progressElements =
            card.querySelectorAll(
                PROGRESS_SELECTOR
            );

        for (
            const progress of
            progressElements
        ) {
            const explicit =
                explicitPercent(progress);

            const geometric =
                geometricPercent(progress);

            if (
                (
                    explicit !== null &&
                    explicit >=
                        COMPLETE_PERCENT
                ) ||
                (
                    geometric !== null &&
                    geometric >=
                        COMPLETE_PERCENT
                )
            ) {
                return true;
            }
        }

        /*
         * Fall back to visually recognizing the completed bar.
         */
        return hasFullVisualProgressBar(
            card
        );
    }

    function uniqueVideoUrls(element) {
        return new Set(
            Array.from(
                element.querySelectorAll(
                    VIDEO_LINK_SELECTOR
                )
            )
                .map((link) => link.href)
                .filter(Boolean)
        );
    }

    function findUnknownCard(link) {
        let current = link.parentElement;
        let best = null;

        /*
         * Walk upward while the container still represents only one
         * unique video URL. The final matching ancestor is normally
         * the complete card, including the thumbnail and description.
         */
        for (
            let depth = 0;
            current && depth < 16;
            depth += 1
        ) {
            if (
                current.matches?.(
                    STOP_SELECTOR
                ) ||
                current === document.body ||
                current ===
                    document.documentElement
            ) {
                break;
            }

            const urls =
                uniqueVideoUrls(current);

            if (urls.size === 1) {
                best = current;
            } else if (urls.size > 1) {
                break;
            }

            current =
                current.parentElement;
        }

        return best;
    }

    function findCards() {
        const cards = new Set(
            document.querySelectorAll(
                CARD_SELECTOR
            )
        );

        /*
         * YouTube frequently tests new renderer names. Building cards
         * outward from watch links means the script is not completely
         * dependent on knowing the newest custom-element name.
         */
        const videoLinks =
            document.querySelectorAll(
                VIDEO_LINK_SELECTOR
            );

        for (const link of videoLinks) {
            const knownCard =
                link.closest(
                    CARD_SELECTOR
                );

            const card =
                knownCard ||
                findUnknownCard(link);

            if (card) {
                cards.add(card);
            }
        }

        return cards;
    }

    function hideWatchedCards() {
        let newlyHidden = 0;

        for (const card of findCards()) {
            /*
             * Avoid processing unrelated containers that happen to use
             * one of YouTube's generic renderer names.
             */
            if (
                !card.querySelector(
                    VIDEO_LINK_SELECTOR
                )
            ) {
                continue;
            }

            const shouldHide =
                isFullyWatched(card);

            const wasHidden =
                card.classList.contains(
                    HIDDEN_CLASS
                );

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

    function nudgeInfiniteScroll() {
        window.clearTimeout(
            refillTimer
        );

        refillTimer =
            window.setTimeout(() => {
                const root =
                    document.scrollingElement ||
                    document.documentElement;

                if (!root) {
                    return;
                }

                const continuation =
                    document.querySelector(
                        CONTINUATION_SELECTOR
                    );

                const continuationNearViewport =
                    continuation &&
                    continuation
                        .getBoundingClientRect()
                        .top <
                        window.innerHeight *
                            2.5;

                const distanceFromBottom =
                    root.scrollHeight -
                    root.scrollTop -
                    window.innerHeight;

                const pageUnderfilled =
                    root.scrollHeight <
                    window.innerHeight *
                        1.8;

                if (
                    distanceFromBottom >
                        window.innerHeight *
                            2 &&
                    !continuationNearViewport &&
                    !pageUnderfilled
                ) {
                    return;
                }

                /*
                 * A one-pixel movement causes Safari and YouTube's
                 * IntersectionObserver to reevaluate the continuation
                 * loader. The original position is restored immediately.
                 *
                 * This does not reload the page.
                 */
                const originalTop =
                    root.scrollTop;

                window.scrollTo(
                    0,
                    originalTop + 1
                );

                window.requestAnimationFrame(
                    () => {
                        window.scrollTo(
                            0,
                            originalTop
                        );

                        window.dispatchEvent(
                            new Event('scroll')
                        );

                        window.dispatchEvent(
                            new Event('resize')
                        );

                        scheduleScan(300);
                    }
                );
            }, 120);
    }

    function scan() {
        scanTimer = 0;

        injectStyle();

        const hiddenCount =
            hideWatchedCards();

        if (hiddenCount > 0) {
            nudgeInfiniteScroll();
        }
    }

    function scheduleScan(
        delay = 90
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

    function start() {
        injectStyle();

        if (
            !document.documentElement
        ) {
            window.setTimeout(
                start,
                20
            );

            return;
        }

        /*
         * YouTube is a single-page application and continuously inserts
         * feed items as you navigate and scroll.
         */
        const observer =
            new MutationObserver(
                () => scheduleScan()
            );

        observer.observe(
            document.documentElement,
            {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'style',
                    'class',
                    'aria-valuenow',
                    'aria-valuemax',
                    'data-progress',
                    'data-percent'
                ]
            }
        );

        scheduleScan(0);

        /*
         * Some YouTube progress updates do not trigger a mutation that
         * contains enough information, so periodically perform a light
         * rescan while the tab is visible.
         */
        window.setInterval(() => {
            if (!document.hidden) {
                scheduleScan(0);
            }
        }, 1800);
    }

    start();

    /*
     * YouTube navigation often happens without a normal page refresh.
     */
    const navigationEvents = [
        'yt-navigate-finish',
        'yt-page-data-updated',
        'yt-action',
        'popstate',
        'pageshow'
    ];

    for (
        const eventName of
        navigationEvents
    ) {
        window.addEventListener(
            eventName,
            () => scheduleScan(40),
            true
        );
    }

    document.addEventListener(
        'visibilitychange',
        () => {
            if (!document.hidden) {
                scheduleScan(40);
            }
        }
    );
})();