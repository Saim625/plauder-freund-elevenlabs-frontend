import { useEffect, useState } from "react";

export function useTokenAuth() {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Default to false
  const [token, setToken] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");

    if (!tokenParam) {
      setIsAuthorized(false);
      return;
    }
    setToken(tokenParam);

    fetch(
      `${
        import.meta.env.VITE_SERVER_URL
      }/api/auth/verify-token?token=${tokenParam}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsAuthorized(true);
          setIsAdmin(data.isAdmin || false);
        } else {
          setIsAuthorized(false);
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAuthorized(false));
  }, []);

  return { isAuthorized, token, isAdmin };
}
