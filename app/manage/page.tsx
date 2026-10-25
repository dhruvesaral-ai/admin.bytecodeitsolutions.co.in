import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

const sections = [
  {
    href: "/manage/roles",
    title: "Roles",
    description: "Manage access levels and authorization roles for platform users.",
  },
  {
    href: "/manage/carousals",
    title: "Carousals",
    description: "Order homepage carousals and link slide IDs.",
  },
  {
    href: "/manage/carousel-slides",
    title: "Carousel slides",
    description: "Banner content, images, and links for each slide.",
  },
  {
    href: "/manage/course-categories",
    title: "Course categories",
    description: "Organize courses with names and URL slugs.",
  },
  {
    href: "/manage/course-modules",
    title: "Course modules",
    description: "Reusable syllabus modules for courses.",
  },
  {
    href: "/manage/courses",
    title: "Courses",
    description: "Full course catalog, pricing, and metadata.",
  },
  {
    href: "/manage/leads",
    title: "Leads",
    description: "Track lead status, follow-up calls, course interest, and remarks.",
  },
  {
    href: "/manage/pages",
    title: "Pages",
    description: "Manage page headings, subheadings, and frontend route paths.",
  },
  {
    href: "/manage/testimonials",
    title: "Testimonials",
    description: "Manage testimonial names, company details, and profile photos.",
  },
  {
    href: "/manage/success-stories",
    title: "Success stories",
    description: "Manage video IDs associated with success stories.",
  },
];

export default function ManageHomePage() {
  return (
    <AdminShell
      title="Dashboard"
      description="Pick a section to create, edit, or remove content."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-700"
          >
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
