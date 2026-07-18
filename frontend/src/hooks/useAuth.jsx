import { useState } from "react";
function useAuth() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");
    if (token && email) {
      return { email, role: role ?? "admin", token };
    }
    return null;
  });
  const [loading] = useState(false);
  const logout = (navigate) => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    setUser(null);
    if (navigate) navigate("/signin");
    else window.location.href = "/signin";
  };
  const isLoggedIn = !!user;
  return { user, loading, isLoggedIn, logout };
}
export {
  useAuth
};
