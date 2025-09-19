"use client"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export default function ConditionalSidebarTrigger() {
    const { open } = useSidebar();
    return (
      <div className="flex dark:bg-neutral-800 bg-white">
        {!open && <SidebarTrigger className="mt-2 ml-4" />}
      </div>
    );
  }