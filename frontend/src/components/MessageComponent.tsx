'use client'

import { cn } from "@/lib/utils";
import { Messages } from "@/types";
import { ArrowLeftRightIcon, CheckCircleIcon, CheckIcon, CopyIcon, WrapText } from "lucide-react";
import { memo, useMemo } from "react";
import { marked }  from "marked";
import DOMPurify from "dompurify";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark, atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs"; 

interface Props {
  message: Messages;
  onCopy: (content: string, messageId: string) => void;
  copiedMessageId: string | null;
  isWrapped: boolean;
  toggleWrap: () => void;
  resolvedTheme: string | undefined;
  geistMono: any;
}

const MessageComponent = memo(
  ({ message, onCopy, copiedMessageId, isWrapped, toggleWrap, resolvedTheme, geistMono }: Props) => {
    const isCopied = copiedMessageId === message.id;
    
 
    const safeContent = useMemo(() => {
      if (!message.content || typeof message.content !== 'string') {
        return '';
      }
      
     
      return message.content.length > 100000 ? message.content.substring(0, 100000) + '...' : message.content;
    }, [message.content]);
    
    marked.setOptions({
      gfm: true,
      breaks: true,
    });

 
    const parsedContent = useMemo(() => {
      const dirty = marked.parse(safeContent) as string;
      
     
      const sanitized = DOMPurify.sanitize(dirty, {

        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'b', 'i', 's', 'strike', 'del',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li',
          'blockquote', 'pre', 'code',
          'a', 'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span'
        ],
   
        ALLOWED_ATTR: [
          'href', 'title', 'alt', 'src', 'width', 'height',
          'class', 'id', 'lang', 'dir'
        ],
 
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
        
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
        
        FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'button', 'select', 'option'],
        
        SANITIZE_DOM: true,
   
        KEEP_CONTENT: true,
     
        RETURN_DOM: false,
      
        RETURN_DOM_FRAGMENT: false,

        RETURN_TRUSTED_TYPE: false
      });
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sanitized;
      
    
      const codeBlocks = tempDiv.querySelectorAll('pre code');
      const processedBlocks: Array<{
        type: 'code' | 'text';
        content: string;
        language?: string;
        isInline?: boolean;
      }> = [];
      
      let lastIndex = 0;
      let htmlContent = tempDiv.innerHTML;
      
      codeBlocks.forEach((codeBlock) => {
   
        const codeText = codeBlock.textContent || '';
        
       
        const className = codeBlock.className || '';
        const languageMatch = className.match(/language-([a-zA-Z0-9_-]+)/);
        const rawLanguage = languageMatch?.[1] || 'text';
  
        const allowedLanguages = [
          'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
          'html', 'css', 'scss', 'sass', 'json', 'xml', 'yaml', 'yml',
          'sql', 'bash', 'shell', 'powershell', 'dockerfile', 'go', 'rust',
          'php', 'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab',
          'markdown', 'md', 'text', 'plain', 'diff', 'git', 'ini', 'toml',
          'nginx', 'apache', 'vim', 'vimrc', 'sh', 'zsh', 'fish'
        ];
        
        const language = allowedLanguages.includes(rawLanguage.toLowerCase()) 
          ? rawLanguage.toLowerCase() 
          : 'text';
        
        const isInline = !codeBlock.closest('pre');
        
        const blockStart = htmlContent.indexOf(codeBlock.outerHTML);
        if (blockStart > lastIndex) {
          // Add text content before this code block
          processedBlocks.push({
            type: 'text',
            content: htmlContent.slice(lastIndex, blockStart)
          });
        }
        
        
        processedBlocks.push({
          type: 'code',
          content: codeText,
          language,
          isInline
        });
        
        lastIndex = blockStart + codeBlock.outerHTML.length;
      });
      
    
      if (lastIndex < htmlContent.length) {
        processedBlocks.push({
          type: 'text',
          content: htmlContent.slice(lastIndex)
        });
      }
      
      return processedBlocks;
    }, [safeContent]);

    return (
      <div
        key={message.id}
        className={cn(
          "group mb-4 flex w-full flex-col gap-2",
          message.role === "assistant" ? "items-start" : "items-end"
        )}
      >
        <div
          className={cn(
            "prose cursor-pointer dark:prose-invert max-w-full rounded-lg px-2 sm:px-3 py-1 sm:py-2 overflow-hidden",
            message.role === "user"
              ? "bg-accent/10 w-fit max-w-[85%] sm:max-w-[80%] font-medium text-sm sm:text-base"
              : "w-full p-0"
          )}
        >
          <div className="space-y-2">
            {parsedContent.map((block, index) => {
              if (block.type === 'code') {
                if (block.isInline) {
                  return (
                    <code
                      key={index}
                      className="bg-muted px-1.5 py-0.5 rounded font-mono"
                    >
                      {block.content}
                    </code>
                  );
                }
                
                return (
                  <div key={index} className="relative group">
                    <div className="flex items-center justify-between bg-muted/50 px-2 sm:px-3 py-1 sm:py-2 text-xs font-medium text-muted-foreground rounded-t-md border-b">
                      <span className="uppercase text-xs sm:text-sm">{block.language}</span>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={toggleWrap}
                          className="hover:bg-muted/40 flex items-center gap-1 sm:gap-1.5 rounded px-1 sm:px-2 py-1 text-xs font-medium transition-all duration-200"
                          aria-label="Toggle line wrapping"
                        >
                          {isWrapped ? (
                            <ArrowLeftRightIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          ) : (
                            <WrapText className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => onCopy(block.content, message.id)}
                          className="hover:bg-muted/40 flex items-center gap-1 sm:gap-1.5 rounded px-1 sm:px-2 py-1 text-xs font-medium transition-all duration-200"
                          aria-label="Copy code"
                        >
                          {isCopied ? (
                            <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          ) : (
                            <CopyIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <SyntaxHighlighter
                      language={block.language === 'text' ? undefined : block.language}
                      style={resolvedTheme === "dark" ? atomOneDark : atomOneLight}
                      customStyle={{
                        margin: 0,
                        padding: "1rem",
                        backgroundColor: resolvedTheme === "dark" ? "#1a1620" : "#f8f9fa",
                        borderRadius: 0,
                        borderBottomLeftRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                        fontSize : "1.25rem",
                        fontFamily: `var(--font-geist-mono), ${geistMono.style.fontFamily}`,
                        overflow: "auto",
                        maxWidth: "100%",
                      }}
                      wrapLongLines={isWrapped}
                      codeTagProps={{
                        style: {
                          fontFamily: `var(--font-geist-mono), ${geistMono.style.fontFamily}`,
                          fontSize: "0.9rem",
                        },
                      }}
                      PreTag="div"
                      showLineNumbers={false}
                      showInlineLineNumbers={false}
                    >
                      {block.content}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              
              return (
                <div
                  key={index}
                  dangerouslySetInnerHTML={{ __html: block.content }}
                  className={cn(
                    "[&_p]:break-words [&_p]:overflow-wrap-anywhere",
                    "[&_div]:break-words [&_div]:overflow-wrap-anywhere",
                    "[&_ul]:break-words [&_ul]:overflow-wrap-anywhere",
                    "[&_ol]:break-words [&_ol]:overflow-wrap-anywhere",
                    "[&_li]:break-words [&_li]:overflow-wrap-anywhere",
                    "overflow-wrap-anywhere break-words"
                  )}
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="font-medium">
          {message.role === "assistant" && (
            <div className="invisible flex w-fit items-center gap-1 text-xs sm:text-sm group-hover:visible">
              <button
                onClick={() => onCopy(message.content, message.id)}
                className="hover:bg-accent/50 flex size-5 sm:size-6 items-center justify-center rounded-md transition-colors"
              >
                {!isCopied ? <CopyIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <CheckIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
              </button>
            </div>
          )}
          {message.role === "user" && (
            <button
              onClick={() => onCopy(message.content, message.id)}
              className="hover:bg-accent/50 flex size-5 sm:size-6 items-center justify-center rounded-md transition-colors"
            >
              {!isCopied ? <CopyIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <CheckIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
            </button>
          )}
        </div>
      </div>
    );
  }
);

export default MessageComponent;
