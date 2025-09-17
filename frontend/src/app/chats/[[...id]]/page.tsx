'use client'

import MessageComponent from "@/components/MessageComponent";
import useConversation from "@/hooks/use-conversations";
import { BACKEND_URL, Messages } from "@/types"
import { v4 } from "uuid";
import { useTheme } from "next-themes";
import { useParams } from "next/navigation";
import { memo, SetStateAction, useCallback, useEffect, useRef, useState } from "react"
import { Geist_Mono } from "next/font/google";
import { useStore } from "zustand";
import { useExecutionStore } from "@/stores";
import useExecutions from "@/hooks/use-executions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, Loader } from "lucide-react";
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  preload: true,
  display: "swap",
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const ChatPage = () => {
  const [existingMessages, setExistingMessges] = useState<Message[]>([]);
  const params = useParams();
  const [query, setQuery] = useState<string>("");
  const idParam = (params as any)?.id as string[] | string | undefined;
  const InitialconversationId = Array.isArray(idParam) ? idParam[0] : idParam;
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const [isWrapped, setIsWrapped] = useState(false);
  const [loading, setisLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(
    InitialconversationId || v4()
  );
  const {refetch} = useExecutions();
  useEffect(() => {

    const fetchExistingMessages = async () => {
      if (conversationId) {
        try {
          const data = await useConversation(conversationId);
          if (Array.isArray(data)) {
            setExistingMessges(data);
          } else {
            setExistingMessges([]);
          }
        } catch (error) {
          console.error("Error fetching messages:", error);
          setExistingMessges([]);
        }
      }
    }
    fetchExistingMessages();
  }, [conversationId])


  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  }, []);

  const toggleWrap = useCallback(() => {
    setIsWrapped((prev) => !prev);
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

      setExistingMessges((prev) => [
        ...prev,
        { id: tempMessageId, role: "assistant", content: "" },
      ]);

      let accumulatedContent = "";
      let buffer = "";
      let updateTimeout: NodeJS.Timeout | null = null;

      const updateMessage = (content: string) => {
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }

        updateTimeout = setTimeout(() => {
          setExistingMessges((prev) =>
            prev.map((msg) =>
              msg.id === tempMessageId ? { ...msg, content } : msg
            )
          );
        },20);
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setExistingMessges((prev) =>
            prev.map((msg) =>
              msg.id === tempMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );

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
      setExistingMessges((prev) =>
        prev.map((msg) =>
          msg.id === tempMessageId
            ? { ...msg, content: "Error: Failed to process response" }
            : msg
        )
      );
    } finally {
      setisLoading(false);
      abortControllerRef.current = null;
      refetch()

    }
  };

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || loading) return;

    setShowWelcome(false);

    const currentQuery = query.trim();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: currentQuery,
    };

    setQuery("");
    setExistingMessges((prev) => [...prev, userMessage]);
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
      refetch()
      setisLoading(false);
    }
  };


  const MessagesList = memo(({
    messages,
    onCopy,
    copied,
    isWrapped,
    toggleWrap,
    resolvedTheme,
    geistMono

  }: {
    messages: Array<Messages>;
    onCopy: (content: string) => void;
    copied: boolean;
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
          copied={copied}
          isWrapped={isWrapped}
          toggleWrap={toggleWrap}
          resolvedTheme={resolvedTheme}
          geistMono={geistMono}
        />
      ))}
    </>
  })

  // if (InitialconversationId ) {
  //   return (
  //     <div className="flex w-full overflow-hidden h-[96dvh]">
  //       <div className="relative flex h-full w-full flex-col">
  //         <div className="flex h-full w-full flex-col items-center justify-center">
  //           <div className="flex flex-col items-center gap-4">
  //             <div className="flex items-center space-x-2">
  //               <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:0s]"></div>
  //               <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:0.2s] [animation-direction:reverse]"></div>
  //               <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:0.4s]"></div>
  //             </div>
  //             <p className="text-muted-foreground text-sm">
  //               Loading conversation...
  //             </p>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }


  return  <div className="flex h-[96dvh] w-full overflow-hidden">
  <div className="relative flex h-full w-full flex-col">
    {!query && showWelcome && existingMessages.length === 0 ? (
      <div className="flex h-full w-full flex-col">
        
      </div>
    ) : (
      <div className="no-scrollbar mt-6 flex h-full w-full flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-10 md:px-8">
        <div className="mx-auto h-full w-full max-w-4xl">
          <MessagesList
            messages={existingMessages}
            onCopy={handleCopy}
            copied={copied}
            isWrapped={isWrapped}
            toggleWrap={toggleWrap}
            resolvedTheme={resolvedTheme}
            geistMono={geistMono}
          />
          {loading && (
            <div className="flex h-5 items-start justify-start space-x-2">
              <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:0s]"></div>
              <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:0.2s] [animation-direction:reverse]"></div>
              <div className="bg-accent h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:0.4s]"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    )}

   

    <div className="bg-muted/20 backdrop-blur-3xl border border-border/50 mb-4 w-full rounded-2xl p-1">
      <div className="mx-auto w-full max-w-4xl">
        <form
          onSubmit={handleCreateChat}
          className="bg-accent/30 dark:bg-accent/10 flex w-full flex-col rounded-xl p-3"
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
            placeholder={
              "Ask anything"
            }
            className="h-[2rem] resize-none rounded-none border-none bg-transparent px-0 py-1 shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent"
            disabled={
              loading 
            }
          />
          <div className="mt-2 flex items-center justify-between">
            
            <Button
              type="submit"
              size="icon"
              disabled={
                loading
              }
            >
              {loading ? (
                <Loader className="animate-spin" />
              ) : (
                <ArrowUpIcon className="size-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
}



export default ChatPage