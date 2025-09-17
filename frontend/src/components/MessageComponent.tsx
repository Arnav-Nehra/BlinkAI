'use client'
import { cn } from "@/lib/utils";
import { Messages } from "@/types";
import { ArrowLeftRightIcon, CheckCircleIcon, CheckIcon, CopyIcon, WrapText } from "lucide-react";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown"
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import remarkGfm from "remark-gfm";
const MessageComponent = memo((
    {
        message,
        onCopy,
        copied,
        isWrapped,
        toggleWrap,
        resolvedTheme,
        geistMono
    }:
        {
            message: Messages;
            onCopy: (content: string) => void;
            copied: boolean;
            isWrapped: boolean;
            toggleWrap: () => void;
            resolvedTheme: string | undefined;
            geistMono: any;
        }

) => {
    const markdownComponents = useMemo(() => ({
        code(props: any) {
          const { children, className, ...rest } = props;
          const match = /language-(\w+)/.exec(className ?? "");
          const isInline = !match;
          const codeContent = Array.isArray(children)
            ? children.join("")
            : typeof children === "string"
              ? children
              : "";
    
          return isInline ? (
            <code
              className={cn(
                "bg-accent rounded-sm px-1 py-0.5 text-sm",
                geistMono.className
              )}
              {...rest}
            >
              {children}
            </code>
          ) : (
            <div
              className={`${geistMono.className} my-4 overflow-hidden rounded-md`}
            >
              <div className="bg-accent flex items-center justify-between px-4 py-2 text-sm">
                <div>{match ? match[1] : "text"}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleWrap}
                    className={`hover:bg-muted/40 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-all duration-200`}
                    aria-label="Toggle line wrapping"
                  >
                    {isWrapped ? (
                      <>
                        <ArrowLeftRightIcon
                         
                          className="h-3 w-3"
                        />
                      </>
                    ) : (
                      <>
                        <WrapText className="h-3 w-3" />
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onCopy(codeContent)}
                    className={`hover:bg-muted/40 sticky top-10 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-all duration-200`}
                    aria-label="Copy code"
                  >
                    {copied ? (
                      <>
                        <CheckCircleIcon
                          className="size-4"
                        />
                      </>
                    ) : (
                      <>
                        <CopyIcon className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
              <SyntaxHighlighter
                language={match ? match[1] : "text"}
                style={atomOneDark}
                customStyle={{
                  margin: 0,
                  padding: "1rem",
                  backgroundColor:
                    resolvedTheme === "dark"
                      ? "#1a1620"
                      : "#f5ecf9",
                  color:
                    resolvedTheme === "dark"
                      ? "#e5e5e5"
                      : "#171717",
                  borderRadius: 0,
                  borderBottomLeftRadius: "0.375rem",
                  borderBottomRightRadius: "0.375rem",
                  fontSize: "1.2rem",
                  fontFamily: `var(--font-geist-mono), ${geistMono.style.fontFamily}`,
                }}
                wrapLongLines={isWrapped}
                codeTagProps={{
                  style: {
                    fontFamily: `var(--font-geist-mono), ${geistMono.style.fontFamily}`,
                    fontSize: "0.85em",
                    whiteSpace: isWrapped ? "pre-wrap" : "pre",
                    overflowWrap: isWrapped
                      ? "break-word"
                      : "normal",
                    wordBreak: isWrapped
                      ? "break-word"
                      : "keep-all",
                  },
                }}
                PreTag="div"
              >
                {codeContent}
              </SyntaxHighlighter>
            </div>
          );
        },
        strong: (props: any) => (
          <span className="font-bold">{props.children}</span>
        ),
        a: (props: any) => (
          <a
            className="text-primary underline"
            href={props.href}
          >
            {props.children}
          </a>
        ),
        h1: (props: any) => (
          <h1 className="my-4 text-2xl font-bold">
            {props.children}
          </h1>
        ),
        h2: (props: any) => (
          <h2 className="my-3 text-xl font-bold">
            {props.children}
          </h2>
        ),
        h3: (props: any) => (
          <h3 className="my-2 text-lg font-bold">
            {props.children}
          </h3>
        ),
      }), [copied, isWrapped, toggleWrap, onCopy, resolvedTheme, geistMono]);
    
      return (
        <div
          key={message.id}
          className={`group mb-8 flex w-full flex-col ${message.role === "assistant" ? "items-start" : "items-end"} gap-2`}
        >
         
          <div
            className={cn(
              "prose cursor-pointer dark:prose-invert max-w-none rounded-lg px-4 py-2",
              message.role === "user"
                ? "bg-accent/10 w-fit max-w-full font-medium"
                : "w-full p-0"
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          <div className="font-medium">
            {message.role === "assistant" && (
              <div className="invisible flex w-fit items-center gap-2 text-base font-semibold group-hover:visible">
                <button
                  onClick={() => onCopy(message.content)}
                  className="hover:bg-accent flex size-7 items-center justify-center rounded-lg"
                >
                  {!copied ? (
                    <CopyIcon />
                  ) : (
                    <CheckIcon  />
                  )}
                </button>
              </div>
            )}
            {message.role === "user" && (
              <button
                onClick={() => onCopy(message.content)}
                className="hover:bg-accent flex size-7 items-center justify-center rounded-lg"
              >
                {!copied ? (
                  <CopyIcon />
                ) : (
                  <CheckIcon  />
                )}
              </button>
            )}
          </div>
        </div>
      );
})

export default MessageComponent