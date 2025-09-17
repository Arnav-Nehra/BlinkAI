'use client'
import { Calendar, Home, Inbox, Notebook, PenBox, Search, SearchCheck, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import useExecutions from "@/hooks/use-executions";
import { Execution } from "@/types/index";
import { NextRouter, Router, useRouter } from "next/router";
import { redirect } from "next/navigation";

export default function Toggle() {
  const { open } = useSidebar();
  const [openCommand, setOpen] = useState(false);
  const { executionList } = useExecutions();
  return (
    <>
      <Sidebar>
        <SidebarContent>
          <Header open={open} />
          <MenuOptions setOpen={setOpen}/>
          <ExecutionGroup executionList={executionList}/>
          <Footer />
        </SidebarContent>
      </Sidebar>
      <CommandMenu open={openCommand} setOpen={setOpen} executionList={executionList} />
    </>
  )
}

function CommandMenu({ open, setOpen, executionList }: { open: boolean, setOpen: (value: boolean | ((prev: boolean) => boolean)) => void, executionList: Execution[] }) {

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
        <CommandGroup className=""heading="Recent chats">
          {executionList.map((execution) => (
            <CommandItem className="mb-2"key={execution.id}>
              {execution.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

const Header = ({ open }: { open: boolean }) => {
  return (

    <SidebarHeader className="flex flex-row mx-2 justify-between">
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={30}
          height={30}
          className={`fill-black dark:fill-white `}
          viewBox="0 0 100 100"
        >
          <rect x="16" y="30" width="22" height="6" rx="3" fill="currentColor" />
          <path d="M66 24 L74 18 L82 24" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 60 C36 78, 64 78, 76 60" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg></div>
      <div>{open ? <SidebarTrigger></SidebarTrigger> : ""}</div>
    </SidebarHeader>
  )
}

const Footer = () => {
  return (
    <SidebarFooter className="">
      <SidebarMenuButton className="items-center">
        <span className="ml-20">Logout</span>
      </SidebarMenuButton>
    </SidebarFooter>
  )
}

const MenuOptions = ({setOpen}:{setOpen : (value : boolean | ((prev : boolean)=>boolean)) => void })=>{
  return ( 
  <SidebarGroup >
  <SidebarGroupContent>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href={"/"} className="flex flex-row gap-4">
            <PenBox />
            <span>New Chat</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => setOpen(true)} asChild>
          <div className="flex flex-row gap-4">
            <Search />
            <span>Search</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroupContent>
</SidebarGroup>)
}
const ExecutionGroup = ({executionList}:{executionList:Execution[]})=>{
  const FRONTEND_URL = "http://localhost:3001/chats"
  return (
  <SidebarGroup className="min-h-6/8">
            <SidebarGroupLabel className="mb-4">Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className=" overflow-y-auto overflow-x-hidden">
                {executionList.map((execution) => {
                  return <SidebarMenuButton onClick = {()=>{
                    redirect(`${FRONTEND_URL}/${execution.id}`)
                  }}className="ml-1" key={execution.id}>
                    <span>{execution.title}</span>
                  </SidebarMenuButton>
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
  )
}