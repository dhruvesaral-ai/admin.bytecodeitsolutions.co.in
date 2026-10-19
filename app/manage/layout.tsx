import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Bytecode",
  description: "Manage carousals, courses, modules, and categories",
};

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
