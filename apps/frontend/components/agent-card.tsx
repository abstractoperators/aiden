'use client'

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

export default function AgentCard({
  name,
  avatarSource,
}: {
  name: string,
  avatarSource?: string,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center space-y-8 relative p-8",
        "bg-anakiwa-darker/30 dark:bg-anakiwa/30 rounded-xl"
      )}
    >
      <Avatar className="w-32 h-32 rounded-full border-2 overflow-hidden relative">
        <AvatarImage
          src={avatarSource}
          width={128}
          height={128}
          className="object-cover"
        />
        <AvatarFallback className="text-4xl">{name.substring(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2 mt-2">
        <h1 className="text-4xl font-bold text-center">{name}</h1>
      </div>
    </div>
  )
}