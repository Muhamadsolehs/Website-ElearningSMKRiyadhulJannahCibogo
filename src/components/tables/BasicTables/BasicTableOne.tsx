import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import React from "react";

export interface Column {
  Header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface BasicTableOneProps {
  columns: Column[];
  data: any[];
}

export default function BasicTableOne({ columns, data }: BasicTableOneProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800">
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.accessor}
                  isHeader
                  className="px-5 py-3 font-semibold text-gray-700 text-start text-theme-xs dark:text-gray-200 uppercase tracking-wider"
                >
                  {col.Header}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {data.map((row, idx) => (
              <TableRow
                key={row.id ?? idx}
                className="hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.accessor}
                    className="px-4 py-3 text-gray-600 text-start text-theme-sm dark:text-gray-400"
                  >
                    {col.render
                      ? col.render(row[col.accessor], row)
                      : row[col.accessor]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}