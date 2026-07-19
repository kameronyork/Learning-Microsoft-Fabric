// ==UserScript==
// @name         Hide YouTube Shorts & Playables (Mobile Safari)
// @namespace    http://tampermonkey.net
// @version      2.0
// @description  Removes YouTube Shorts from feeds/navigation and hides YouTube Playables on mobile YouTube.
// @match        https://m.youtube.com/*
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const HIDDEN_CLASS = 'cn-hide-youtube-content';

    const css = `
        /* Elements hidden by the JavaScript fallbacks */
        .${HIDDEN_CLASS} {
            display: none !important;
        }

        /* =========================================================
           MOBILE YOUTUBE: SHORTS
           ========================================================= */

        /* Hide the Shorts button from the bottom navigation bar */
        ytm-pivot-bar-item-renderer:has(.pivot-shorts),
        ytm-pivot-bar-item-renderer:has(a[href^="/shorts"]),
        ytm-pivot-bar-item-renderer[data-pivot-id="shorts"] {
            display: none !important;
        }

        /*
         * Hide complete Shorts shelves.
         * Targeting the parent rich section also removes the Shorts
         * heading, divider, carousel and any surrounding empty space.
         */
        ytm-rich-section-renderer:has(ytm-reel-shelf-renderer),
        ytm-rich-section-renderer:has(ytm-shorts-lockup-view-model),
        ytm-rich-section-renderer:has(ytm-shorts-lockup-view-model-v2),
        grid-shelf-view-model:has(ytm-shorts-lockup-view-model),
        grid-shelf-view-model:has(ytm-shorts-lockup-view-model-v2),
        ytm-reel-shelf-renderer {
            display: none !important;
        }

        /* Hide individual Shorts in feeds, search and recommendations */
        ytm-shorts-lockup-view-model,
        ytm-shorts-lockup-view-model-v2,
        ytm-rich-item-renderer:has(ytm-shorts-lockup-view-model),
        ytm-rich-item-renderer:has(ytm-shorts-lockup-view-model-v2),
        ytm-rich-item-renderer:has(a[href^="/shorts/"]),
        ytm-video-with-context-renderer:has([data-style="SHORTS"]),
        ytm-video-with-context-renderer:has(a[href^="/shorts/"]),
        yt-lockup-view-model:has(a[href^="/shorts/"]) {
            display: none !important;
        }

        /* Hide Shorts channel tabs and filter chips */
        yt-tab-shape[tab-title="Shorts"],
        [tab-title="Shorts"],
        .single-column-browse-results-tabs > a[href*="/shorts"],
        ytm-chip-cloud-chip-renderer:has([aria-label="Shorts"]),
        ytm-chip-cloud-chip-renderer:has(a[href*="/shorts"]) {
            display: none !important;
        }

        /* =========================================================
           MOBILE YOUTUBE: PLAYABLES
           ========================================================= */

        /*
         * Hide the entire Playables section, including its title,
         * header row, games and surrounding spacing.
         */
        ytm-rich-shelf-renderer[is-playables],
        ytm-rich-section-renderer:has(ytm-rich-shelf-renderer[is-playables]),
        ytm-rich-section-renderer:has([is-playables]),
        ytm-rich-section-renderer:has(a[href*="/playables"]),
        ytm-shelf-renderer:has(a[href*="/playables"]),
        grid-shelf-view-model:has(a[href*="/playables"]),
        ytm-statement-banner-renderer:has(a[href*="/playables"]) {
            display: none !important;
        }

        /* =========================================================
           DESKTOP-LAYOUT FALLBACKS
           These help if Safari loads the desktop YouTube layout.
           ========================================================= */

        ytd-reel-shelf-renderer,
        ytd-rich-section-renderer:has(ytd-reel-shelf-renderer),
        ytd-rich-shelf-renderer[is-shorts],
        ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
        ytd-rich-item-renderer:has(a[href^="/shorts/"]),
        ytd-video-renderer:has([overlay-style="SHORTS"]),
        ytd-guide-entry-renderer:has(a[href^="/shorts"]),
        ytd-mini-guide-entry-renderer:has(a[href^="/shorts"]),
        ytd-rich-shelf-renderer[is-playables],
        ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-playables]),
        ytd-rich-section-renderer:has(a[href*="/playables"]) {
            display: none !important;
        }
    `;

    function injectStyle() {
        if (document.getElementById('cn-hide-youtube-style')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'cn-hide-youtube-style';
        style.textContent = css;

        const parent = document.head || document.documentElement;

        if (parent) {
            parent.appendChild(style);
        } else {
            setTimeout(injectStyle, 25);
        }
    }

    function hide(element) {
        if (element instanceof Element) {
            element.classList.add(HIDDEN_CLASS);
        }
    }

    function normalizedText(element) {
        return (element?.textContent || '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /*
     * YouTube frequently changes or A/B-tests its renderer structure.
     * This fallback finds shelves whose heading is Shorts or Playables,
     * even if the surrounding custom-element name changes.
     */
    function hideSectionsByHeading() {
        const sections = document.querySelectorAll([
            'ytm-rich-section-renderer',
            'ytm-reel-shelf-renderer',
            'ytm-shelf-renderer',
            'grid-shelf-view-model',
            'ytd-rich-section-renderer',
            'ytd-shelf-renderer'
        ].join(','));

        const unwantedHeading =
            /^(?:youtube\s+)?(?:shorts|playables)(?:\b|\s*[-–—:])/i;

        const headingSelectors = [
            ':scope > h1',
            ':scope > h2',
            ':scope > h3',
            ':scope > [role="heading"]',
            '#header h1',
            '#header h2',
            '#header h3',
            '#header [role="heading"]',
            'ytm-shelf-header-renderer',
            '.reel-shelf-title-wrapper',
            '.rich-shelf-header'
        ].join(',');

        for (const section of sections) {
            const headings = section.querySelectorAll(headingSelectors);

            for (const heading of headings) {
                const text = normalizedText(heading);

                if (
                    text.length <= 100 &&
                    unwantedHeading.test(text)
                ) {
                    hide(section);
                    break;
                }
            }
        }
    }

    /*
     * Find links to Shorts and hide their complete card or navigation
     * container rather than hiding only the clickable link.
     */
    function hideShortsLinkContainers() {
        const links = document.querySelectorAll(
            'a[href^="/shorts/"], a[href*="youtube.com/shorts/"]'
        );

        const cardSelector = [
            'ytm-pivot-bar-item-renderer',
            'ytm-rich-item-renderer',
            'ytm-video-with-context-renderer',
            'ytm-reel-item-renderer',
            'ytm-shorts-lockup-view-model',
            'ytm-shorts-lockup-view-model-v2',
            'yt-lockup-view-model',
            'ytd-rich-item-renderer',
            'ytd-video-renderer',
            'ytd-grid-video-renderer',
            'ytd-guide-entry-renderer',
            'ytd-mini-guide-entry-renderer'
        ].join(',');

        for (const link of links) {
            const card = link.closest(cardSelector);

            if (card) {
                hide(card);
            }
        }
    }

    /*
     * Find Playables links and hide their entire shelf or section,
     * including the header.
     */
    function hidePlayablesLinkContainers() {
        const links = document.querySelectorAll(
            'a[href*="/playables"], a[href*="youtube.com/playables"]'
        );

        const sectionSelector = [
            'ytm-rich-section-renderer',
            'ytm-rich-shelf-renderer',
            'ytm-shelf-renderer',
            'grid-shelf-view-model',
            'ytm-statement-banner-renderer',
            'ytd-rich-section-renderer',
            'ytd-rich-shelf-renderer',
            'ytd-shelf-renderer'
        ].join(',');

        for (const link of links) {
            const section = link.closest(sectionSelector);

            if (section) {
                hide(section);
            }
        }
    }

    function cleanPage() {
        injectStyle();
        hideSectionsByHeading();
        hideShortsLinkContainers();
        hidePlayablesLinkContainers();
    }

    /*
     * Debounce repeated page changes so infinite scrolling does not
     * cause an excessive number of full-page scans.
     */
    let cleanupTimer = 0;

    function scheduleCleanup() {
        if (cleanupTimer) {
            return;
        }

        cleanupTimer = window.setTimeout(() => {
            cleanupTimer = 0;
            cleanPage();
        }, 75);
    }

    injectStyle();
    scheduleCleanup();

    /*
     * YouTube loads feed items dynamically and uses client-side
     * navigation, so continue cleaning content added after page load.
     */
    const observer = new MutationObserver(scheduleCleanup);

    function beginObserving() {
        if (!document.documentElement) {
            setTimeout(beginObserving, 25);
            return;
        }

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: [
                'href',
                'aria-label',
                'tab-title',
                'data-style',
                'data-pivot-id',
                'is-playables'
            ]
        });

        cleanPage();
    }

    beginObserving();

    /* Handle navigation that occurs without a full browser refresh. */
    document.addEventListener(
        'yt-navigate-finish',
        scheduleCleanup,
        true
    );

    window.addEventListener(
        'popstate',
        scheduleCleanup,
        true
    );
})();