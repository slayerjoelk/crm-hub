"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Log error to monitoring service
    console.error("[Error Boundary]", error);
  }, [error]);

  const handleRetry = () => {
    reset();
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-[#0f1011] border border-white/[0.06] rounded-2xl p-8 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-xl font-medium text-[#f7f8f8] mb-2">
            Something went wrong
          </h1>

          {/* Error Message */}
          <p className="text-[#8a8f98] text-sm mb-6">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>

          {/* Error Code (if available) */}
          {error.digest && (
            <div className="mb-6 p-3 bg-[#191a1b] rounded-lg">
              <code className="text-xs text-[#62666d] font-mono">
                {error.digest}
              </code>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-[#5e6ad2] text-white text-sm font-medium hover:bg-[#828fff] transition-colors"
            >
              Try again
            </button>

            <button
              onClick={handleGoHome}
              className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-transparent border border-white/[0.06] text-[#d0d6e0] text-sm font-medium hover:bg-white/[0.04] transition-colors"
            >
              Go to dashboard
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-[#62666d] text-xs mt-6">
          If this problem persists, please contact support with the error code above.
        </p>
      </div>
    </div>
  );
}
