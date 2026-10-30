"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const nav = [
  { href: "/manage", label: "Overview" },
  { href: "/manage/users", label: "Users" },
  { href: "/manage/sessions", label: "Active Sessions" },
  { href: "/manage/roles", label: "Roles" },
  { href: "/manage/carousals", label: "Carousals" },
  { href: "/manage/carousel-slides", label: "Carousel slides" },
  { href: "/manage/course-categories", label: "Course categories" },
  { href: "/manage/course-modules", label: "Course modules" },
  { href: "/manage/courses", label: "Courses" },
  { href: "/manage/leads", label: "Leads" },
  { href: "/manage/pages", label: "Pages" },
  { href: "/manage/testimonials", label: "Testimonials" },
  { href: "/manage/success-stories", label: "Success stories" },
  { href: "/manage/projects", label: "Projects" },
  { href: "/manage/settings", label: "Settings" },
  { href: "/docs", label: "API Docs" },
];

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="h-screen overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="flex h-screen">
        <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
          <div>
            <Link href="/" className="mb-6 block text-sm font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              Bytecode Admin
            </Link>
            <nav className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-140px)]">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              Sign out
            </button>
          </div>
        </aside>


        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              Content management
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            ) : null}
            <nav className="mt-4 flex gap-2 overflow-x-auto md:hidden">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="flex-1 space-y-6 p-5 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
