// Compositor-friendly project stories loop only while visible. HTML is the final still frame.
(() => {
    /** @typedef {{ root: HTMLElement, toggle: HTMLButtonElement | null, details: HTMLDetailsElement[], animations: Animation[], generation: number, failed: boolean, visible: boolean, userPaused: boolean, running: boolean, timer: number | null }} Preview */

    function initProjectPreviews() {
        const roots = document.querySelectorAll('[data-project-preview]');
        if (!roots.length) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const printMedia = window.matchMedia('print');
        const supportsAnimation = typeof Element.prototype.animate === 'function';
        const supportsObserver = typeof window.IntersectionObserver === 'function';
        const holdDuration = 1200;
        let printing = printMedia.matches;
        /** @type {Record<string, Record<string, string>>} */
        let translations = {};
        try { translations = JSON.parse(document.getElementById('translations-data')?.textContent || '{}'); } catch {}
        /** @type {Preview[]} */
        const previews = [];
        /** @type {Map<HTMLDetailsElement, Set<Preview>>} */
        const disclosurePreviews = new Map();

        /** @param {Preview} preview */
        function settle(preview) {
            preview.generation += 1;
            if (preview.timer !== null) window.clearTimeout(preview.timer);
            preview.timer = null;
            preview.animations.forEach(animation => animation.cancel());
            preview.animations = [];
            preview.running = false;
            preview.root.dataset.previewState = 'complete';
        }

        /** @param {Preview} preview */
        function canPlay(preview) {
            return supportsAnimation && supportsObserver && preview.visible && !preview.userPaused
                && !reducedMotion.matches && !printing && !document.hidden && !preview.failed
                && preview.details.every(details => details.open && details.dataset.disclosureState !== 'closing');
        }

        /** @param {Preview} preview */
        function updateControl(preview) {
            preview.root.dataset.previewPaused = String(preview.userPaused);
            const toggle = preview.toggle;
            if (!toggle) return;
            toggle.hidden = !supportsAnimation || !supportsObserver || reducedMotion.matches || printing || preview.failed;
            const labelKey = preview.userPaused ? 'preview_resume' : 'preview_pause';
            const ariaKey = preview.userPaused ? toggle.dataset.previewResumeKey : toggle.dataset.previewPauseKey;
            const lang = document.documentElement.lang;
            const text = translations[lang] || translations.en || {};
            const label = toggle.querySelector('[data-preview-control-label]');
            if (label instanceof HTMLElement) {
                label.dataset.i18nKey = labelKey;
                label.textContent = text[labelKey] || (preview.userPaused ? 'Resume' : 'Pause');
            }
            if (ariaKey) {
                toggle.dataset.i18nAria = ariaKey;
                toggle.setAttribute('aria-label', text[ariaKey] || text[labelKey] || labelKey);
            }
        }

        /** @param {Preview} preview */
        function sync(preview) {
            updateControl(preview);
            if (!canPlay(preview)) {
                settle(preview);
            } else if (!preview.running && preview.timer === null) {
                play(preview);
            }
        }

        /**
         * Keep authored timings finite even if a future card supplies an invalid value.
         * @param {Element} element
         * @param {string} attribute
         * @param {number} fallback
         */
        function timing(element, attribute, fallback) {
            const raw = element.getAttribute(attribute);
            if (raw === null || raw.trim() === '') return fallback;
            const value = Number(raw);
            return Number.isFinite(value) ? Math.max(0, Math.min(value, 4500)) : fallback;
        }

        /**
         * Only opacity and transform are animated; no layout properties or scroll loop.
         * @param {string | null} kind
         * @returns {{ frames: Keyframe[], duration: number }}
         */
        function motion(kind) {
            switch (kind) {
                case 'paper':
                    return {
                        frames: [{ opacity: 0, transform: 'translateY(10px) rotate(-4deg)' }, { opacity: 1, transform: 'translateY(0) rotate(0)' }],
                        duration: 650,
                    };
                case 'unfold':
                    return {
                        frames: [{ opacity: 0, transform: 'perspective(360px) rotateX(-55deg)' }, { opacity: 1, transform: 'perspective(360px) rotateX(0)' }],
                        duration: 700,
                    };
                case 'step':
                    return {
                        frames: [{ opacity: 0.35, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }],
                        duration: 600,
                    };
                case 'flow':
                    return {
                        frames: [{ opacity: 0, transform: 'scaleX(0)' }, { opacity: 1, transform: 'scaleX(1)' }],
                        duration: 500,
                    };
                case 'thinking':
                case 'pulse':
                    return {
                        frames: [
                            { opacity: 0, offset: 0 },
                            { opacity: 1, offset: 0.15 },
                            { opacity: 1, offset: 0.75 },
                            { opacity: 0, offset: 1 },
                        ],
                        duration: kind === 'pulse' ? 700 : 800,
                    };
                case 'signal-y':
                case 'signal-x': {
                    const axis = kind === 'signal-y' ? 'Y' : 'X';
                    return {
                        frames: [
                            { opacity: 0, transform: `translate${axis}(0)`, offset: 0 },
                            { opacity: 1, transform: `translate${axis}(3.6px)`, offset: 0.15 },
                            { opacity: 1, transform: `translate${axis}(18px)`, offset: 0.75 },
                            { opacity: 0, transform: `translate${axis}(24px)`, offset: 1 },
                        ],
                        duration: 450,
                    };
                }
                case 'pan':
                    return {
                        frames: [
                            { transform: 'scale(1) translateY(0)', offset: 0 },
                            { transform: 'scale(1.05) translateY(-2%)', offset: 0.5 },
                            { transform: 'scale(1) translateY(0)', offset: 1 },
                        ],
                        duration: 4000,
                    };
                default:
                    return {
                        frames: [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
                        duration: 500,
                    };
            }
        }

        /** @param {Preview} preview */
        async function play(preview) {
            if (!canPlay(preview)) {
                settle(preview);
                return;
            }

            // Old decode/finished promises cannot restart a newer or paused sequence.
            settle(preview);
            const generation = preview.generation;
            preview.running = true;
            preview.root.dataset.previewState = 'playing';
            const images = Array.from(preview.root.querySelectorAll('img'));
            if (images.length) {
                // Lazy dashboard images should be decoded before their short tour starts.
                await Promise.all(images.map(image => typeof image.decode === 'function'
                    ? Promise.resolve().then(() => image.decode()).catch(() => {})
                    : Promise.resolve()));
                if (preview.generation !== generation) return;
                if (!canPlay(preview)) {
                    settle(preview);
                    return;
                }
            }
            try {
                preview.root.querySelectorAll('[data-preview-motion]').forEach(element => {
                    const { frames, duration: defaultDuration } = motion(element.getAttribute('data-preview-motion'));
                    const delay = timing(element, 'data-preview-delay', 0);
                    const duration = Math.min(timing(element, 'data-preview-duration', defaultDuration), 4500 - delay);
                    const animation = element.animate(frames, {
                        delay,
                        duration,
                        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                        fill: 'both',
                        iterations: 1,
                    });
                    preview.animations.push(animation);
                    // Each finished promise gets its rejection handler before any cancellation.
                    animation.finished.catch(() => {});
                });
            } catch {
                preview.failed = true;
                settle(preview);
                updateControl(preview);
                return;
            }
            Promise.all(preview.animations.map(animation => animation.finished)).then(() => {
                if (preview.generation !== generation) return;
                settle(preview);
                if (!canPlay(preview)) return;
                const nextGeneration = preview.generation;
                preview.timer = window.setTimeout(() => {
                    preview.timer = null;
                    if (preview.generation === nextGeneration) sync(preview);
                }, holdDuration);
            }).catch(() => {});
        }

        roots.forEach(root => {
            if (!(root instanceof HTMLElement)) return;
            const toggle = root.querySelector('[data-preview-toggle]');
            /** @type {Preview} */
            const preview = {
                root,
                toggle: toggle instanceof HTMLButtonElement ? toggle : null,
                details: [],
                animations: [],
                generation: 0,
                failed: false,
                visible: false,
                userPaused: false,
                running: false,
                timer: null,
            };
            for (let ancestor = root.parentElement; ancestor; ancestor = ancestor.parentElement) {
                if (!(ancestor instanceof HTMLDetailsElement)) continue;
                preview.details.push(ancestor);
                if (!disclosurePreviews.has(ancestor)) disclosurePreviews.set(ancestor, new Set());
                disclosurePreviews.get(ancestor)?.add(preview);
            }
            previews.push(preview);
            root.dataset.previewState = 'ready';
            updateControl(preview);
            preview.toggle?.addEventListener('click', () => {
                preview.userPaused = !preview.userPaused;
                sync(preview);
            });
            if (!supportsAnimation || !supportsObserver || reducedMotion.matches || printing || document.hidden) settle(preview);
        });

        if (disclosurePreviews.size) {
            // Observe only ancestors that contain a preview, including the animated closing phase.
            const disclosureObserver = new MutationObserver(records => {
                /** @type {Set<Preview>} */
                const affected = new Set();
                records.forEach(record => {
                    if (!(record.target instanceof HTMLDetailsElement)) return;
                    disclosurePreviews.get(record.target)?.forEach(preview => affected.add(preview));
                });
                affected.forEach(sync);
            });
            disclosurePreviews.forEach((related, details) => {
                disclosureObserver.observe(details, { attributes: true, attributeFilter: ['open', 'data-disclosure-state'] });
                details.addEventListener('toggle', () => related.forEach(sync));
            });
        }

        if (supportsObserver) {
            const byRoot = new Map(previews.map(preview => [preview.root, preview]));
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    const preview = entry.target instanceof HTMLElement ? byRoot.get(entry.target) : undefined;
                    if (!preview) return;
                    preview.visible = entry.isIntersecting && entry.intersectionRatio >= 0.35;
                    sync(preview);
                });
            }, { threshold: [0, 0.35] });
            previews.forEach(preview => observer.observe(preview.root));
        } else {
            // Keep a still preview when automatic visibility suspension is unavailable.
            previews.forEach(settle);
        }

        document.addEventListener('visibilitychange', () => {
            previews.forEach(sync);
        });
        document.addEventListener('portfolio:languagechange', () => {
            previews.forEach(preview => {
                // Let translated text settle, then resume only eligible, unpaused stories.
                settle(preview);
                sync(preview);
            });
        });
        reducedMotion.addEventListener('change', () => {
            previews.forEach(sync);
        });

        /** @param {boolean} active */
        function setPrinting(active) {
            printing = active;
            previews.forEach(sync);
        }
        window.addEventListener('beforeprint', () => setPrinting(true));
        window.addEventListener('afterprint', () => setPrinting(false));
        printMedia.addEventListener('change', event => setPrinting(event.matches));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProjectPreviews, { once: true });
    } else {
        initProjectPreviews();
    }
})();
