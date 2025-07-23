"use client"
import { useState, useEffect } from "react";
import Step1 from "../components/onboarding/Step1";
import Step2 from "../components/onboarding/Step2";
import Step3 from "../components/onboarding/Step3";
import { useRouter } from "next/navigation";
import { useUser } from "../components/UserContext";
import { getCurrentUser } from "../../utils/api";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, setUser } = useUser();

  useEffect(() => {
    async function fetchUser() {
      const data = await getCurrentUser();
      if (data && data.user) setUser(data.user);
    }
    if (!user) fetchUser();
  }, [user, setUser]);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleFinish = async () => {
    setLoading(true);
    // Send onboarding data to backend
    await fetch("http://localhost:8080/auth/complete-onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    // Fetch latest user info and update context
    const res = await fetch("http://localhost:8080/auth/me", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      if (data.user) setUser(data.user);
    }
    setLoading(false);
    router.replace("/dashboard");
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      {step === 1 && (
        <Step1 data={formData} onChange={setFormData} onNext={handleNext} />
      )}
      {step === 2 && (
        <Step2 data={formData} onChange={setFormData} onNext={handleNext} onBack={handleBack} />
      )}
      {step === 3 && (
        <Step3 data={formData} onChange={setFormData} onBack={handleBack} onFinish={handleFinish} loading={loading} />
      )}
    </div>
  );
}
