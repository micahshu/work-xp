'use client';
import { useUser } from "./UserContext";

export default function LogoutButton() {
  const { setUser } = useUser();

  const handleLogout = async () => {
    await fetch("http://localhost:8080/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };
  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded mt-4"
    >
      Logout
    </button>
  );
}