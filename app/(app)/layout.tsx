import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar username={session.username} role={session.role} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
