export type OnboardingStep = "welcome" | "create-org" | "create-project" | "recovery-kit" | "complete";

export interface OnboardingState {
  currentStep: OnboardingStep;
  orgName?: string;
  orgId?: string;
  projectName?: string;
  recoveryShards?: string[];
  isComplete: boolean;
}
