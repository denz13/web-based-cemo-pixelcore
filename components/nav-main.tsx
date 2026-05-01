"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  iconClassName?: string;
  /** Use prefix for section roots (e.g. /admin). Default exact. */
  activeMatch?: "exact" | "prefix";
};

function pathIsActive(
  pathname: string,
  href: string,
  match: "exact" | "prefix"
) {
  if (match === "prefix") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href;
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
  const pathname = usePathname();

  const groupedItems = items.reduce(
    (acc, item) => {
      const label = item.label || "Platform";
      if (!acc[label]) acc[label] = [];
      acc[label].push(item);
      return acc;
    },
    {} as Record<string, NavItem[]>
  );

  return (
    <>
      {Object.entries(groupedItems).map(([label, groupItems]) => (
        <SidebarGroup key={label} className="px-2 py-0">
          <SidebarGroupLabel>{label}</SidebarGroupLabel>
          <SidebarMenu>
            {groupItems.map((item) => {
              const match = item.activeMatch ?? "exact";
              const active = pathIsActive(pathname, item.href, match);
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={item.title}
                    render={<Link href={item.href} className="group/link" />}
                  >
                    <item.icon
                      className={cn(
                        "shrink-0 transition-all duration-200 group-hover/link:scale-110",
                        item.iconClassName ?? "text-sidebar-foreground"
                      )}
                    />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
