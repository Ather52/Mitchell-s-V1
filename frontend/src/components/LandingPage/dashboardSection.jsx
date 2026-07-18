import dashboardImg from "../../assets/images/bgline.avif";
function DashboardSection() {
  return <>
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/grotesk');
        .ds-font { font-family: 'Fff Acidgrotesk', sans-serif; }

        /* iMac monitor shape */
        .monitor-screen {
          background: #1a1a1a;
          border-radius: 16px 16px 0 0;
          border: 10px solid #1a1a1a;
          box-shadow:
            0 0 0 2px #888,
            0 30px 80px rgba(0,0,0,0.18);
          position: relative;
          overflow: hidden;
        }
        .monitor-chin {
          background: linear-gradient(to bottom, #d4d4d4, #b8b8b8);
          border-radius: 0 0 4px 4px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #aaa;
          border-top: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        }
        .monitor-chin-dot {
          width: 60px;
          height: 8px;
          background: #c0c0c0;
          border-radius: 4px;
          border: 1px solid #aaa;
        }
        .monitor-stand-neck {
          width: 60px;
          height: 40px;
          background: linear-gradient(to bottom, #c8c8c8, #b0b0b0);
          margin: 0 auto;
          clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
        }
        .monitor-stand-base {
          width: 160px;
          height: 14px;
          background: linear-gradient(to bottom, #c0c0c0, #a8a8a8);
          border-radius: 8px;
          margin: 0 auto;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }

        /* Dashboard mock UI */
        .dash-sidebar {
          background: #f8f8f8;
          border-right: 1px solid #e8e8e8;
          width: 160px;
          flex-shrink: 0;
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dash-nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 6px;
          font-size: 10px;
          color: #555;
          cursor: pointer;
        }
        .dash-nav-item.active {
          background: #f0f0f0;
          color: #111;
        }
        .dash-stat-card {
          background: #fff;
          border: 1px solid #efefef;
          border-radius: 8px;
          padding: 10px 12px;
          flex: 1;
        }
        .dash-activity-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 7px 0;
          border-bottom: 1px solid #f5f5f5;
          font-size: 9px;
        }
        .activity-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }

        /* Chart line */
        .chart-line {
          stroke: #a78bfa;
          stroke-width: 2;
          fill: none;
        }
        .chart-fill {
          fill: url(#chartGrad);
          opacity: 0.3;
        }
      `}</style>

      <section className="ds-font w-full px-4 sm:px-8 lg:px-16 py-16 lg:py-24">
        
        <div className="text-center  mx-auto mb-12">
          <h2
    className="ds-font text-4xl sm:text-5xl mb-6 leading-tight font-bold"
    style={{ color: "#888" }}
  >
            Your all-in-one <strong style={{ color: "#111" }}>dashboard</strong>
          </h2>
          <p
    className="ds-font text-base max-w-2xl mx-auto sm:text-lg leading-relaxed"
    style={{ color: "#666" }}
  >
            See live calls, transcripts, transactions, and outcomes in one
            place. Update business info, hours, and specials in seconds, then
            watch Mitchells upsell and recapture missed orders. Track payments for
            orders, earnings, important revenue metrics, and identify peak call
            times so you can staff smarter and grow revenue.
          </p>
        </div>

        
        <div className="max-w-4xl mx-auto">
          
          <img
    src={dashboardImg}
    alt="Dashboard"
    className="w-full h-auto block"
  />
        </div>
      </section>
    </>;
}
export {
  DashboardSection as default
};
