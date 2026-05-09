import { useEffect } from "react";
import { io } from "socket.io-client";

export default function useSocket() {
  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000");
    return () => {
      s.disconnect();
    };
  }, []);
}
