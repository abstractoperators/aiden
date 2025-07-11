'use client'

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { TokenBase } from "@/lib/api/token"
import Link from "next/link"
import { Card } from "../ui/card"

export default function FaceCard({
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
        "justify-center items-center bg-panel border border-border shadow-lg hover:shadow-xl transition-all duration-300 p-6",
      )}
    >
      <Avatar className="w-32 h-32 rounded-full border-2 border-anakiwa overflow-hidden relative shadow-md">
        <AvatarImage
          src={avatarSource}
          width={128}
          height={128}
          className="object-cover"
        />
        <AvatarFallback className="text-4xl bg-anakiwa text-white">{name.substring(0, 1)}</AvatarFallback>
      </Avatar>
      <hgroup className="mt-4 text-center">
        <h1 className="text-2xl font-bold text-center text-foreground font-alexandria">{name}</h1>
        {token && (
          <h2 className="text-xl font-bold text-center text-muted-foreground transition duration-300 hover:text-anakiwa">
            <Link
              href={`https://seitrace.com/address/${token.evmContractAddress}?chain=atlantic-2`}
              target="_blank"
              className="font-alexandria"
            >
              {token.name} ${token.ticker}
            </Link>
          </h2>
        )}
      </hgroup>
    </Card>
  )
}