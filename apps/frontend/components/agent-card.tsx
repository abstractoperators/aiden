'use client'

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { TokenBase } from "@/lib/api/token"
import Link from "next/link"
import { Card } from "./ui/card"

export default function AgentCard({
  name,
  token,
  avatarSource,
  
}: {
  name: string,
  token?: TokenBase | null,
  avatarSource?: string,
}) {
  return (
    <Card
      className={cn(
        "justify-center items-center bg-[#181C23] border-2",
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
        <h1 className="text-2xl font-bold text-center text-white font-alexandria">{name}</h1>
        {token && (
          <h2 className="text-xl font-bold text-center text-white font-alexandria">
            <Link
              href={`https://seitrace.com/address/${token.evmContractAddress}?chain=atlantic-2`}
              target="_blank"
            >
              {token.name} ${token.ticker}
            </Link>
          </h2>
        )}
      </hgroup>
    </Card>
  )
}