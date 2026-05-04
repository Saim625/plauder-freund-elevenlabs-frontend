import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_SERVER_URL + "/api";

export default function Avatar({ userToken }) {
  console.log("Avatar component rendered with token:", userToken);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const res = await axios.get(`${API_BASE}/user/avatar/${userToken}`);

        const avatar = res?.data?.avatarUrl;

        if (avatar) {
          setAvatarUrl(`${import.meta.env.VITE_SERVER_URL}${avatar}`);
        }
      } catch (err) {
        console.error("Avatar fetch failed", err);
      }
    };

    if (userToken) fetchAvatar();
  }, [userToken]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-92 h-92 flex items-center justify-center">
        {/* Pulsing oval background (behind avatar) */}
        <div className="absolute inset-0 oval-glow"></div>

        {/* Avatar image with transparent background */}
        <img
          src={avatarUrl || "/image__4_-removebg-preview.png"}
          alt="Avatar"
          className="relative z-10 w-full h-full object-contain"
          style={{ filter: "drop-shadow(0 0 10px rgba(0,0,0,0.1))" }}
        />
      </div>
    </div>
  );
}
