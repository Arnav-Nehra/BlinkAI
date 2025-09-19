'use client'

import MessageComponent from "@/components/MessageComponent";
import { BACKEND_URL, Messages } from "@/types"
import { v4 } from "uuid";
import { useTheme } from "next-themes";
import { useParams } from "next/navigation";
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { Geist_Mono } from "next/font/google";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, Loader } from "lucide-react";
import db from "@/dexie/db";
import { createConversation, createMessage, getConversations, getMessagesByConversationId } from "@/dexie/queries";
import { useLiveQuery } from "dexie-react-hooks";
import { SidebarTrigger } from "@/components/ui/sidebar";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  preload: true,
  display: "swap",
});

const ChatPage = () => {
 
  const params = useParams();
  const [query, setQuery] = useState<string>("");
  const idParam = (params as any)?.id as string[] | string | undefined;
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Initialize conversation ID only once
  useEffect(() => {
    if (!conversationId) {
      const newId = Array.isArray(idParam) ? idParam[0] : idParam || v4();
      setConversationId(newId);
    }
  }, [idParam, conversationId]);

  const existingMessages = useLiveQuery(() => 
    conversationId ? getMessagesByConversationId(conversationId) : Promise.resolve([]), 
    [conversationId]
  )

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && existingMessages) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [existingMessages]);
  const [isWrapped, setIsWrapped] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [loading, setisLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);



 


  const toggleWrap = useCallback(() => {
    setIsWrapped((prev) => !prev);
  }, []);

  const handleCopy = useCallback(async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  }, []);

  const processStream = async (response: Response, userMessage: string) => {
   
    if (!response.ok) {
      setisLoading(false);
      return;
    }

    const tempMessageId = `ai-${Date.now()}`;

    try {
      const reader = response.body?.getReader();
      if (!reader) {
        console.error("No reader available");
        setisLoading(false);
        return;
      }

      await db.messages.add({
        id: tempMessageId,
        role: "assistant",
        content: "",
        conversationId: conversationId!,
        createdAt: new Date()
      });

      let accumulatedContent = "";
      let buffer = "";
      let updateTimeout: NodeJS.Timeout | null = null;

      const updateMessage = (content: string) => {
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }

        updateTimeout = setTimeout(async () => {
          await db.messages.update(tempMessageId, { content });
        }, 10);
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          await db.messages.update(tempMessageId, { content: accumulatedContent });

          if (updateTimeout) {
            clearTimeout(updateTimeout);
          }

          break;
        }

        const chunk = new TextDecoder().decode(value);
        console.log(chunk);

        buffer += chunk;

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let hasNewContent = false;

        for (const line of lines) {
          if (line.trim() === "") continue;

          if (line.startsWith("data: ")) {
            const data = line.substring(6);

            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsedData = JSON.parse(data) as {
                content?: string;
              };
              const content = parsedData.content;
              if (content) {
                accumulatedContent += content;
                hasNewContent = true;
              }
            } catch (e) {
              console.error("Error parsing JSON:", e);
            }
          }
        }

        if (hasNewContent) {
          updateMessage(accumulatedContent);
        }
      }
    } catch (error) {
      console.error("Error processing stream:", error);
      await db.messages.update(tempMessageId, { content: "Error: Failed to process response" });
    } finally {
      setisLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || loading) return;


     const currentQuery = query.trim();

     setQuery("");
     
     
     if (!idParam) {
       await createConversation(conversationId!, currentQuery.slice(0,20) + (currentQuery.length > 20 ? "..." : ""));
     }
     
     await createMessage(currentQuery, conversationId!, "user", new Date());
     setisLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setTimeout(() => {
        void (async () => {
          try {
            const response = await fetch(`${BACKEND_URL}/ai/chat`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
               body: JSON.stringify({
                 message: currentQuery,
                 model: "gemini-2.5-flash",
                 conversationId: conversationId,
               }),
              signal: abortControllerRef.current?.signal,
            });

            await processStream(response, currentQuery);
          } catch (error) {
            if ((error as Error).name !== "AbortError") {
              console.error("Error sending message:", error);
            }
            setisLoading(false);
          }
        })();
      }, 0);
    } catch (error) {
      console.error("Error preparing request:", error);
      setisLoading(false);
     } finally {
       setisLoading(false);
     }
  };


  const MessagesList = memo(({
    messages,
    onCopy,
    copiedMessageId,
    isWrapped,
    toggleWrap,
    resolvedTheme,
    geistMono
  }: {
    messages: Array<Messages>;
    onCopy: (content: string, messageId: string) => void;
    copiedMessageId: string | null;
    isWrapped: boolean;
    toggleWrap: () => void;
    resolvedTheme: string | undefined;
    geistMono: any;
  }) => {
    return <>
      {messages.map((message) => (
        <MessageComponent
          key={message.id}
          message={message}
          onCopy={onCopy}
          copiedMessageId={copiedMessageId}
          isWrapped={isWrapped}
          toggleWrap={toggleWrap}
          resolvedTheme={resolvedTheme}
          geistMono={geistMono}
        />
      ))}
    </>
  })



  if (conversationId && !existingMessages) {
    return (
      <div className="flex w-full overflow-hidden h-[96dvh]">
        <div className="relative flex h-full w-full flex-col">
          <div className="flex h-full w-full flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center space-x-2">
                <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:0s]"></div>
                <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:0.2s] [animation-direction:reverse]"></div>
                <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:0.4s]"></div>
              </div>
              <p className="text-muted-foreground text-sm">
                Loading conversation...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <SidebarTrigger className="fixed top-2 left-2 sm:top-4 sm:left-4 "/>
      
      <div className="flex-1 overflow-hidden min-w-0 mt-10">
        {!query && existingMessages?.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center px-4">
            <div className="text-center max-w-md">
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome to BlinkAI</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Start a conversation by typing a message below</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto overflow-x-hidden px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4">
            <div className="mx-auto w-full max-w-xs sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl min-w-0">
              <MessagesList
                messages={existingMessages || []}
                onCopy={handleCopy}
                copiedMessageId={copiedMessageId}
                isWrapped={isWrapped}
                toggleWrap={toggleWrap}
                resolvedTheme={resolvedTheme}
                geistMono={geistMono}
              />
              {loading && (
                <div className="flex h-4 sm:h-5 items-start justify-start space-x-1 sm:space-x-2 mt-2 sm:mt-4">
                  <div className="bg-accent h-2 w-2 sm:h-2.5 sm:w-2.5 animate-bounce rounded-full [animation-delay:0s]"></div>
                  <div className="bg-accent h-2 w-2 sm:h-2.5 sm:w-2.5 animate-bounce rounded-full [animation-delay:0.2s] [animation-direction:reverse]"></div>
                  <div className="bg-accent h-2 w-2 sm:h-2.5 sm:w-2.5 animate-bounce rounded-full [animation-delay:0.4s]"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>


      <div className="bg-background/95 backdrop-blur sm:mb-10 supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-xs sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl p-2 sm:p-4 min-w-0">
          <form
            onSubmit={handleCreateChat}
            className="relative flex items-end gap-1 sm:gap-2 rounded-lg bg-background p-1 sm:p-2 shadow-sm"
          >
            <Textarea
              ref={textareaRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleCreateChat(e);
                }
              }}
              placeholder="Ask anything..."
              className="min-h-[36px] sm:min-h-[40px] max-h-[100px] sm:max-h-[120px] resize-none border-0 bg-transparent px-2 sm:px-3 py-1 sm:py-2 shadow-none ring-0 focus-visible:ring-0 flex-1 min-w-0 text-sm sm:text-base"
              disabled={loading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={loading || !query.trim()}
              className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
            >
              {loading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpIcon className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}



export default ChatPage