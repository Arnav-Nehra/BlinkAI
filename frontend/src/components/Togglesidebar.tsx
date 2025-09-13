'use client'
import { Calendar, Home, Inbox, Notebook, PenBox, Search, SearchCheck, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";



export default function Toggle() {
  const {open} = useSidebar();
  const [openCommand,setOpen] = useState(false);
 return (
    <>
    <Sidebar>
      <SidebarHeader className="flex flex-row mx-2 justify-between">
      <div>
      <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={30}
      height={30}
      className={`fill-black dark:fill-white `} 
      viewBox="0 0 100 100"
    >
      <rect x="16" y="30" width="22" height="6" rx="3" fill="currentColor"/>
      <path d="M66 24 L74 18 L82 24" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 60 C36 78, 64 78, 76 60" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg></div>
       <div>{open ? <SidebarTrigger></SidebarTrigger> : ""}</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
           <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={"/"} className="flex flex-row gap-4">
                    <PenBox/>
                    <span>New Chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={()=>setOpen(true)} asChild>
                  <div className="flex flex-row gap-4">
                    <Search/>
                    <span>Search</span>
                  </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
           </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
    <CommandMenu open={openCommand} setOpen={setOpen}/>
    </>
  )
}

function CommandMenu({open,setOpen}:{open:boolean,setOpen:(value: boolean | ((prev: boolean) => boolean)) => void}) {
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
 
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No chats found.</CommandEmpty>
        <CommandGroup heading="Recent chats">
        
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}