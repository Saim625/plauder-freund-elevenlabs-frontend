export function useAdminSession() {
  const token = localStorage.getItem("admin_jwt"); // or cookie later

  return {
    isAdminAuthenticated: Boolean(token),
    adminJwt: token,
  };
}
