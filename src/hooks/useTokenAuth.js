import { useEffect, useState } from "react";

export function useTokenAuth() {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    if (!tokenParam) {
      setIsAuthorized(false);
      return;
    }
    setToken(tokenParam);

    // Determine route type: admin or user
    const isAdminRoute = window.location.pathname.startsWith("/admin"); // or your admin route path

    const route = isAdminRoute
      ? `${
          import.meta.env.VITE_SERVER_URL
        }/api/auth/verify-admin-token?token=${tokenParam}`
      : `${
          import.meta.env.VITE_SERVER_URL
        }/api/auth/verify-token?token=${tokenParam}`;

    fetch(route)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsAuthorized(true);
          setIsAdmin(isAdminRoute); // If admin route, we know it's admin
        } else {
          setIsAuthorized(false);
          setIsAdmin(false);
        }
      })
      .catch(() => {
        setIsAuthorized(false);
        setIsAdmin(false);
      });
  }, []);

  return { isAuthorized, token, isAdmin };
}
