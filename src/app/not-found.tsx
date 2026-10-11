import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center p-6">
      <div className="max-w-md text-center">
        <p className="mb-3 text-xs font-semibold tracking-widest text-emerald-700">404</p>
        <h1 className="text-2xl font-semibold">This page isn’t available</h1>
        <p className="mt-3 mb-6 text-sm leading-6 text-stone-500">
          The item may no longer be available, or you may not have access to it.
        </p>
        <Button asChild>
          <Link href="/">Back to workspace</Link>
        </Button>
      </div>
    </main>
  );
}
