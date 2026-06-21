"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    isLoading?: boolean
    error?: any
    emptyMessage?: string
}

export function DataTable<TData, TValue>({
    columns,
    data,
    isLoading,
    error,
    emptyMessage,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="overflow-hidden rounded-md border border-primary/30">
            <Table>
                <TableHeader className="border-none ">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-none hover:bg-muted/5">
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} className="font-semibold">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody className="border-none">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i} className="border-none animate-pulse">
                                {columns.map((_, colIndex) => (
                                    <TableCell key={colIndex} className="py-4">
                                        <div className="h-4 bg-muted/40 rounded w-24" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : error ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell
                                colSpan={columns.length}
                                className="py-8 text-center text-destructive font-semibold text-xs"
                            >
                                ❌ Error loading data: {error.message || String(error)}
                            </TableCell>
                        </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className="border-none hover:bg-muted/5"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-semibold text-xs">
                                {emptyMessage || "No results."}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}