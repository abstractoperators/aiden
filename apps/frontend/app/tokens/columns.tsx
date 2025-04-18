'use client'

import { DataTableColumnHeader } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import type { Token } from "@/lib/api/token"

export const columns: ColumnDef<Token>[] = [
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
      <DataTableColumnHeader
        className="text-neutral-300"
        column={column}
        title="Name"
      />
    ),
    cell: ({ row }) => (
      <Link
        href={`/tokens/${row.original.id}`}
      >
        <hgroup>
          <h2 className="text-base">{row.getValue("name")}</h2>
          {row.original.ticker && <h3>${row.original.ticker}</h3>}
        </hgroup>
      </Link>
    )
  },
  {
    accessorKey: "ticker",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-neutral-300"
        column={column}
        title="ticker"
      />
    ),
  },
]