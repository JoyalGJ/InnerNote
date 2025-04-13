'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; 

const formatMessage = (role, text) => ({
  role: role,
  parts: [{ text: text }]
});

export function ChatInterface({ previousSummary, onComplete, onCancel }) {

  const getInitialMessage = () => {
    if (previousSummary) {
      const snippet = previousSummary.length > 100 ? previousSummary.substring(0, 97) + '...' : previousSummary;
      return formatMessage(
        'model',
        `Continuing from earlier today (you wrote: "${snippet}"). What else happened, or how are you feeling now?`
      );
    } else {
      return formatMessage(
        'model',
        "Hi there! Tell me a bit about how your day went."
      );
    }
  };

  const [messages, setMessages] = useState(() => [getInitialMessage()]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatEnded, setChatEnded] = useState(false);
  const scrollAreaRef = useRef(null); 

  useEffect(() => {
    setMessages([getInitialMessage()]); // Reset messages 
  }, [previousSummary]); 


  // Effect for auto-scrolling
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
            setTimeout(() => {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
            }, 50);
        }
    }
  }, [messages]); 


  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading || chatEnded) return;

    const newUserMessage = formatMessage('user', text);
    const currentDisplayMessages = [...messages, newUserMessage];
    setMessages(currentDisplayMessages);
    setInputValue('');
    setIsLoading(true);
    setError('');

    const historyForApi = currentDisplayMessages;
    console.log('[ChatInterface] Sending history to API:', historyForApi.length, "messages");

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ history: historyForApi }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ChatInterface] Received API response data:', data);

      if (data.error) {
        console.warn("[ChatInterface] API indicated response format error:", data.response);
        setMessages(prev => [...prev, formatMessage('model', data.response || "Sorry, I had trouble processing the response.")]);
        setError("There was an issue processing the AI response format.");
        setChatEnded(true); 
      } else {

        const aiResponseMessage = formatMessage('model', data.response);
        setMessages(prev => [...prev, aiResponseMessage]);

        if (data.summary && data.mood) {
          console.log('[ChatInterface] Chat complete. Summary & Mood received.');
          setChatEnded(true);
          onComplete({ summary: data.summary, mood: data.mood }); 
        } else {
            console.log('[ChatInterface] Received follow-up question.');
        }
      }

    } catch (err) {
      console.error('[ChatInterface] Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      setMessages(prev => [...prev, formatMessage('model', `Sorry, an error occurred: ${err.message}`)]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend(event);
    }
  };

  return (
    <Card className="mt-6 mb-8 flex flex-col max-h-[70vh]">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-xl">
            {previousSummary ? "Continuing Your Day..." : "How was your day?"}
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
            InnerNote will ask a couple of questions to help you reflect.
        </p>
      </CardHeader>
    
       <ScrollArea className="flex-grow p-4 pr-2 border-t border-b" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg, index) => (
             <div
               key={index}
               className={cn(
                 "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm break-words", 
                 msg.role === "user"
                   ? "ml-auto bg-blue-600 text-primary-foreground" 
                   : "bg-muted" 
               )}
             >
                 {msg.parts[0].text.split('\n').map((line, i) => (
                     <span key={i}>{line}{i === msg.parts[0].text.split('\n').length - 1 ? '' : <br />}</span>
                 ))}
             </div>
          ))}
          {isLoading && (
              <div className="flex items-center justify-start space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="bg-muted rounded-lg px-3 py-2 animate-pulse">AI is typing...</div>
              </div>
          )}
        </div>
      </ScrollArea>

      <CardContent className="pt-4 flex-shrink-0">
          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm mb-2">{error}</p>
          )}
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <Textarea
            placeholder={chatEnded ? "Chat finished. Add another entry tomorrow!" : "Type your message..."}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown} 
            rows={1} 
            className="min-h-[40px] flex-1 resize-none" 
            disabled={isLoading || chatEnded} 
            required
          />
          <Button type="submit" disabled={isLoading || chatEnded || !inputValue.trim()}>
            Send
          </Button>
          <Button
             type="button"
             variant="ghost"
             onClick={onCancel}
             disabled={isLoading && !chatEnded} 
          >
             {chatEnded ? 'Close' : 'Cancel'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}