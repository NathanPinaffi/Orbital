import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

/** Anima em cascata todo filho marcado com [data-animate] dentro do container. */
export function useGsapEntrance<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate]",
        { opacity: 0, y: 24, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power3.out", stagger: 0.08 },
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return ref;
}
