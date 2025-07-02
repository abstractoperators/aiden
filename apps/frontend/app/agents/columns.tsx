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
        className="font-alexandria"
        column={column}
        title="Name"
      />
    ),
    cell: ({ row }) => (
      <Link
        href={`/agents/${row.original.id}`}
        className="font-alexandria"
      >
        <hgroup>
          <h2 className="text-base">{row.getValue("name")}</h2>
          { row.original.ticker && <h3>${row.original.ticker}</h3> }
        </hgroup>
      </Link>
    )
  },
  {
    accessorKey: "ticker",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="font-alexandria"
        column={column}
        title="Ticker"
      />
    ),
    cell: ({ row }) => (
      <h2 className="text-base font-alexandria">
        { row.original.ticker && <h3>${row.original.ticker}</h3> }
      </h2>
    )
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="font-alexandria"
        column={column}
        title="Price"
      />
    ),
    cell: ({ row }) => (
      <h3 className="font-alexandria">
        ${(Math.random() * 100).toFixed(2)}
      </h3>
    )
  },
  {
    accessorKey: "tvl",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="font-alexandria"
        column={column}
        title="TVL"
      />
    ),
    cell: ({ row }) => (
      <h3 className="font-alexandria">
        ${(Math.random() * 1000000).toLocaleString()}
      </h3>
    )
  },
  {
    accessorKey: "marketCapitalization",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="font-alexandria"
        column={column}
        title="MC"
      />
    ),
    cell: ({ row }) => (
      <h3 className="font-alexandria">
        {row.getValue("marketCapitalization")}
      </h3>
    )
  },
  {
    accessorKey: "holderCount",
    header: ({ column }) => (
      <DataTableColumnHeader
        className="font-alexandria"
        column={column}
        title="Holders"
      />
    ),
    cell: ({ row }) => (
      <h3 className="font-alexandria">
        { row.original.holderCount && <h3>${row.original.holderCount}</h3> }
      </h3>
    )
  }
]
