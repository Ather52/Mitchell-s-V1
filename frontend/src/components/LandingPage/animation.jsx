import img1 from "../../assets/images/left.avif";
import img2 from "../../assets/images/right.avif";
const PhoneAnimation = () => {
  return <div className="w-full flex flex-col items-center px-4 py-8">
      
      <div className="relative w-full max-w-5xl flex items-center justify-center">
        
        <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <img
    src={img1}
    alt="left chat"
    className="w-44 xl:w-52 object-contain"
  />
        </div>

        
        <div
    className="relative w-full max-w-[390px] mx-auto"
    style={{ aspectRatio: "390 / 700" }}
  >
          <iframe
    src="https://incomparable-malasada-a3e4d0.netlify.app/"
    title="Phone Animation"
    scrolling="no"
    className="absolute inset-0 w-full h-full border-none"
    style={{ background: "transparent" }}
  />
        </div>

        
        <div className="hidden lg:block absolute right-0 top-1/4 -translate-y-1/4 z-10">
          <img
    src={img2}
    alt="right chat"
    className="w-44 xl:w-52 object-contain"
  />
        </div>
      </div>

      
      <div className="lg:hidden flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 w-full">
        <img
    src={img1}
    alt="left chat"
    className="w-60 sm:w-52 object-contain"
  />
        <img
    src={img2}
    alt="right chat"
    className="w-60 sm:w-52 object-contain"
  />
      </div>
    </div>;
};
var stdin_default = PhoneAnimation;
export {
  stdin_default as default
};
