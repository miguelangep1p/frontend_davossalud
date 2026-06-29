import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PageErrorStateProps {
  title: string;
  description: string;
  detail: string;
}

export function PageErrorState({
  title,
  description,
  detail,
}: PageErrorStateProps) {
  return (
    <Card className="border-destructive/15 bg-destructive/3">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {detail}
      </CardContent>
    </Card>
  );
}
