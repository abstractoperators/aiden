import {
  Bot,
  ChevronRight,
  LayoutDashboard,
  LucideIcon,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { ClientAgent } from "@/lib/api/agent"
import { Result, isSuccessResult } from "@/lib/api/result"
import CreateAgentButton from "./agent/create-button"

interface NavigationGroup {
  title: string,
  url: string,
  icon?: LucideIcon,
  items: {
    key: string,
    title: string,
    url: string,
  }[]
}

interface UserSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userAgents: Result<ClientAgent[]>
}

export async function UserSidebar({ userAgents, ...props }: UserSidebarProps) {
  const navigation: NavigationGroup[] = []
      // {
      //   title: "Settings",
      //   url: "#",
      //   items: [
      //     {
      //       title: "Profile",
      //       url: "/user/profile",
      //     },
      //   ],
      // },

  navigation.unshift({
    title: "Your Agents",
    url: "#",
    icon: Bot,
    items: 
      ( isSuccessResult(userAgents) )
      ? userAgents.data
        .sort((a, b) => (a.name < b.name) ? -1 : 1)
        .map(agent => ({
          key: agent.id,
          title: agent.name,
          url: `/agents/${agent.id}`,
        }))
      : [{
          key: userAgents.message,
          title: `Unable to retrieve your agents! Error Status ${userAgents.code}`,
          url: "/user",
        }],
  })

  return (
    <Sidebar
      {...props}
    >
      <SidebarHeader className="flex flex-row items-center font-bold text-lg">
        <LayoutDashboard className="h-[1.2rem] w-[1.2rem]" />
        <span>Control Center</span>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {/* We create a collapsible SidebarGroup for each parent. */}
        {navigation.map((parent) => (
          <Collapsible
            key={parent.title}
            title={parent.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-md text-sidebar-foreground"
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={parent.title}>
                    {parent.icon && <parent.icon className="h-[1.2rem] w-[1.2rem]" />}
                    <span>{parent.title}{" "}</span>
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {parent.items.map((item) => (
                      <SidebarMenuItem key={item.key}>
                        {/* TODO: implement dynamic isActive */}
                        <SidebarMenuButton asChild>
                          <Link href={item.url}>{item.title}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarFooter className="flex flex-col w-full justify-center items-center">
        <CreateAgentButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
