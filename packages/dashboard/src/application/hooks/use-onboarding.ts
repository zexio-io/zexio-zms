"use client";

import { useState } from "react";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { OnboardingState, OnboardingStep } from "@/domain/entities/onboarding";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useOnboarding() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>({
    currentStep: "welcome",
    isComplete: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setStep = (step: OnboardingStep) => setState(prev => ({ ...prev, currentStep: step }));

  const completeOnboarding = async (data: { orgName: string; projectName: string }) => {
    setIsSubmitting(true);
    try {
      // Tactical Setup: Combined Org + Project + Shard Generation
      const response: any = await ZmsApiClient.post("/onboarding/setup", { 
        orgName: data.orgName
      });
      
      const { recoveryShards, organization } = response.data;

      setState(prev => ({ 
        ...prev, 
        recoveryShards,
        orgId: organization.id,
        currentStep: "recovery-kit" 
      }));
      
      toast.success("Security Shards generated.");
    } catch (error: any) {
        toast.error(error.response?.data?.error?.message || "Initialization failure. Contact mission control.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return {
    state,
    setStep,
    completeOnboarding,
    isSubmitting,
  };
}
