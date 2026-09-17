'use client';

import { useEffect, useRef } from 'react';

/**
 * Adds the `.visible` class to elements with `.reveal` as they enter the viewport.
 * Uses IntersectionObserver for performance.
 */
export function useScrollReveal(rootMargin = '-5%') {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Once revealed, stop observing
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin, threshold: 0.08 }
    );

    // Observe all .reveal elements within the container
    const targets = container.querySelectorAll('.reveal');
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [rootMargin]);

  return ref;
}
