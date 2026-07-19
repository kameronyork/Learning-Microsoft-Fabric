// ==UserScript==
// @name         Export Current YouTube HTML - Mobile Safari
// @namespace    https://coopernorman.com/userscripts
// @version      1.1.0
// @description  Exports the currently rendered YouTube DOM as an HTML file for troubleshooting.
// @match        https://m.youtube.com/*
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const BUTTON_ID = 'cn-export-youtube-html-button';
    const STYLE_ID = 'cn-export-youtube-html-style';

    let exporting = false;

    function makeTimestamp() {
        return new Date()
            .toISOString()
            .replace(/[:.]/g, '-');
    }

    /*
     * Normal outerHTML does not include open Shadow DOM.
     *
     * This places a copy of any accessible open shadow root inside
     * a template element so it will appear in the exported file.
     */
    function includeOpenShadowRoots(sourceRoot, clonedRoot) {
        const sourceElements = [
            sourceRoot,
            ...sourceRoot.querySelectorAll('*')
        ];

        const clonedElements = [
            clonedRoot,
            ...clonedRoot.querySelectorAll('*')
        ];

        const total = Math.min(
            sourceElements.length,
            clonedElements.length
        );

        for (let index = 0; index < total; index += 1) {
            const sourceElement = sourceElements[index];
            const clonedElement = clonedElements[index];

            if (!sourceElement.shadowRoot) {
                continue;
            }

            const template = document.createElement('template');

            template.setAttribute(
                'data-exported-open-shadow-root',
                'true'
            );

            template.innerHTML =
                sourceElement.shadowRoot.innerHTML;

            clonedElement.prepend(template);
        }
    }

    function buildHtmlSnapshot() {
        const clonedDocument =
            document.documentElement.cloneNode(true);

        includeOpenShadowRoots(
            document.documentElement,
            clonedDocument
        );

        /*
         * Remove this exporter's controls from the snapshot.
         */
        clonedDocument
            .querySelectorAll(
                `#${BUTTON_ID}, #${STYLE_ID}`
            )
            .forEach((element) => element.remove());

        /*
         * Remove executable scripts. They are not needed to inspect
         * the rendered video-card structure and can make the file
         * substantially larger.
         */
        clonedDocument
            .querySelectorAll('script, noscript')
            .forEach((element) => element.remove());

        const captureDetails = [
            'YouTube mobile DOM snapshot',
            `Captured: ${new Date().toISOString()}`,
            `URL: ${location.href}`,
            `Viewport: ${window.innerWidth}x${window.innerHeight}`,
            `User agent: ${navigator.userAgent}`
        ].join('\n');

        return [
            '<!DOCTYPE html>',
            `<!--\n${captureDetails}\n-->`,
            clonedDocument.outerHTML
        ].join('\n');
    }

    function downloadFile(blob, filename) {
        const objectUrl =
            URL.createObjectURL(blob);

        const link =
            document.createElement('a');

        link.href = objectUrl;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
        }, 60000);
    }

    async function exportHtml(button) {
        if (exporting) {
            return;
        }

        exporting = true;
        button.disabled = true;
        button.textContent = 'Preparing HTML…';

        try {
            const html =
                buildHtmlSnapshot();

            const filename =
                `youtube-mobile-dom-${makeTimestamp()}.html`;

            const blob = new Blob(
                [html],
                {
                    type: 'text/html;charset=utf-8'
                }
            );

            /*
             * The iPhone Share Sheet is generally the easiest way to
             * save the file to Files. Fall back to a normal browser
             * download when file sharing is unavailable.
             */
            if (
                typeof File === 'function' &&
                typeof navigator.share === 'function'
            ) {
                const file = new File(
                    [blob],
                    filename,
                    {
                        type: 'text/html'
                    }
                );

                const shareData = {
                    files: [file],
                    title: 'YouTube DOM Snapshot'
                };

                const canShareFile =
                    typeof navigator.canShare !== 'function' ||
                    navigator.canShare(shareData);

                if (canShareFile) {
                    try {
                        button.textContent = 'Opening Share Sheet…';

                        await navigator.share(shareData);

                        button.textContent = 'HTML exported';

                        window.setTimeout(() => {
                            button.textContent =
                                'Export YouTube HTML';
                        }, 2000);

                        return;
                    } catch (error) {
                        /*
                         * Do not automatically download when the user
                         * intentionally closes the Share Sheet.
                         */
                        if (error?.name === 'AbortError') {
                            button.textContent =
                                'Export cancelled';

                            window.setTimeout(() => {
                                button.textContent =
                                    'Export YouTube HTML';
                            }, 1500);

                            return;
                        }

                        console.warn(
                            'Share Sheet export failed; using download fallback.',
                            error
                        );
                    }
                }
            }

            button.textContent = 'Downloading HTML…';

            downloadFile(
                blob,
                filename
            );

            button.textContent = 'HTML downloaded';

            window.setTimeout(() => {
                button.textContent =
                    'Export YouTube HTML';
            }, 2000);
        } catch (error) {
            console.error(
                'Unable to export YouTube HTML:',
                error
            );

            button.textContent = 'Export failed';

            window.setTimeout(() => {
                button.textContent =
                    'Export YouTube HTML';
            }, 2000);
        } finally {
            exporting = false;
            button.disabled = false;
        }
    }

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style =
            document.createElement('style');

        style.id = STYLE_ID;

        style.textContent = `
            #${BUTTON_ID} {
                position: fixed !important;
                top: 92px !important;
                left: 8px !important;
                z-index: 2147483647 !important;

                max-width: 190px !important;
                padding: 10px 12px !important;

                border: 2px solid white !important;
                border-radius: 9px !important;

                background: #b00020 !important;
                color: white !important;

                font-family:
                    -apple-system,
                    BlinkMacSystemFont,
                    sans-serif !important;

                font-size: 13px !important;
                font-weight: 700 !important;
                line-height: 1.2 !important;

                box-shadow:
                    0 3px 12px
                    rgba(0, 0, 0, 0.55) !important;

                opacity: 0.94 !important;
            }

            #${BUTTON_ID}:disabled {
                opacity: 0.7 !important;
            }
        `;

        (
            document.head ||
            document.documentElement
        ).appendChild(style);
    }

    function addButton() {
        injectStyle();

        if (document.getElementById(BUTTON_ID)) {
            return;
        }

        const button =
            document.createElement('button');

        button.id = BUTTON_ID;
        button.type = 'button';
        button.textContent = 'Export YouTube HTML';

        button.addEventListener(
            'click',
            (event) => {
                event.preventDefault();
                event.stopPropagation();

                exportHtml(button);
            },
            true
        );

        (
            document.body ||
            document.documentElement
        ).appendChild(button);
    }

    addButton();

    /*
     * Restore the button if YouTube removes it while navigating.
     */
    const observer =
        new MutationObserver(addButton);

    observer.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true
        }
    );

    window.setInterval(
        addButton,
        2000
    );
})();