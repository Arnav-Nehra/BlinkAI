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
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Execution } from "@/types/index";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getConversations } from "@/dexie/queries";
import { Conversation } from "@/dexie/db";

export const FRONTEND_URL  = `http://localhost:3001/chats`

function Toggle() {
  const { open } = useSidebar();
  const [openCommand, setOpen] = useState(false);
  const conversations = useLiveQuery(()=>getConversations(),[])
  const router = useRouter();

  const handleOpen = useCallback(() => setOpen(true), []);

  const conversationItems = useMemo(() => {
    if (!conversations) return null;
    return conversations.map((conversation) => {
      const onClick = () => router.push(`${FRONTEND_URL}/${conversation.id}`);
      return (
        <SidebarMenuButton onClick={onClick} className="ml-1" key={conversation.id}>
          <span>{conversation.title}</span>
        </SidebarMenuButton>
      );
    });
  }, [conversations, router]);

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <Header open={open} />
          <MenuOptions setOpen={setOpen}/>
          <SidebarGroup className="max-h-5/8 overflow-auto ">
            <SidebarGroupLabel className="mb-4 ">Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="overflow-y-auto overflow-x-hidden">
                {conversationItems}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <Footer />
        </SidebarContent>
      </Sidebar>
      <CommandMenu open={openCommand} setOpen={setOpen} conversationsList={conversations ?? []} />
    </>
  )
}
export default memo(Toggle)

const CommandMenu = memo(function CommandMenu({ open, setOpen, conversationsList }: 
  { open: boolean, 
    setOpen: (value: boolean | ((prev: boolean) => boolean)) => void, 
    conversationsList : Conversation[] 
 }) {

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
          {conversationsList.map((conversations) => (
            <CommandItem className="mb-2"key={conversations.id}>
              {conversations.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
})

const Header = memo(({ open }: { open: boolean }) => {
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
})

const Footer = memo(() => {
  return (
    <SidebarFooter className="mt-20">
      <SidebarMenuButton className="items-center">
        <span className="ml-20">Logout</span>
      </SidebarMenuButton>
    </SidebarFooter>
  )
})

const MenuOptions = memo(({setOpen}:{setOpen : (value : boolean | ((prev : boolean)=>boolean)) => void })=>{
  const onOpen = useCallback(() => setOpen(true), [setOpen]);
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
        <SidebarMenuButton onClick={onOpen} asChild>
          <div className="flex flex-row gap-4">
            <Search />
            <span>Search</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroupContent>
</SidebarGroup>)
})
