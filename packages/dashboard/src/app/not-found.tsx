"use client";

import { ErrorView } from "@/ui/components/error-view";

export default function NotFound() {
  return (
    <ErrorView 
      code={404}
      title="Resource Not Found"
      description="The requested tactical asset or secret does not exist in the current sector. Please verify the URL or return to safety."
    />
  );
}
