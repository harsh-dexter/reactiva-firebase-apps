
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Image, 
  Mic, 
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ChatInput: React.FC = () => {
  const { sendNewMessage, setTyping } = useChat();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle typing indicator
  useEffect(() => {
    if (message.trim()) {
      setTyping(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set a new timeout to stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    } else {
      setTyping(false);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, setTyping]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    await sendNewMessage(message);
    setMessage('');
    
    // Focus the textarea after sending
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = () => {
    // For demo purposes, just add a placeholder image message
    alert('Image upload feature would be implemented here with Firebase Storage');
  };

  const toggleVoiceRecording = () => {
    // For demo purposes, just toggle recording state
    setIsRecording(!isRecording);
    alert('Voice recording feature would be implemented here with Web Audio API');
  };

  return (
    <div className="border-t bg-background px-4 py-3">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "min-h-10 resize-none overflow-hidden pr-12",
              "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-transparent"
            )}
            rows={1}
          />
          <div className="absolute bottom-1 right-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full"
              onClick={handleImageUpload}
            >
              <Image className="h-4 w-4" />
              <span className="sr-only">Attach image</span>
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "secondary"}
            className="rounded-full h-10 w-10 flex-shrink-0"
            onClick={toggleVoiceRecording}
          >
            {isRecording ? <X className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            <span className="sr-only">
              {isRecording ? "Stop recording" : "Start recording"}
            </span>
          </Button>
          <Button
            type="button"
            size="icon"
            className="rounded-full h-10 w-10 flex-shrink-0"
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
