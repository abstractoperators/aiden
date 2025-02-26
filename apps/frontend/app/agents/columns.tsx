"use client"

import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Star } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
// TODO: use Zod schema here
// TODO: generalize agent type and create an additional AgentDraft type
export interface Agent {
  name: string
  ticker: string
  runtimeUrl: string
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
      // TODO: replace with dynamic route
      <Link
        href={{
          pathname: `/agents/${row.getValue("name")}`,
          query: {
            runtimeUrl: row.getValue("runtimeUrl"),
          }
        }}
      >
        <hgroup>
          <h2>{row.getValue("name")}</h2>
          <h3>${row.original.ticker}</h3>
        </hgroup>
      </Link>
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
