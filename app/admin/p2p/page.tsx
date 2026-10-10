import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { P2PAdminPanel } from "@/components/admin/p2p-admin-panel";

export const metadata = { title: "P2P Lab Administration" };

export default function P2PAdminPage() {
  return <main className="flex min-h-screen bg-[#05070b]"><AdminSidebar/><section className="min-w-0 flex-1 p-5 md:p-10"><P2PAdminPanel/></section></main>;
}
