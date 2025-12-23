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

    const isAdminRoute = window.location.pathname.startsWith("/admin");
    setIsAdmin(isAdminRoute); // ✅ route type only

    const route = isAdminRoute
      ? `${
          import.meta.env.VITE_SERVER_URL
        }/api/auth/verify-admin-token?token=${tokenParam}`
      : `${
          import.meta.env.VITE_SERVER_URL
        }/api/auth/verify-user-token?token=${tokenParam}`;

    fetch(route)
      .then((res) => res.json())
      .then((data) => {
        setIsAuthorized(!!data.success); // ✅ token validity only
      })
      .catch(() => {
        setIsAuthorized(false);
      });
  }, []);

  return { isAuthorized, token, isAdmin };
}
