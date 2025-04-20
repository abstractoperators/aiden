'use client'

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { TokenBase } from "@/lib/api/token"
import Link from "next/link"

export default function AgentCard({
  name,
  token,
  tokenId,
  avatarSource,
}: {
  name: string,
  token?: TokenBase | null,
  tokenId?: string | null,
  avatarSource?: string,
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-center items-center space-y-8 p-8",
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
      <hgroup>
        <h1 className="text-4xl font-bold text-center">{name}</h1>
        {token && tokenId && (
          <h2 className="text-2xl font-bold text-center text-muted-foreground transition duration-300 hover:text-carnation">
            <Link href={`/tokens/${tokenId}`}>
              {token.name} (${token.ticker})
            </Link>
          </h2>
        )}
      </hgroup>
    </div>
  )
}