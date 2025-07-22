'use client';
import { useEffect } from "react";
import { useState } from "react";
import { getCurrentUser } from "../utils/api";
import LoginButton from "./components/loginButton";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
  getCurrentUser().then(data => {
    if (data?.user) {
      setUser(data.user);
    } else {
      // Not logged in → show login link
    }
  });
}, []);


  const handleLogout = async () => {
    await fetch("http://localhost:8080/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      {!user ? (
        <LoginButton />
      ) : (
        <div>
          <p>Welcome, {user.name}!</p>
          <p>Email: {user.email}</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded mt-4"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
