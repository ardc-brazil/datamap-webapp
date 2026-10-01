import { ReactNode, useEffect, useRef } from "react";
import { IsobarField } from "./IsobarField";
import { StrataMark } from "./StrataMark";

interface Props {
  children: ReactNode;
}

export function HomeHero({ children }: Props) {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    function update() {
      frame = 0;
      const scrolled = Math.min(Math.max(window.scrollY, 0), hero.offsetHeight);
      hero.style.setProperty("--hero-scroll", String(scrolled));
      hero.style.setProperty("--hero-progress", String(scrolled / hero.offsetHeight));
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section ref={heroRef} className="relative overflow-hidden">
      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
        <div
          className="absolute inset-0"
          style={{
            transform: "translateY(calc(var(--hero-scroll, 0) * 0.45px))",
            opacity: "calc(1 - var(--hero-progress, 0) * 0.9)",
          }}
        >
          <IsobarField className="motion-safe:animate-fade-in" />
        </div>
      </div>
      <div
        className="relative flex flex-col items-center justify-center text-center gap-7 px-8 pt-28 md:pt-40 pb-28 md:pb-36 min-h-[calc(100svh-4rem)]"
        style={{
          transform: "translateY(calc(var(--hero-scroll, 0) * 0.18px))",
          opacity: "calc(1 - var(--hero-progress, 0) * 1.1)",
        }}
      >
        <StrataMark className="w-24 h-[8.4rem] md:w-[7.5rem] md:h-[10.5rem] -my-[1.2rem] md:-my-[1.5rem]" />
        <div className="flex flex-col items-center gap-7 motion-safe:animate-rise-in [animation-delay:350ms]">
          {children}
        </div>
      </div>
    </section>
  );
}
