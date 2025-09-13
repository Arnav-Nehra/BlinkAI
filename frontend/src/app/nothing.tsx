"use client";

import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function LiveMarkdownChat() {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Check if user is at bottom of scroll area
  const isAtBottom = useCallback(() => {
    if (!responseRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = responseRef.current;
    return scrollHeight - scrollTop - clientHeight < 10; // 10px threshold
  }, []);

  // Smooth streaming with smart auto-scroll
  const updateMarkdown = useCallback((newText: string) => {
    setMarkdown(newText);
    
    // Only auto-scroll if user hasn't manually scrolled up
    setTimeout(() => {
      if (responseRef.current && shouldAutoScroll && isAtBottom()) {
        responseRef.current.scrollTop = responseRef.current.scrollHeight;
      }
    }, 10);
  }, [shouldAutoScroll, isAtBottom]);

  // Handle scroll events to detect user scrolling
  const handleScroll = useCallback(() => {
    if (!responseRef.current) return;
    
    const atBottom = isAtBottom();
    setShouldAutoScroll(atBottom);
    
    // If user scrolls to bottom, resume auto-scrolling
    if (atBottom) {
      setIsUserScrolling(false);
    } else {
      setIsUserScrolling(true);
    }
  }, [isAtBottom]);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    setMarkdown("");

    try {
      const token = localStorage.getItem('token') || '';
      console.log('Using token:', token ? 'present' : 'missing');

      const response = await fetch("http://localhost:3000/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: message,
          model: "gemini-2.5-flash",
          conversationId : "8979afa8-0666-413f-81dc-6c543a38ead8"
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        setLoading(false);
        return;
      }

      let currentText = '';
      let buffer = "";
      let lastUpdate = 0;
      const UPDATE_THROTTLE = 50; // Update every 50ms for smoothness

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                currentText += data.content;
                
                // Throttle updates for smoother rendering
                const now = Date.now();
                if (now - lastUpdate > UPDATE_THROTTLE) {
                  updateMarkdown(currentText);
                  lastUpdate = now;
                }
              } else if (data.done) {
                // Final update to ensure all content is shown
                updateMarkdown(currentText);
                break;
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                currentText += data.content;
                updateMarkdown(currentText);
              } else if (data.done) {
                break;
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

      // Create new conversation ID if none exists
      if (!conversationId) {
        setConversationId(crypto.randomUUID());
      }

    } catch (error) {
      console.error('Error:', error);
      setMarkdown('Error: Failed to get response from AI');
    } finally {
      setLoading(false);
      setMessage('');
      // Use setTimeout to prevent rendering issues
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        BlinkAI Chat
      </h1>

      {/* Message Input */}
      <div className="mb-6">
        <div className="flex flex-col space-y-4">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
            rows={4}
            disabled={loading}
            style={{ minHeight: '100px' }}
          />
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {conversationId && `Conversation: ${conversationId.slice(0, 8)}...`}
            </div>
            
            <button
              onClick={sendMessage}
              disabled={!message.trim() || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>

      {/* Response Area */}
      <div 
        ref={responseRef}
        onScroll={handleScroll}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-h-[400px] max-h-[600px] overflow-y-auto relative"
      >
        {/* Scroll indicator */}
        {isUserScrolling && loading && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => {
                setShouldAutoScroll(true);
                setIsUserScrolling(false);
                if (responseRef.current) {
                  responseRef.current.scrollTop = responseRef.current.scrollHeight;
                }
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-700 transition-colors shadow-lg"
            >
              ↓ Scroll to bottom
            </button>
          </div>
        )}
        
        {markdown ? (
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return match ? (
                    <SyntaxHighlighter
                      style={oneDark as any}
                      language={match[1]}
                      PreTag="div"
                      {...(props as any)}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-gray-200 px-1 rounded" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2">AI is thinking...</span>
              </div>
            ) : (
              "Start a conversation by typing a message above..."
            )}
          </div>
        )}
      </div>
    </div>
  );
}
