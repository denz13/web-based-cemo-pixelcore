"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Images,
  LayoutGrid,
  LogIn,
  LogOut,
  MapPin,
  PawPrint,
  ScanSearch,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NavMain, type NavItem } from "@/components/nav-main";
import {
  onAuthStateChange,
  getUserProfile,
  logoutUser,
} from "@/src/services/authService";
import type { AuthUser, UserProfile } from "@/src/services/authService";

function breadcrumbLabel(segment: string) {
  if (segment === "") return "Home";
  if (segment === "admin") return "Admin";
  if (segment === "users") return "User management";
  if (segment === "species-recognition") return "Species recognition";
  if (segment === "submit-observation") return "Submit observation";
  if (segment === "review-pending") return "Review pending";
  return segment.replace(/-/g, " ");
}

const adminNavItems: NavItem[] = [
  {
    title: "Species Recognition",
    href: "/species/species-recognition",
    icon: ScanSearch,
    label: "Image Management",
    iconClassName: "text-cyan-500 dark:text-cyan-400",
    activeMatch: "prefix",
  },
  {
    title: "List of Species",
    href: "/admin/users",
    icon: PawPrint,
    label: "Image Management",
    iconClassName: "text-cyan-500 dark:text-cyan-400",
    activeMatch: "prefix",
  },
  {
    title: "Geolocation",
    href: "/admin/users",
    icon: MapPin,
    label: "Image Management",
    iconClassName: "text-cyan-500 dark:text-cyan-400",
    activeMatch: "prefix",
  },
  {
    title: "Review pending",
    href: "/review-pending",
    icon: ClipboardCheck,
    label: "Moderation",
    iconClassName: "text-orange-500 dark:text-orange-400",
    activeMatch: "prefix",
  },
  {
    title: "User management",
    href: "/admin/users",
    icon: Users,
    label: "User management",
    iconClassName: "text-cyan-500 dark:text-cyan-400",
    activeMatch: "prefix",
  },
  {
    title: "List of Users",
    href: "/admin/users",
    icon: ClipboardList,
    label: "Generate Reports",
    iconClassName: "text-cyan-500 dark:text-cyan-400",
    activeMatch: "prefix",
  },
  {
    title: "List of Images",
    href: "/admin/users",
    icon: Images,
    label: "Generate Reports",
    iconClassName: "text-cyan-500 dark:text-cyan-400",
    activeMatch: "prefix",
  },
];

function currentPageTitle(path: string) {
  if (path === "/") return "Dashboard";
  if (path.startsWith("/admin/users")) return "User management";
  if (path.startsWith("/species/species-recognition")) return "Species recognition";
  if (path.startsWith("/submit-observation")) return "Submit observation";
  if (path.startsWith("/review-pending")) return "Review pending";
  const last = path.split("/").filter(Boolean).pop();
  return last ? breadcrumbLabel(last) : "Dashboard";
}

function AppTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => {
    return onAuthStateChange(async (user) => {
      setSessionUser(user);
      if (!user) {
        setProfile(null);
        return;
      }
      setProfile(await getUserProfile(user.uid));
    });
  }, []);

  const onLogout = useCallback(async () => {
    await logoutUser();
    router.push("/");
    router.refresh();
  }, [router]);

  const displayName =
    profile &&
    (profile.firstName.trim() || profile.lastName.trim())
      ? `${profile.firstName} ${profile.lastName}`.trim()
      : sessionUser?.email?.split("@")[0] ?? "User";

  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const crumbs =
    pathname === "/"
      ? [{ href: "/", label: "Dashboard", current: true }]
      : [
          { href: "/", label: "Home", current: false },
          {
            href: pathname,
            label: currentPageTitle(pathname),
            current: true,
          },
        ];

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-2 md:gap-3 md:px-4">
      <SidebarTrigger className="-ml-1" />

      <nav
        aria-label="Breadcrumb"
        className="mr-auto hidden min-w-0 items-center sm:flex"
      >
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {crumbs.map((c, i) => (
            <li key={`${c.href}-${c.label}`} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />
              )}
              {c.current ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="truncate hover:text-foreground hover:underline"
                >
                  {c.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {sessionUser ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "size-9 rounded-full p-0 data-popup-open:bg-accent"
              )}
              type="button"
              aria-label="Account menu"
            >
              <span className="pointer-events-none flex items-center justify-center">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56 w-56" sideOffset={6}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {displayName}
                  </span>
                  {sessionUser.email && (
                    <span className="truncate text-xs text-muted-foreground">
                      {sessionUser.email}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/")}>
                <User className="size-4" />
                My profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onLogout}>
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/login")}
          >
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}

function AppSidebar() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    return onAuthStateChange(async (user) => {
      setLoggedIn(!!user);
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const profile = await getUserProfile(user.uid);
      setIsAdmin(profile?.role === "admin");
    });
  }, []);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              tooltip="Flora Fauna"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-xs font-bold">FF</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Flora Fauna</span>
                <span className="truncate text-xs text-muted-foreground">
                  Biodiversity
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-2 py-0">
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/"}
                tooltip="Dashboard"
                render={<Link href="/" className="group/link" />}
              >
                <LayoutGrid className="shrink-0 text-blue-500 transition-all duration-200 group-hover/link:scale-110 group-hover/link:rotate-6 dark:text-blue-400" />
                <span className="transition-colors duration-200 group-hover/link:text-foreground">
                  Dashboard
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {isAdmin ? <NavMain items={adminNavItems} /> : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {!loggedIn ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/login"}
                  tooltip="Sign in"
                  render={<Link href="/login" />}
                >
                  <LogIn />
                  <span>Sign in</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/register"}
                  tooltip="Register"
                  render={<Link href="/register" />}
                >
                  <UserPlus />
                  <span>Register</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : null}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome = pathname === "/login" || pathname === "/register";

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppTopBar />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}



