import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminFromCookies } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminFromCookies())) redirect("/admin/login");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="text-sm font-semibold tracking-tight">Admin</div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/participants" className="text-zinc-700 hover:text-zinc-900">
              Participants
            </Link>
            <Link href="/admin/events" className="text-zinc-700 hover:text-zinc-900">
              Events
            </Link>
            <a href="/api/admin/export" className="text-zinc-700 hover:text-zinc-900">
              Full Export
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
