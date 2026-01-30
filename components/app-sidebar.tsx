import {
  Briefcase,
  Calendar,
  Contact,
  FolderGit2,
  Home,
  Inbox,
  Instagram,
  MessageSquare,
  NotebookPen,
  PenTool,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SignOutButton } from "./sign-out-button";

const items = [
  {
    title: "Home",
    url: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "/admin/dashboard/inbox",
    icon: Inbox,
  },
  {
    title: "Contacts",
    url: "/admin/dashboard/contacts",
    icon: Contact,
  },
  {
    title: "Calendar",
    url: "/admin/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Whiteboard",
    url: "/admin/dashboard/whiteboard",
    icon: PenTool,
  },
  {
    title: "Blog",
    url: "/admin/dashboard/blogs",
    icon: NotebookPen,
  },
  {
    title: "Comments",
    url: "/admin/dashboard/comments",
    icon: MessageSquare,
  },
  {
    title: "Timeline",
    url: "/admin/dashboard/timeline",
    icon: Briefcase,
  },
  {
    title: "Projects",
    url: "/admin/dashboard/projects",
    icon: FolderGit2,
  },
  {
    title: "Instagram Tokens",
    url: "/admin/dashboard/instagram-tokens",
    icon: Instagram,
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="z-60!">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Welcome, Deniz!</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem key={"logout"}>
                <SignOutButton />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
