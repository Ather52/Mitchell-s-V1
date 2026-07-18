import { useEffect, useRef } from "react";
import row1Svg from "../../assets/images/testline.svg";
import row2Svg from "../../assets/images/testline2.svg";
const COPIES = 3;
function IntegrationsMarquee() {
  const lastScrollY = useRef(
    typeof window !== "undefined" ? window.scrollY : 0
  );
  const pos1 = useRef(0);
  const pos2 = useRef(0);
  const row1Ref = useRef(null);
  const row2Ref = useRef(null);
  const svgWidth1 = useRef(0);
  const svgWidth2 = useRef(0);
  useEffect(() => {
    const img1 = row1Ref.current?.querySelector("img");
    const img2 = row2Ref.current?.querySelector("img");
    const measure = () => {
      if (img1) svgWidth1.current = img1.offsetWidth;
      if (img2) svgWidth2.current = img2.offsetWidth;
    };
    if (img1?.complete) measure();
    else img1?.addEventListener("load", measure);
    return () => img1?.removeEventListener("load", measure);
  }, []);
  useEffect(() => {
    const SCROLL_MULTIPLIER = 0.5;
    const onScroll = () => {
      const current = window.scrollY;
      const delta = current - lastScrollY.current;
      lastScrollY.current = current;
      const w1 = svgWidth1.current || (row1Ref.current?.offsetWidth ?? 1200) / COPIES;
      const w2 = svgWidth2.current || (row2Ref.current?.offsetWidth ?? 1200) / COPIES;
      pos1.current -= delta * SCROLL_MULTIPLIER;
      pos2.current += delta * SCROLL_MULTIPLIER;
      if (pos1.current <= -w1) pos1.current += w1;
      if (pos1.current > 0) pos1.current -= w1;
      if (pos2.current <= -w2) pos2.current += w2;
      if (pos2.current > 0) pos2.current -= w2;
      if (row1Ref.current)
        row1Ref.current.style.transform = `translateX(${pos1.current}px)`;
      if (row2Ref.current)
        row2Ref.current.style.transform = `translateX(${pos2.current}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <>
      <style>{`
        .im-fade {
          mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
        }
      `}</style>

      <section className="font-acid w-full py-14 overflow-hidden">
        
        <div className="mb-10 px-4 mx-auto max-w-6xl">
          <p
    className="font-acid text-2xl font-extrabold sm:text-3xl lg:text-[52px]"
    style={{ color: "#888" }}
  >
            Integrates with{" "}
            <strong style={{ color: "#111" }}>
              your
              <br />
              existing business stack
            </strong>
          </p>
        </div>

        
        <div className="im-fade overflow-hidden mb-4">
          <div
    ref={row1Ref}
    className="flex will-change-transform"
    style={{ width: "max-content", gap: "20px" }}
  >
            {Array.from({ length: COPIES }).map((_, i) => <img
    key={i}
    src={row1Svg}
    alt=""
    draggable={false}
    className="h-32 sm:h-40 lg:h-48 w-auto flex-shrink-0 select-none"
  />)}
          </div>
        </div>

        
        <div className="im-fade overflow-hidden">
          <div
    ref={row2Ref}
    className="flex will-change-transform"
    style={{ width: "max-content", gap: "20px" }}
  >
            {Array.from({ length: COPIES }).map((_, i) => <img
    key={i}
    src={row2Svg}
    alt=""
    draggable={false}
    className="h-32 sm:h-40 lg:h-48 w-auto flex-shrink-0 select-none"
  />)}
          </div>
        </div>
      </section>
    </>;
}
export {
  IntegrationsMarquee as default
};
