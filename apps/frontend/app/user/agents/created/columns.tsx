"use client"

import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Star } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
// TODO: use Zod schema here
// TODO: generalize agent type and create an additional AgentDraft type
export type Agent = {
  name: string
  ticker: string
  marketCapitalization: number
  holderCount: number
}

export const columns: ColumnDef<Agent>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <hgroup>
        <h2>{row.getValue("name")}</h2>
        <h3>${row.original.ticker}</h3>
      </hgroup>
    )
  },
  {
    accessorKey: "marketCapitalization",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Market Capitalization" />
    ),
  },
  {
    accessorKey: "holderCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Holders" />
    )
  },
  {
    id: "star",
    cell: ({ row }) => (
      <Button variant="ghost" size="icon">
        {/* TODO: fill prop for Star */}
        <Star />
        <span className="sr-only">{row.getValue("name")}</span>
      </Button>
    )
  }
]
