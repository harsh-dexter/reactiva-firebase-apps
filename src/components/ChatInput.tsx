
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
  
  // In a browser environment, timers are numbers.
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
    textareaRef.current?.focus();
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

  // Modified function to handle paste events on mobile
  const handlePaste = async (e: React.ClipboardEvent) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;
    
    // Check for images in clipboard
    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      
      // Check if item is an image or gif
      if (item.type.indexOf('image/') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            setIsUploading(true);
            await uploadImageMessage(file);
            toast({
              title: 'Success',
              description: file.type === 'image/gif' ? 'GIF uploaded successfully' : 'Image uploaded successfully',
            });
          } catch (error) {
            console.error('Error uploading pasted image:', error);
            toast({
              title: 'Error',
              description: 'Failed to upload pasted image',
              variant: 'destructive',
            });
          } finally {
            setIsUploading(false);
          }
        }
        return;
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if the file is an image or GIF
    if (!file.type.startsWith('image/') && file.type !== 'image/gif') {
      toast({
        title: 'Error',
        description: 'Only image files and GIFs are allowed',
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
        description: file.type === 'image/gif' ? 'GIF uploaded successfully' : 'Image uploaded successfully',
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
    <div className="border-t bg-background p-2 md:p-4">
      {/* Hidden file input for image uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,.gif"
        onChange={handleFileChange}
      />
      
      {isRecording ? (
        <div className="flex items-center justify-between gap-2 p-2 border rounded-md bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording {formatRecordingTime(recordingDuration)}</span>
          </div>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="h-8 w-8 rounded-full"
            onClick={stopRecording}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Stop recording</span>
          </Button>
        </div>
      ) : (
        <div className="flex items-end gap-1 md:gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="min-h-10 flex-1 resize-none text-sm md:text-base px-2 py-1.5 md:px-3 md:py-2"
            rows={1}
          />
          <div className="flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="rounded-full h-10 w-10 flex-shrink-0"
              onClick={handleImageUpload}
              disabled={isUploading || isRecording}
            >
              <Image className="h-4 w-4" />
              <span className="sr-only">Upload image or GIF</span>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="rounded-full h-10 w-10 flex-shrink-0"
              onClick={toggleVoiceRecording}
              disabled={isUploading}
            >
              <Mic className="h-4 w-4" />
              <span className="sr-only">Start recording</span>
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
      )}
    </div>
  );
};

export default ChatInput;
