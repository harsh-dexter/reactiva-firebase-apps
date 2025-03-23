
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Image, 
  Mic, 
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ChatInput: React.FC = () => {
  const { sendNewMessage, uploadImageMessage, uploadVoiceMessage, setTyping } = useChat();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Only image files are allowed',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if the file is too large (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsUploading(true);
      await uploadImageMessage(file);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          try {
            setIsUploading(true);
            await uploadVoiceMessage(audioBlob);
            toast({
              title: 'Success',
              description: 'Voice message sent successfully',
            });
          } catch (error) {
            console.error('Error uploading voice message:', error);
            toast({
              title: 'Error',
              description: 'Failed to send voice message',
              variant: 'destructive',
            });
          } finally {
            setIsUploading(false);
          }
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setRecordingDuration(0);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer for recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      toast({
        title: 'Recording',
        description: 'Recording voice message...',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Error',
        description: 'Could not access microphone',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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
            disabled={isUploading || isRecording}
          />
          <div className="absolute bottom-1 right-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full"
              onClick={handleImageUpload}
              disabled={isUploading || isRecording}
            >
              <Image className="h-4 w-4" />
              <span className="sr-only">Attach image</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {isRecording && (
            <div className="flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary animate-pulse">
              Recording {formatRecordingTime(recordingDuration)}
            </div>
          )}
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "secondary"}
            className="rounded-full h-10 w-10 flex-shrink-0"
            onClick={toggleVoiceRecording}
            disabled={isUploading}
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
            disabled={!message.trim() || isUploading || isRecording}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
