import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const isMobile = Capacitor.isNativePlatform();

export function useTokenAuth() {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [needsTokenInput, setNeedsTokenInput] = useState(false);

  useEffect(() => {
    const init = async () => {
      let tokenParam;

      if (isMobile) {
        // Mobile — check saved token in Preferences
        const { value } = await Preferences.get({ key: "user_token" });
        if (!value) {
          // No saved token — show input screen
          setNeedsTokenInput(true);
          setIsAuthorized(false);
          return;
        }
        tokenParam = value;
      } else {
        // Web — read from URL as before
        const urlParams = new URLSearchParams(window.location.search);
        tokenParam = urlParams.get("token") || "f106ae2";
      }

      if (!tokenParam) {
        setIsAuthorized(false);
        return;
      }

      setToken(tokenParam);

      const isAdminRoute = window.location.pathname.startsWith("/admin");
      setIsAdmin(isAdminRoute);

      const route = isAdminRoute
        ? `${import.meta.env.VITE_SERVER_URL}/api/auth/verify-admin-token?token=${tokenParam}`
        : `${import.meta.env.VITE_SERVER_URL}/api/auth/verify-user-token?token=${tokenParam}`;

      fetch(route)
        .then((res) => res.json())
        .then((data) => {
          setIsAuthorized(!!data.success);
          if (isAdminRoute && data.success) setRole(data.role);
        })
        .catch(() => setIsAuthorized(false));
    };

    init();
  }, []);

  // Called from TokenInputScreen after user enters token
  const saveToken = async (inputToken) => {
    await Preferences.set({ key: "user_token", value: inputToken });
    setToken(inputToken);
    setNeedsTokenInput(false);
    // Re-run verification
    const res = await fetch(
      `${import.meta.env.VITE_SERVER_URL}/api/auth/verify-user-token?token=${inputToken}`,
    );
    const data = await res.json();
    setIsAuthorized(!!data.success);
  };

  const clearToken = async () => {
    await Preferences.remove({ key: "user_token" });
    setToken(null);
    setIsAuthorized(false);
    setNeedsTokenInput(true);
  };

  return {
    isAuthorized,
    token,
    isAdmin,
    role,
    needsTokenInput,
    saveToken,
    clearToken,
  };
}
