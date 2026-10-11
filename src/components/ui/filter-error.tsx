import Link from "next/link";
import { EmptyState } from "./empty-state";
import { Button } from "./button";
export function FilterError({ path }: { path: string }) {
  return (
    <EmptyState
      title="These filters couldn’t be applied"
      description="Check your search, date, or selected filter and try again."
      action={
        <Button asChild variant="outline">
          <Link href={path}>Clear filters</Link>
        </Button>
      }
    />
  );
}
