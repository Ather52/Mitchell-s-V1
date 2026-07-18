import { ChartNoAxesCombined, Phone, TrendingUp } from "lucide-react";
const features = [
  {
    icon: <Phone />,
    iconBg: "#f5e032",
    iconColor: "#111",
    title: <>
        Never put another customer{" "}
        <strong style={{ color: "#111" }}>on hold</strong>
      </>,
    desc: "Handles unlimited simultaneous calls, quotes wait times, sends directions, and routes edge cases. Stay responsive during peak business hours so every caller becomes a customer."
  },
  {
    icon: <ChartNoAxesCombined />,
    iconBg: "#e8453c",
    iconColor: "#fff",
    title: <>
        Increase phone revenue 23%{" "}
        <strong style={{ color: "#111" }}>and decrease labor cost</strong>
      </>,
    desc: "Offload routine calls and order taking so you staff leaner. Smart prompts nudge add-ons and popular items that raise average ticket without extra training."
  },
  {
    icon: <TrendingUp />,
    iconBg: "#4a90d9",
    iconColor: "#fff",
    title: <>
        Supercharge front-of-house{" "}
        <strong style={{ color: "#111" }}>staff efficiency</strong>
      </>,
    desc: "No phone interruptions at the counter or office. Fewer errors, faster turns, and clean tickets synced to your systems keep operations smooth."
  }
];
function TurnCallsSection() {
  return <>
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/grotesk');
        .tc-font { font-family: 'Fff Acidgrotesk', sans-serif; }
        .tc-feature-card {
          border: 1px solid #e8e8e8;
          border-radius: 12px;
          padding: 24px;
          background: #fff;
          transition: box-shadow 0.2s ease;
        }
        .tc-feature-card:hover {
          box-shadow: 0 6px 24px rgba(0,0,0,0.07);
        }
        .tc-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          margin-bottom: 16px;
        }
        .tc-icon-box svg {
          width: 20px;
          height: 20px;
        }
        .tc-testimonial {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 12px;
          padding: 28px 24px;
        }
      `}</style>

      <section
    className="tc-font w-full px-4 sm:px-8 lg:px-16 py-16 lg:py-24"
    style={{ background: "#ffffffff" }}
  >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="flex flex-col gap-8">
            
            <div>
              <h2
    className="tc-font text-4xl sm:text-5xl font-black leading-tight mb-5"
    style={{ color: "#111" }}
  >
                Turn every call into cash.
              </h2>
              <p
    className="tc-font text-sm sm:text-base leading-relaxed"
    style={{ color: "#666" }}
  >
                Mitchells is the leading Voice AI for businesses that answers every
                call, takes orders and bookings, securely takes payments,
                and handles catalog questions fast. Recapture missed revenue, lift
                average ticket, and keep staff focused on operations.
              </p>
            </div>

            
            <div className="tc-testimonial lg:mt-48">
              <p
    className="tc-font text-xl sm:text-2xl font-black leading-snug mb-6"
    style={{ color: "#0006" }}
  >
                "This paid for itself in 10 days. Phones are calm, tickets are
                bigger, and my team refuses to go back.{" "}
                <strong>I'll never get rid of Mitchells."</strong>
              </p>
              
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {features.map((f, i) => <div key={i} className="tc-feature-card">
                <div
    className="tc-icon-box"
    style={{ background: f.iconBg, color: f.iconColor }}
  >
                  {f.icon}
                </div>
                <h3
    className="tc-font text-lg sm:text-xl leading-snug mb-3"
    style={{ color: "#666" }}
  >
                  {f.title}
                </h3>
                <p
    className="tc-font text-sm leading-relaxed"
    style={{ color: "#888" }}
  >
                  {f.desc}
                </p>
              </div>)}
          </div>
        </div>
      </section>
    </>;
}
export {
  TurnCallsSection as default
};
