function SocialProofSection() {
  return <>
      <style>{`
        @media (max-width: 1023px) { .social-section { padding: 80px 40px !important; } }
        @media (max-width: 639px)  {
          .social-section { padding: 60px 20px !important; }
          .social-card { padding: 24px 18px !important; border-radius: 16px !important; }
          .social-quote { font-size: 1.08rem !important; line-height: 1.65 !important; }
        }
      `}</style>
      <section id="review" className="social-section" style={{ background: "#fff", padding: "120px 60px" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: ".79rem", fontWeight: 700, letterSpacing: ".13em", textTransform: "uppercase", color: "#2A5BA8", marginBottom: "14px", display: "block", fontFamily: "Sora,sans-serif" }}>Customer Stories</div>
          <h2 style={{ fontFamily: "Sora,sans-serif", fontSize: "clamp(2.5rem,4.4vw,4rem)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-.03em", color: "#0F0F1A", maxWidth: "480px", margin: "0 auto" }}>
            Pays for itself<br /><em style={{ fontFamily: "Lora,serif", fontStyle: "italic", fontWeight: 600 }}>on the first shift.</em>
          </h2>

          <div style={{ maxWidth: "620px", margin: "52px auto 0" }}>
            <div className="social-card" style={{ background: "#fff", border: "1px solid #EAEAF2", borderRadius: "20px", padding: "40px", boxShadow: "0 20px 60px rgba(15,15,26,.07)" }}>
              
              <div style={{ display: "flex", gap: "3px", marginBottom: "18px", justifyContent: "flex-start" }}>
                {Array.from({ length: 5 }).map((_, i) => <svg key={i} viewBox="0 0 20 20" style={{ width: "17px", height: "17px", fill: "#C8973A" }}>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>)}
              </div>

              <p className="social-quote" style={{ fontFamily: "Lora,Georgia,serif", fontSize: "1.3rem", fontStyle: "italic", lineHeight: 1.72, color: "#0F0F1A", marginBottom: "26px", fontWeight: 400, textAlign: "left" }}>
                "We used to lose 20–30 orders every single Friday night — phones ringing, staff overwhelmed. Since Mitchells went live we have had zero missed calls. Zero. It literally paid for itself on the first night. My staff stopped answering the phone entirely and just focused on cooking. The customers do not even know they are talking to AI — it is that natural."
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "13px", borderTop: "1px solid #EAEAF2", paddingTop: "22px" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "linear-gradient(135deg,#2A5BA8,#1B3F7A)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.22rem", color: "#fff", flexShrink: 0 }}>MH</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontFamily: "Sora,sans-serif", fontSize: "1.01rem", fontWeight: 700, color: "#0F0F1A" }}>Mohamed H.</div>
                  <div style={{ fontFamily: "Sora,sans-serif", fontSize: ".87rem", color: "#8888A8", marginTop: "2px" }}>Owner &amp; Founder</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#F0EFFC", color: "#1B3F7A", fontSize: ".86rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "2px 8px", borderRadius: "100px", marginTop: "4px" }}>Hot Chickz</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>;
}
export {
  SocialProofSection as default
};
