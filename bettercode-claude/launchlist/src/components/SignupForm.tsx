"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { submitWaitlist, type SignupState } from "@/app/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-8 py-3 text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-lg shadow-lg shadow-brand-600/25 hover:shadow-xl hover:shadow-brand-600/30 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-600 transition-all duration-200"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Joining...
        </span>
      ) : (
        "Join Waitlist"
      )}
    </button>
  );
}

export default function SignupForm() {
  const [state, formAction] = useActionState<SignupState, FormData>(
    submitWaitlist,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="w-full max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          name="email"
          placeholder="your@email.com"
          required
          autoComplete="email"
          className="flex-1 px-4 py-3 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors duration-200"
        />
        <SubmitButton />
      </div>

      {/* Hidden fields for tracking */}
      <input type="hidden" name="utm_source" value="" />
      <input type="hidden" name="referrer" value="" />

      {/* Status messages */}
      <div className="mt-4 min-h-[24px]">
        {state?.success && (
          <p className="text-green-600 dark:text-green-400 text-sm text-center animate-fade-in">
            {state.message}
          </p>
        )}
        {state?.error && (
          <p className="text-red-600 dark:text-red-400 text-sm text-center animate-fade-in">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
