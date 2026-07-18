import { useState } from "react";
const faqs = [
  {
    q: "Is Voice AI cheaper and better than a human or answering service?",
    a: "Yes. Mitchells answers 100% of calls, never calls in sick, and follows your menu and policies perfectly. Most operators cut phone time for staff, reduce errors, and capture orders they used to miss. You pay a predictable software fee instead of hourly wages or per-minute call center costs."
  },
  {
    q: "What can Mitchells handle on a call?",
    a: "Pickup and delivery orders, payments for orders, reservations, menu and allergen questions, hours and directions, wait times, order status, catering inquiries, and smart routing to your team. It recognizes repeat callers, supports multiple languages, and syncs clean tickets to your systems."
  },
  {
    q: "Can AI phone ordering take payments over the phone?",
    a: "Yes, Mitchells can securely take payments over the phone for both pickup and delivery orders. Our AI phone agent integrates directly with your business's POS system, allowing customers to place an order and pay instantly using their credit or debit card without needing staff intervention. This eliminates missed revenue from callers who want to prepay, speeds up order processing, and reduces front-of-house stress. Whether it's a product pickup, catering order, or a busy shipping rush, Mitchells ensures every call is answered, payment is captured safely, and the order syncs directly to your system."
  },
  {
    q: "How fast is setup and what do we need?",
    a: "Mitchells can get you up and running in less than 24 hours. Connect your systems, import the menu/catalog, choose a greeting, set hours and rules, then test. Most businesses go live in under a day. Our team can do white-glove setup if you want it done for you."
  },
  {
    q: "Does it work for multi-location and franchise groups?",
    a: "Yes. Manage a shared menu with per-store overrides, local numbers, store-specific hours and holidays, and region-based routing. Analytics roll up by location so you see call volume, conversion, and average ticket per store."
  },
  {
    q: "What happens with edge cases or unhappy callers?",
    a: "Mitchells detects intent and either solves it or hands off cleanly. It can transfer to a live line, capture a voicemail with transcript, or send a message to your team with caller info and context so guests get fast, human follow-up."
  }
];
function FAQSection() {
  const [open, setOpen] = useState(0);
  return <>
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/grotesk');
        .faq-font { font-family: 'Fff Acidgrotesk', sans-serif; }

        .faq-item {
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .faq-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 28px 0;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          gap: 16px;
        }
        .faq-chevron {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
          color: #fff;
          font-size: 18px;
        }
        .faq-chevron.open {
          transform: rotate(180deg);
        }
        .faq-body {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.35s ease, padding 0.35s ease;
        }
        .faq-body.open {
          max-height: 600px;
          padding-bottom: 24px;
        }
      `}</style>

      <section
    className="faq-font w-full px-4 sm:px-8 lg:px-16 py-20 lg:py-28"
    style={{ background: "#111111" }}
  >
        <div className="max-w-3xl mx-auto">
          
          <h2 className="faq-font text-4xl sm:text-5xl lg:text-6xl font-black text-center text-white leading-tight mb-14">
            Frequently asked
            <br />
            questions
          </h2>

          
          <div>
            {faqs.map((faq, i) => <div key={i} className="faq-item">
                <button
    className="faq-btn"
    onClick={() => setOpen(open === i ? -1 : i)}
    aria-expanded={open === i}
  >
                  <span
    className="faq-font text-base sm:text-lg font-black"
    style={{ color: "#fff" }}
  >
                    {faq.q}
                  </span>
                  <span className={`faq-chevron ${open === i ? "open" : ""}`}>
                    ⌃
                  </span>
                </button>

                <div className={`faq-body ${open === i ? "open" : ""}`}>
                  <p
    className="faq-font text-sm sm:text-base leading-relaxed"
    style={{ color: "#999" }}
  >
                    {faq.a}
                  </p>
                </div>
              </div>)}
          </div>
        </div>
      </section>
    </>;
}
export {
  FAQSection as default
};
