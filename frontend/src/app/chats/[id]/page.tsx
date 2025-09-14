'use client'
import { ParamValue } from "next/dist/server/request/params"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { text } from "stream/consumers"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"


interface messageSchema {
    id: string,
    conversationId: string
    content: string
    role: "user" | "assistant",
    createdAt: string
}

export default function Chat() {
    const { id } = useParams()
    const [messages, setMessages] = useState<messageSchema[]>([])
    const [prompt, setPrompt] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            return;
        }
        console.log("submitting")
        setPrompt("")
    }
    const handleKeyDown = (e : React.KeyboardEvent<HTMLTextAreaElement>)=>{
        if(e.key=== "Enter" && !e.shiftKey){
            e.preventDefault();
            handleSubmit(e);
        }
    }


    // useEffect(()=>{
    //     if(textAreaRef.current){
    //         textAreaRef.current.style.height = "auto"
    //         textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px"

    //     }
    // },[value])
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const data = await fetchMessages(id);
                setMessages(data);
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            }
        };

        loadMessages();
    }, [id])

    //     return  <div className="space-y-4 p-4">
    //     {messages.map((message) => (
    //       <div
    //         key={message.id}
    //         className={`p-4 rounded-lg ${
    //           message.role === "user" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"
    //         }`}
    //       >
    //         <div className="font-semibold text-sm mb-2 capitalize">
    //           {message.role}
    //         </div>

    //         {typeof message.content === "string" && (
    //           <ReactMarkdown
    //             remarkPlugins={[remarkGfm, remarkMath]}
    //             rehypePlugins={[rehypeKatex]}
    //             components={{
    //               code({ node, className, children, ...props }) {
    //                 const match = /language-(\w+)/.exec(className || "");
    //                 return match ? (
    //                   <SyntaxHighlighter
    //                     style={oneDark as any}
    //                     language={match[1]}
    //                     PreTag="div"
    //                     {...(props as any)}
    //                   >
    //                     {String(children).replace(/\n$/, "")}
    //                   </SyntaxHighlighter>
    //                 ) : (
    //                   <code className="bg-gray-200 px-1 rounded" {...props}>
    //                     {children}
    //                   </code>
    //                 );
    //               },
    //             }}
    //           >
    //             {message.content}
    //           </ReactMarkdown>
    //         )}
    //       </div>
    //     ))}
    //   </div>
    // }  
    return <div className="min-h-screen bg-white dark:bg-neutral-900">

        <div
            className="mt-2 ml-2">
            <span className="text-xl text-black dark:text-white">Blink</span></div>

        <div className="flex flex-col items-center">


            <form
                onSubmit={handleSubmit}
                className="w-full max-w-xl"
               
            >
                <div className="relative mt-96">
                    <Textarea
                        placeholder="Ask your AI agent..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full max-h-44 resize-none overflow-auto bg-gray-200 dark:bg-zinc-900 pr-12 text-black placeholder-gray-800 dark:text-white dark:placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                        onKeyDown={handleKeyDown}
             />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute bottom-1.5 right-4 h-6 w-6  bg-white text-black hover:bg-zinc-200"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    </div>
}


const fetchMessages = async (id: ParamValue) => {
    const BACKEND_URL = `http://localhost:3000/ai/conversation/${id}`
    const token = `Bearer ${localStorage.getItem("token")}`
    const messages = await fetch(BACKEND_URL,
        {
            headers: {
                "Authorization": token
            }
        }
    )
    const data: messageSchema[] = await messages.json();
    return data;
}