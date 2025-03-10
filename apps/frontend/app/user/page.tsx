import { SidebarTrigger } from "@/components/ui/sidebar";

export default function User() {
  return (
    <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
      You made it to <SidebarTrigger /> the profile page!
    </h1>
  )
}