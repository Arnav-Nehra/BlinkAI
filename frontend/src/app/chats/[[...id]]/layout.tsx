"use client"
import Toggle from "@/components/Togglesidebar";
import ResponsiveSidebarProvider from "../../../../providers/SideBar";
import { ThemeProvider } from "../../../../providers/ThemeProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ThemeToggler from "@/components/ThemeToggler";
import { useMemo } from "react";

export default function ChatLayout({children} : {children : React.ReactNode}){
    const memoToggle = useMemo(() => <Toggle/>, []);
    const memoToggler = useMemo(() => <ThemeToggler className="fixed top-2 right-2 sm:top-4 sm:right-8 size-6 sm:size-8 z-50" />, []);
    return <ThemeProvider
              defaultTheme="dark"
              attribute={"class"}
              disableTransitionOnChange
              enableSystem
            >
              <SidebarProvider>    
                {memoToggle}
                {memoToggler}
                <SidebarInset>
       
                  {children}   
                </SidebarInset>
              </SidebarProvider>
            </ThemeProvider>
}