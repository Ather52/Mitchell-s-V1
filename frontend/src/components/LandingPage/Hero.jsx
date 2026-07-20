import { useRef } from "react";
import Badge from "../../assets/images/badge.png";
const HeroSection = () => {
  const headingRef = useRef(null);
  return <>
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/grotesk');

        .hero-font {
          font-family: 'Fff Acidgrotesk', 'Arial Black', sans-serif;
        }

     
      `}</style>

      <section className="relative min-h-full top-40 flex items-center justify-center overflow-hidden px-4 mb-24">
        
        <div
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      backgroundSize: "80px 80px"
    }}
  />

        
        <div
    className="absolute inset-0 pointer-events-none"
    style={{
      background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(255,255,255,0.04) 0%, transparent 70%)"
    }}
  />

        
        <div className="relative z-10  flex flex-col items-center text-center max-w-5xl mx-auto pb-20">
          
          <div className="bg-white flex items-center gap-2 px-4 py-2  border border-gray-300 rounded-full mb-10">
            <span>
              <img src={Badge} alt="badge" className="w-10" />
            </span>
            <span className="hero-font text-black text-sm">
              Join 1000+ Businesses
            </span>
          </div>

          
          <div className="relative w-full flex items-center justify-center">
            
            <div
    className="
                absolute
                flex items-end
                md:left-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2
                left-1/2 -translate-x-1/2 md:translate-x-0
                -top-24 md:top-auto
              "
    style={{ width: 120 }}
  />

            
            <h1
    ref={headingRef}
    className="
                text-4xl max-w-4xl sm:text-5xl md:text-6xl lg:text-7xl
                font-bold leading-none tracking-tight
                px-4
              "
  >
              24/7 AI Phone Answering for Businesses.
            </h1>
          </div>

          
          <p className="hero-font mt-8 text-sm sm:text-base md:text-lg text-white/40 max-w-xl tracking-wide">
            Never miss a call or order. Let AI handle every inquiry — day or night.
          </p>
        </div>
      </section>
    </>;
};
var stdin_default = HeroSection;
export {
  stdin_default as default
};
