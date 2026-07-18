import Logo from "../../assets/images/fsec.svg";
import Logo1 from "../../assets/images/logo_black.svg";
import confirmed from "../../assets/images/confirmed.svg";
const FeaturesSection = () => {
  return <>
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/grotesk');
        // .fs-font { font-family: 'Fff Acidgrotesk', sans-serif; } 

        .fs-card {
          border-radius: 16px;
          overflow: hidden; 
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .fs-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
        }

        .phone-icon-track {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .phone-icon-track .dashes {
          flex: 1;
          border-top: 2px dashed #ccc;
        }
        .icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .pos-icons {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-left: 8px;
        }
        .pos-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .chat-bubble-q {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 20px 20px 20px 4px;
          padding: 8px 14px;
          font-size: 13px;
          color: #222;
          display: inline-block;
        }
        .chat-bubble-a {
          background: #f5e032;
          border-radius: 20px 20px 4px 20px;
          padding: 8px 14px;
          font-size: 13px;
          color: #222;
          font-weight: 600;
          display: inline-block;
        }
        .chat-bot-icon {
          width: 28px;
          height: 28px;
          background: #f5e032;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .confirmed-card {
          background: white;
          border-radius: 12px;
          padding: 14px 18px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 14px;
          max-width: 280px;
        }
        .confirmed-dot {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #e8453c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .schedule-btn {
          background: #1a1a1a;
          color: white;
          border: none;
          border-radius: 999px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .schedule-btn:hover { background: #333; }
      `}</style>

      <section className="fs-font w-full px-4 sm:px-8 lg:px-16 py-16 lg:py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          <div className="flex items-start">
            <h2
    className="text-4xl max-w-4xl sm:text-5xl
                font-bold leading-none tracking-tight
                px-4"
  >
              <span className="text-[#0006]">
                The AI phone answering platform
              </span>{" "}
              <span style={{ color: "#111" }}>
                for all of your business's needs
              </span>
            </h2>
          </div>

          {
    /* Right: Description + CTA */
  }
          <div className="flex flex-col justify-center gap-5">
            <p className="text-base" style={{ color: "#0006" }}>
              Mitchells is 24/7 Voice AI phone answering for businesses. It takes
              orders and bookings, answers FAQs, and syncs tickets and
              payments to your POS & ERP systems. Built for single,
              multi unit, and enterprise brands.
            </p>
            <div>
              <button className="schedule-btn">Schedule a demo</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {
    /* Card 1 — AI Phone Orders (white, col-span 4) */
  }
          <div
    className="fs-card lg:col-span-4 p-6 flex flex-col justify-between min-h-64"
    style={{ background: "#fff", border: "1px solid #e8e8e8" }}
  >
            <p
    className="fs-font text-base"
    style={{ color: "#888", lineHeight: "1.6" }}
  >
              Mitchells takes AI phone orders for pickup and shipping/delivery, and sends
              them to your system—
              <strong style={{ color: "#222" }}>
                so your staff can focus on operations.
              </strong>
            </p>
            <div className="mt-6">
              <img src={Logo} />
            </div>
          </div>

          {
    /* Card 2 — Credit card photo (col-span 4) */
  }
          <div
    className="fs-card lg:col-span-4 relative min-h-64 flex items-end p-6"
    style={{
      background: "linear-gradient(to bottom, #3a3020, #1a1508)",
      backgroundImage: "url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80)",
      backgroundSize: "cover",
      backgroundPosition: "center"
    }}
  >
            <div
    className="absolute inset-0"
    style={{
      background: "linear-gradient(to top, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.2) 100%)"
    }}
  />
            <p className="fs-font relative z-10 text-xl font-black text-white leading-tight">
              Mitchells securely takes credit card payments over the phone.
            </p>
          </div>

          {
    /* Card 3 — Business knowledge (dark, col-span 4) */
  }
          <div
    className="fs-card lg:col-span-4 p-6 flex flex-col justify-between min-h-64"
    style={{ background: "#1a1a1a" }}
  >
            <p
    className="fs-font text-xl font-black leading-tight"
    style={{ color: "#eee" }}
  >
              Mitchells knows your business and answers questions{" "}
              <span style={{ color: "#f5e032" }}>with total accuracy.</span>
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="chat-bubble-q">What time do you close?</div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <div className="chat-bubble-a">We close at 8pm.</div>
                <div className="chat-bot-icon">
                  <img src={Logo1} className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {
    /* Card 4 — POS Sync (white, col-span 5) */
  }
          <div
    className="fs-card lg:col-span-5 p-6 flex flex-col justify-between min-h-72 overflow-hidden relative"
    style={{ background: "#fff", border: "1px solid #e8e8e8" }}
  >
            <p
    className="fs-font font-black text-base"
    style={{ color: "#888", lineHeight: "1.6" }}
  >
              Mitchells syncs with top POS & ERP systems like Square, Toast, SpotOn and
              Clover{" "}
              <strong style={{ color: "#222" }}>
                to streamline orders and customer bookings.
              </strong>
            </p>
            <div className="flex justify-center mt-4">
              <img
    src="https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=400&q=80"
    alt="POS system"
    className="object-contain max-h-40 drop-shadow-xl"
    style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.18))" }}
  />
            </div>
          </div>

          {
    /* Card 5 — Reservations (yellow, col-span 7) */
  }
          <div
    className="fs-card lg:col-span-7 p-6 flex flex-col justify-between min-h-72"
    style={{ background: "#fadb3c" }}
  >
            {
    /* Confirmed card UI */
  }
            <div className="flex justify-center mb-4">
              <img src={confirmed} />
            </div>

            <p
    className="fs-font text-lg font-black leading-tight max-w-sm"
    style={{ color: "#222" }}
  >
              <span className="text-[#0006]">
                Mitchells lets customers request bookings 24/7 by phone,{" "}
              </span>
              <strong>cutting wait times & boosting satisfaction.</strong>
            </p>
          </div>
        </div>
      </section>
    </>;
};
var stdin_default = FeaturesSection;
export {
  stdin_default as default
};
