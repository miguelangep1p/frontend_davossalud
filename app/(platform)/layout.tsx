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
      <main className="flex-1 w-full relative bg-background min-h-screen">
        <div className="p-4 flex items-center gap-4 ">
          <SidebarTrigger />
          <AppBreadcrumb />
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
