import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

 return (
    <div className="flex h-screen overflow-hidden bg-brand-bg">
      <Sidebar username={session.username} role={session.role} />
      <main className="flex-1 overflow-y-auto p-8">{children} <Footer /></main>
    </div>
  );
}
