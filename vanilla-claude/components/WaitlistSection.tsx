"use client";

import { SignupForm } from "./SignupForm";
import { Counter } from "./Counter";

interface WaitlistSectionProps {
  initialCount: number;
}

export function WaitlistSection({ initialCount }: WaitlistSectionProps) {
  const handleSuccess = () => {
    // Refresh the counter after successful signup
    const win = window as unknown as { refreshWaitlistCount?: () => void };
    win.refreshWaitlistCount?.();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <SignupForm onSuccess={handleSuccess} />
      <Counter initialCount={initialCount} />
    </div>
  );
}
