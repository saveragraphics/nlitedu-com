"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function VerifyRedirect() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const idParam = searchParams.get("id") || searchParams.get("number") || "";
    if (idParam) {
      window.location.replace(`https://certiva.careercue.in/verify/${idParam}`);
    } else {
      window.location.replace("https://certiva.careercue.in/verify");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black text-slate-500 font-medium">
      Redirecting to Certiva Verification System...
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin dark:border-blue-500" />
        </div>
      }
    >
      <VerifyRedirect />
    </Suspense>
  );
}
