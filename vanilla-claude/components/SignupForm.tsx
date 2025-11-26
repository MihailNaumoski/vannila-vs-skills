"use client";

import { useState, useEffect } from "react";
import { signup } from "@/app/actions/signup";

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const [referrer, setReferrer] = useState<string | null>(null);

  useEffect(() => {
    // Get UTM source from URL
    const params = new URLSearchParams(window.location.search);
    setSource(params.get("utm_source"));

    // Get referrer
    if (document.referrer) {
      setReferrer(document.referrer);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) return;

    setStatus("loading");
    setMessage("");

    const formData = new FormData();
    formData.append("email", email);
    if (source) formData.append("source", source);
    if (referrer) formData.append("referrer", referrer);

    const result = await signup(formData);

    if (result.success) {
      setStatus("success");
      setMessage(result.message);
      setEmail("");
      onSuccess?.();
    } else {
      setStatus("error");
      setMessage(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={status === "loading"}
          className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20
                     text-white placeholder-white/50 focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:border-transparent disabled:opacity-50
                     transition-all duration-200"
          aria-describedby={message ? "form-message" : undefined}
        />
        <button
          type="submit"
          disabled={status === "loading" || !email}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800
                     disabled:cursor-not-allowed rounded-lg font-semibold
                     transition-colors duration-200 focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {status === "loading" ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
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
      </div>

      {message && (
        <p
          id="form-message"
          role={status === "error" ? "alert" : "status"}
          className={`mt-3 text-sm ${
            status === "success" ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
