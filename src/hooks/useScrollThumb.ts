import { useCallback, useEffect, useRef } from 'react';

export function useScrollThumb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const update = useCallback(() => {
    const container = containerRef.current;
    const thumb = thumbRef.current;
    if (!container || !thumb) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight <= clientHeight + 1) {
      thumb.style.opacity = '0';
      return;
    }

    const thumbHeightPct = Math.max((clientHeight / scrollHeight) * 100, 10);
    const maxTopPct = 100 - thumbHeightPct;
    const topPct = (scrollTop / (scrollHeight - clientHeight)) * maxTopPct;

    thumb.style.opacity = '1';
    thumb.style.height = `${thumbHeightPct}%`;
    thumb.style.top = `${topPct}%`;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    update();

    const observer = new MutationObserver(update);
    observer.observe(container, { childList: true, subtree: true, attributes: true });

    return () => observer.disconnect();
  }, [update]);

  return { containerRef, thumbRef, update };
}
