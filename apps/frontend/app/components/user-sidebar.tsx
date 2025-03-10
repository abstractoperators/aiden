import * as React from "react"
import { ChevronRight, Plus } from "lucide-react"

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
  // SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClientAgent } from "@/lib/api/agent"

interface NavigationGroup {
  title: string,
  url: string,
  items: {
    title: string,
    url: string,
  }[]
}

interface UserSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userAgents: ClientAgent[]
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
    items: userAgents.map(agent => ({
      title: agent.name,
      url: `/agents/${agent.id}`,
    }))
  })

  return (
    <Sidebar
      {...props}
    >
      <SidebarHeader>
        Control Center
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
                className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <CollapsibleTrigger>
                  {parent.title}{" "}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {parent.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
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
        <Link href="/user/agents/creation">
          <Button>
            <Plus strokeWidth={5}/>
            Create an Agent
          </Button>
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
