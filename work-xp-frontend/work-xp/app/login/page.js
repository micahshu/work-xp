"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../utils/api";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const res = await getCurrentUser();
      if (res && res.user) {
        if (res.hasProfile) {
          router.replace("/dashboard");
        } else {
          router.replace("/onboarding");
        }
      }
    }
    checkUser();
  }, [router]);

  const handleLogin = () => {
    window.location.href = "http://localhost:8080/auth/asana";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-6 py-3 rounded shadow"
      >
        Login with Asana
      </button>
    </div>
  );
}
