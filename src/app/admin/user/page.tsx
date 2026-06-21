"use client";

import { trpc } from "@/app/_trpc/client";
import {
  ColumnDef,
} from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  username: string | null;
  displayUsername: string | null;
  role: string;
}

const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Display Name",
    cell: ({ row }) => {
      return (
        <div className="">
          {row.getValue("name") || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => {
      const u = row.original;
      return (
        <div className="font-medium">
          {u.displayUsername || u.username || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email Address",
    cell: ({ row }) => {
      return <div className="text-zinc-450">{row.getValue("email")}</div>;
    },
  },
];

export default function UserPage() {
  const { data: users, isLoading, error } = trpc.getUsers.useQuery();

  return (
    <div className="flex flex-col gap-6">
      <div className="">
        <h2 className="text-xl font-bold font-sans tracking-tight">System Users</h2>
        <p className="text-xs mt-1">List of registered administrator and staff accounts with system access.</p>
      </div>

      <DataTable
        columns={columns}
        data={(users as UserRow[]) || []}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
