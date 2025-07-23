'use client';
import { useEffect } from "react";
import { getCurrentUser } from "../utils/api";
import LoginButton from "./components/loginButton";
import LogoutButton from "./components/logoutButton";
import { useUser } from "./components/UserContext";

export default function Home() {
  const { user, setUser } = useUser();

  useEffect(() => {
    getCurrentUser().then(data => {
      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    });
  }, [setUser]);

  return (
    <div className="p-8 max-w-md mx-auto">
      {!user ? (
        <LoginButton />
      ) : (
        <div>
          <p>Welcome, {user.name}!</p>
          <p>Email: {user.email}</p>
          <LogoutButton />
        </div>
      )}
    </div>
  );
}
