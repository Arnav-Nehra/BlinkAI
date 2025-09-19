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
          {children}
        </ThemeProvider>
      </body> 
    </html>
  )
}