import DashboardShell from "./DashboardShell";

// Everything under (dashboard) is private, per-user data — explicitly opt out
// of indexing rather than "optimizing" a page search engines shouldn't be
// crawling in the first place. The public marketing page at "/" keeps the
// default indexable metadata from the root layout.
export const metadata = {
  title: {
    template: "%s · CreatorCMS",
    default: "Dashboard · CreatorCMS",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}
