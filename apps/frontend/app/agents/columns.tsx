'use client'

import { DataTableColumnHeader } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import type { ClientAgent } from "@/lib/api/agent"

export const columns: ColumnDef<ClientAgent>[] = [
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
        href={`/agents/${row.original.id}`}
      >
        <hgroup>
          <h2 className="text-base">{row.getValue("name")}</h2>
          { row.original.ticker && <h3>${row.original.ticker}</h3> }
        </hgroup>
      </Link>
    )
  },
  {
    accessorKey: "marketCapitalization",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-neutral-300"
        column={column}
        title="Market Capitalization"
      />
    ),
  },
  {
    accessorKey: "holderCount",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="text-neutral-300"
        column={column}
        title="Holders"
      />
    )
  }
]
