// ==UserScript==
// @name         Hide YouTube Shorts & Bottom Bar
// @namespace    http://tampermonkey.net
// @version      1.0
// @description  Hides shorts shelves and the bottom shorts navigation item on mobile YouTube in Safari
// @match        https://m.youtube.com/*
// @match        https://www.youtube.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const css = `
        /* Hide the Shorts icon/button in the bottom bar navigation */
        ytm-pivot-bar-item-renderer:has(a[href*="/shorts"]),
        ytm-pivot-bar-item-renderer[data-pivot-id="shorts"],
        a[href*="/shorts"] {
            display: none !important;
        }
        /* Hide Shorts shelves, grids, and carousels on the homepage/feeds */
        ytm-reel-shelf-renderer,
        ytd-reel-shelf-renderer,
        [is-shorts],
        [title="Shorts"],
        [aria-label="Shorts"] {
            display: none !important;
        }
    `;
    
    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(css);
    } else {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        document.documentElement.appendChild(style);
    }
})();