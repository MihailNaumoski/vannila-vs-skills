"use client";

import { useEffect, useState, useCallback } from "react";

interface CounterProps {
  initialCount: number;
}

export function Counter({ initialCount }: CounterProps) {
  const [count, setCount] = useState(initialCount);

  const refreshCount = useCallback(async () => {
    try {
      const response = await fetch("/api/count");
      if (response.ok) {
        const data = await response.json();
        setCount(data.count);
      }
    } catch {
      // Silently fail, keep current count
    }
  }, []);

  useEffect(() => {
    // Refresh count every 30 seconds
    const interval = setInterval(refreshCount, 30000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  // Expose refresh function for use after signup
  useEffect(() => {
    (window as unknown as { refreshWaitlistCount?: () => void }).refreshWaitlistCount = refreshCount;
    return () => {
      delete (window as unknown as { refreshWaitlistCount?: () => void }).refreshWaitlistCount;
    };
  }, [refreshCount]);

  if (count === 0) {
    return (
      <p className="text-white/70 text-lg">
        Be the first to join our waitlist!
      </p>
    );
  }

  return (
    <p className="text-white/70 text-lg">
      Join{" "}
      <span className="font-bold text-white tabular-nums">
        {count.toLocaleString()}
      </span>{" "}
      {count === 1 ? "other" : "others"} on the waitlist
    </p>
  );
}
