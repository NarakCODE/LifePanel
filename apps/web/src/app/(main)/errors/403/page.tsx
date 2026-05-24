import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <p className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-black text-[40vw] text-foreground/2 leading-none">
        403
      </p>
      <div className="relative z-10">
        <h1 className="font-medium text-4xl/none tracking-tight">Forbidden</h1>
        <p className="mx-auto mt-5 max-w-sm text-lg text-muted-foreground">
          You don&apos;t have permission to access this resource.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
