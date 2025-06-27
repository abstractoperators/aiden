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
      <div className="font-alexandria">
        { row.original.ticker && <h3>${row.original.ticker}</h3> }
      </div>
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
      <div className="font-alexandria">
        ${(Math.random() * 100).toFixed(2)}
      </div>
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
      <div className="font-alexandria">
        ${(Math.random() * 1000000).toLocaleString()}
      </div>
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
      <div className="font-alexandria">
        {row.getValue("marketCapitalization")}
      </div>
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
      <div className="font-alexandria">
        { row.original.holderCount && <h3>${row.original.holderCount}</h3> }
      </div>
    )
  }
]
