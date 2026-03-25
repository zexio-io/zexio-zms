"use client";

import { useEffect } from "react";
import { ErrorView } from "@/ui/components/error-view";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an analytics service or logger
    console.error("Global Dashboard Error:", error);
  }, [error]);

  return (
    <ErrorView 
      code={500}
      title="System Malfunction"
      description="The ZMS Engine encountered an unexpected operational failure. Our tactical team has been notified."
      digest={error.digest || error.message}
      reset={reset}
    />
  );
}
