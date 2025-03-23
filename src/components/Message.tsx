
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Avatar from './Avatar';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2, Image, Play, Pause, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { decryptMessage, decryptFileMetadata } from '../encryption/crypto';

interface MessageProps {
  id: string;
  text: string;
  type: string;
  createdAt: string;
  userId: string;
  username: string;
  avatarColor: string;
  isOnline: boolean;
  edited: boolean;
  isEncrypted?: boolean;
}

const Message: React.FC<MessageProps> = ({
  id,
  text,
  type,
  createdAt,
  userId,
  username,
  avatarColor,
  isOnline,
  edited,
  isEncrypted = false
}) => {
  const { currentUser } = useAuth();
  const { editExistingMessage, deleteExistingMessage } = useChat();
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [decryptedText, setDecryptedText] = useState<string>(text);
  const isOwnMessage = currentUser?.uid === userId;
  const messageRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Decrypt message content on mount
  useEffect(() => {
    if (isEncrypted) {
      if (type === 'text') {
        setDecryptedText(decryptMessage(text));
        setEditedText(decryptMessage(text));
      } else if (type === 'image' || type === 'voice') {
        try {
          const metadata = decryptFileMetadata(text);
          if (type === 'image' && metadata.url) {
            setImageUrl(metadata.url);
          } else if (type === 'voice' && metadata.url) {
            setAudioUrl(metadata.url);
          }
        } catch (error) {
          console.error(`Error decrypting ${type} message:`, error);
        }
      }
    } else {
      setDecryptedText(text);
      setEditedText(text);
    }
  }, [text, type, isEncrypted]);

  // Reset edited text when text prop changes
  useEffect(() => {
    if (type === 'text' && isEncrypted) {
      setEditedText(decryptMessage(text));
    } else if (type === 'text') {
      setEditedText(text);
    }
  }, [text, type, isEncrypted]);

  const handleEdit = () => {
    setIsEditing(true);
    setShowOptions(false);
  };

  const handleSaveEdit = async () => {
    if (editedText.trim() === '' || editedText === decryptedText) {
      setIsEditing(false);
      setEditedText(decryptedText);
      return;
    }
    
    await editExistingMessage(id, editedText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText(decryptedText);
  };

  const handleDelete = async () => {
    await deleteExistingMessage(id);
    setIsDeleteConfirmOpen(false);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'just now';
    }
  };

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle audio playback events
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleEnded = () => setIsPlaying(false);
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      
      audioElement.addEventListener('ended', handleEnded);
      audioElement.addEventListener('play', handlePlay);
      audioElement.addEventListener('pause', handlePause);
      
      return () => {
        audioElement.removeEventListener('ended', handleEnded);
        audioElement.removeEventListener('play', handlePlay);
        audioElement.removeEventListener('pause', handlePause);
      };
    }
  }, [audioRef.current]);

  // Prevent screenshot (demo implementation - would be more robust in a real app)
  const preventScreenshot = () => {
    // In a real app, you might use a more sophisticated approach
    // This is just to demonstrate the concept
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      html::after {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: transparent;
        z-index: 2147483647;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    
    // Remove the style after a short delay
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1000);
  };

  useEffect(() => {
    // Listen for potential screenshot attempts
    document.addEventListener('keydown', (e) => {
      // Check for common screenshot key combinations
      if (
        (e.key === 'PrintScreen') || 
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4'))
      ) {
        preventScreenshot();
      }
    });
  }, []);

  // Render different content based on message type
  const renderMessageContent = () => {
    if (isEditing) {
      return (
        <div className="flex w-full flex-col space-y-2">
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="min-h-[60px]"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit}>
              Save
            </Button>
          </div>
        </div>
      );
    }

    switch (type) {
      case 'image':
        return imageUrl ? (
          <div className="max-w-xs overflow-hidden rounded-lg">
            <img 
              src={imageUrl} 
              alt="Shared image" 
              className="max-h-60 w-full object-contain"
              onContextMenu={(e) => e.preventDefault()} // Prevent right-click
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-1 w-full"
              onClick={() => window.open(imageUrl, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              View Full Image
            </Button>
          </div>
        ) : (
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            Image not available or encrypted with a different key
          </div>
        );
      
      case 'voice':
        return audioUrl ? (
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={toggleAudioPlayback}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1 text-xs">
                Voice message
              </div>
            </div>
            <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
          </div>
        ) : (
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            Voice message not available or encrypted with a different key
          </div>
        );
      
      case 'text':
      default:
        return (
          <div
            className={cn(
              "rounded-lg px-3 py-2",
              isOwnMessage
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            {decryptedText}
          </div>
        );
    }
  };

  return (
    <div 
      ref={messageRef}
      className={cn(
        "group flex gap-3 py-2.5",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => isOwnMessage && setShowOptions(true)}
      onMouseLeave={() => isOwnMessage && setShowOptions(false)}
    >
      {!isOwnMessage && (
        <Avatar 
          username={username} 
          color={avatarColor} 
          isOnline={isOnline} 
          size="sm" 
        />
      )}
      
      <div className={cn("flex max-w-[75%] flex-col", isOwnMessage && "items-end")}>
        {!isOwnMessage && (
          <div className="mb-1 text-xs font-medium">{username}</div>
        )}
        
        <div className="flex items-end gap-2">
          {isOwnMessage && showOptions && type === 'text' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {isOwnMessage && showOptions && (type === 'image' || type === 'voice') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {renderMessageContent()}
        </div>
        
        <div className={cn(
          "mt-1 flex items-center text-xs text-muted-foreground",
          isOwnMessage ? "justify-end" : "justify-start"
        )}>
          <time dateTime={createdAt}>{formatTimestamp(createdAt)}</time>
          {edited && <span className="ml-1">(edited)</span>}
          {isEncrypted && <span className="ml-1">🔒</span>}
        </div>
      </div>
      
      {isOwnMessage && (
        <Avatar 
          username={currentUser?.username || ''} 
          color={currentUser?.avatarColor || '#000'} 
          isOnline={true} 
          size="sm" 
        />
      )}
      
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this message? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Message;
