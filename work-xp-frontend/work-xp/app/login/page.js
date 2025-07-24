"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../utils/api";
import LoginButton from "../components/loginButton";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const res = await getCurrentUser();
      if (res && res.user) {
        if (res.user.onboarding_complete) {
          router.replace("/");
        } else {
          router.replace("/onboarding");
        }
      }
    }
    checkUser();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <LoginButton />
    </div>
  );
}
