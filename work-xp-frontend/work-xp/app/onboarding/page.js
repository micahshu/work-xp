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
  const router = useRouter();
  const { user, setUser } = useUser();


  useEffect(() => {
    async function fetchUser() {
      const data = await getCurrentUser();
      if (data && data.user) setUser(data.user);
    }
    if (!user) fetchUser();
  }, [user, setUser]);

  // Redirect if user has already completed onboarding
  useEffect(() => {
    if (user && user.onboarding_complete) {
      router.replace("/");
    }
  }, [user, router]);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);



  return (
    <div className="p-8 max-w-md mx-auto">
      {step === 1 && (
        <Step1 data={formData} onChange={setFormData} onNext={handleNext} />
      )}
      {step === 2 && (
        <Step2
          data={formData}
          onChange={updated => setFormData(prev => ({ ...prev, ...updated }))}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {step === 3 && (
        <Step3
          data={formData}
          onChange={updated => setFormData(prev => ({ ...prev, ...updated }))}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
