'use client'

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

export default function AgentCard({ name, avatarSource }: { name: string, avatarSource?: string }) {
  return (
    <div className="flex flex-col items-center">
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
        <h1 className="text-4xl font-bold">{name}</h1>
      </div>
    </div>
  )
}