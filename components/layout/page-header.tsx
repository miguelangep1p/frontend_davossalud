import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
