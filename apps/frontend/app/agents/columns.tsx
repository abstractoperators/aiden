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
        column={column}
        title="Name"
      />
    ),
    cell: ({ row }) => (
      <Link
        href={`/agents/${row.original.id}`}
      >
        <hgroup className="flex items-center gap-2">
          <h2 className="text-base font-alexandria  ">{row.getValue("name")}</h2>
          { row.original.ticker && <h3 className="text-base text-anakiwa-dark dark:text-anakiwa-light">${row.original.ticker}</h3> }
        </hgroup>
      </Link>
    )
  },
  
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Price"
      />
    ),
    cell: ({ row }) => (
      <h3>
        {/* TODO: Add actual price */}
        ${(Math.random() * 100).toFixed(2)}
      </h3>
    )
  },
  {
    accessorKey: "tvl",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="TVL"
      />
    ),
    cell: ({ row }) => (
      <h3>
        {/* TODO: Add actual TVL */}
        ${(Math.random() * 1000000).toLocaleString()} 
      </h3>
    )
  },
  {
    accessorKey: "marketCapitalization",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="MC"
      />
    ),
    cell: ({ row }) => (
      <h3>
        {row.getValue("marketCapitalization")}
      </h3>
    )
  },
  {
    accessorKey: "holderCount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Holders"
      />
    ),
    cell: ({ row }) => (
      <h3>
        { row.original.holderCount && <h3>${row.original.holderCount}</h3> }
      </h3>
    )
  }
]
