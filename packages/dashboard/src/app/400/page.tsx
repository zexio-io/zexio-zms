"use client";

import { ErrorView } from "@/ui/components/error-view";

export default function BadRequest() {
  return (
    <ErrorView 
      code={400}
      title="Bad Request"
      description="The ZMS Engine received an invalid tactical command. Please check your input parameters or system configuration."
    />
  );
}
