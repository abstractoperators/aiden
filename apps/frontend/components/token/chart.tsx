"use client"

import { Card } from "../ui/card";

export default function TokenChart({
  address,
}: {
  address?: `0x${string}`,
}) {
  return (
    <Card>
      {address}
    </Card>
  )
}