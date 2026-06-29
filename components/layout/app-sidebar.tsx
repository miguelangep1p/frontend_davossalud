"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  CalendarCheck,
  ChevronsUpDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Stethoscope,
  UserCircle2,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { logout } from "@/lib/actions/auth.actions";
import { SystemBrand } from "@/components/brand/system-brand";
import { User } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

function DriveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path d="M8.1 3h7.1l3.2 5.5h-7.1L8.1 3Z" fill="#C2185B" />
      <path d="m5.3 8.5 3.5-5.5 3.5 5.5-3.5 6H1.8l3.5-6Z" fill="#F48FB1" />
      <path d="M12.3 14.5h7l-3.5 6h-7l3.5-6Z" fill="#E91E63" />
    </svg>
  );
}

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType | (() => React.JSX.Element);
  external?: boolean;
};

const quickLinks: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Citas", url: "/citas", icon: CalendarCheck },
];

const clinicalLinks: NavItem[] = [
  { title: "Historia clínica", url: "/historia-clinica", icon: ClipboardList },
  { title: "Recetas", url: "/recetas", icon: FileText },
  { title: "Tratamientos", url: "/tratamientos", icon: Sparkles },
  {
    title: "Drive clínico",
    url: "https://drive.google.com/drive/folders/1kyn4YZLEopOBPEXnCJoCIwXueXglUJsh",
    icon: DriveIcon,
    external: true,
  },
];

const adminLinks: NavItem[] = [
  { title: "Caja", url: "/caja", icon: Wallet },
  { title: "Productos", url: "/productos", icon: Box },
  { title: "Personal", url: "/personal", icon: Stethoscope },
  { title: "Usuarios", url: "/usuarios", icon: UserCog },
];

export function AppSidebar({ user }: { user?: User | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (url: string, external?: boolean) =>
    !external && (pathname === url || pathname.startsWith(`${url}/`));

  const renderItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={isActive(item.url, item.external)}
        className="rounded-xl"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();

          if (item.external) {
            window.open(item.url, "_blank", "noopener,noreferrer");
            return;
          }

          router.push(item.url);
        }}
      >
        <item.icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/70 px-2 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="rounded-2xl border border-rose-100/80 bg-white px-3 py-3 shadow-sm">
              <SystemBrand compact />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarMenu>{quickLinks.map(renderItem)}</SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestión clínica</SidebarGroupLabel>
          <SidebarMenu>{clinicalLinks.map(renderItem)}</SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarMenu>{adminLinks.map(renderItem)}</SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 px-2 pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    {user?.staff?.profilePhoto ? (
                      <AvatarImage
                        src={user.staff.profilePhoto}
                        alt={user.firstName || "Davos Salud"}
                      />
                    ) : null}
                    <AvatarFallback className="rounded-lg bg-rose-100 text-rose-700">
                      DS
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user
                        ? `${user.firstName} ${user.lastName}`
                        : "Dr. Admin"}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email || "admin@davossalud.com"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">
                    {user ? `${user.firstName} ${user.lastName}` : "Dr. Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email || "admin@davossalud.com"}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/perfil")}>
                  <UserCircle2 className="mr-2 size-4" />
                  Mi perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => await logout()}>
                  <LogOut className="mr-2 size-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
