import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";

import { getUserProfileAction } from "@/lib/actions/user.actions";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserProfileAction();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main className="relative min-h-screen w-full flex-1 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.08),transparent_28%),hsl(var(--background))]">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
          <SidebarTrigger className="rounded-xl border bg-card shadow-sm" />
          <AppBreadcrumb />
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
