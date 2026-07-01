import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/SidebarContext";
import { RadarProfileProvider } from "@/components/dashboard/RadarProfileContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RadarProfileProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
          <Sidebar />
          <main className="lg:ml-60 min-h-screen w-full">{children}</main>
        </div>
      </SidebarProvider>
    </RadarProfileProvider>
  );
}
