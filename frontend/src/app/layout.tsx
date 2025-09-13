'use client'
import "./globals.css"
import { SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { ThemeProvider } from "../../providers/ThemeProvider"
import Toggle from "@/components/Togglesidebar" 
import ConditionalSidebarTrigger from "@/hooks/use-sidebar"
import ThemeToggler from "@/components/ThemeToggler"
import ResponsiveSidebarProvider from "../../providers/SideBar"



export default function Root({
  children
}:Readonly<{children:React.ReactNode}>){
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={``}>
        <ThemeProvider
          defaultTheme="dark"
          attribute={"class"}
          disableTransitionOnChange
          enableSystem
        >
          <ResponsiveSidebarProvider>    
            <Toggle/>
            <ConditionalSidebarTrigger />
            <SidebarInset>
            <ThemeToggler className="fixed top-4 right-8 size-4 sm:size-8"/>
              {children}   
            </SidebarInset>
          </ResponsiveSidebarProvider>
        </ThemeProvider>
      </body> 
    </html>
  )
}