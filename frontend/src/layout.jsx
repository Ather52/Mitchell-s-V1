import { Outlet } from "react-router-dom";
import Sidebar from "./components/sidebar";
import { C } from "./theme/colors";

function Layout() {
  return <div style={{ display: "flex", height: "100vh", background: C.pageBg, fontFamily: C.font, overflow: "hidden" }}>
      <Sidebar />
      <main className="flex-1" style={{ minWidth: 0, height: "100vh", overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>;
}
export {
  Layout as default
};
