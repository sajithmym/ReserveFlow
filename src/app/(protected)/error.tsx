"use client";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
      <AlertCircle className="mx-auto mb-4 text-amber-600" />
      <h1 className="text-xl font-semibold">We couldn’t load this page</h1>
      <p className="mt-3 mb-6 text-sm text-stone-500">
        Please try again. If it continues, contact your workspace administrator.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
