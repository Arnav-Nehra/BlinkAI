'use client'
import "./globals.css"
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { ThemeProvider } from "../../providers/ThemeProvider"
import Toggle from "@/components/Togglesidebar" 
import ConditionalSidebarTrigger from "@/hooks/use-sidebar"
import ThemeToggler from "@/components/ThemeToggler"



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
          <SidebarProvider>    
            <Toggle/>
            <ConditionalSidebarTrigger />
            <SidebarInset>
            <ThemeToggler className="fixed top-4 right-8"/>
              {children}   
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body> 
    </html>
  )
}