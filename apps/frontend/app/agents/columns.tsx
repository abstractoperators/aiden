'use client'

import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Star } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import type { Agent } from "@/lib/api/agent"

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
      <Link
        href={`/agents/${row.original.id}`}
      >
        <hgroup>
          <h2>{row.getValue("name")}</h2>
          { row.original.ticker && <h3>${row.original.ticker}</h3> }
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
