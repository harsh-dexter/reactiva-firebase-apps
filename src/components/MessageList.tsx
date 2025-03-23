
import React, { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import Message from './Message';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '../context/AuthContext';

interface UserInfo {
  username: string;
  avatarColor: string;
  isOnline: boolean;
}

interface UserMap {
  [userId: string]: UserInfo;
}

const MessageList: React.FC = () => {
  const { messages, loadingMessages, typingUsers } = useChat();
  const { currentUser } = useAuth();
  const endRef = useRef<HTMLDivElement>(null);
  
  // Mock user data for demo - in a real app, you'd fetch this from your database
  const usersMap: UserMap = {
    'user1': { username: 'HappyTiger123', avatarColor: '#F44336', isOnline: true },
    'user2': { username: 'WiseFalcon456', avatarColor: '#2196F3', isOnline: false },
    // The current user is handled separately
  };
  
  // Add typing indicators
  const typingIndicators = Object.keys(typingUsers).map(userId => ({
    id: `typing-${userId}`,
    userId,
    text: 'typing...',
    type: 'typing',
    createdAt: new Date().toISOString(),
    username: usersMap[userId]?.username || 'Anonymous',
    avatarColor: usersMap[userId]?.avatarColor || '#9E9E9E',
    isOnline: usersMap[userId]?.isOnline || false,
    edited: false
  }));

  // Scroll to bottom when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingIndicators.length]);

  if (loadingMessages) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-64" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <Message
              key={message.id}
              id={message.id}
              text={message.text}
              type={message.type}
              createdAt={message.createdAt}
              userId={message.userId}
              username={
                message.userId === currentUser?.uid
                  ? currentUser.username
                  : usersMap[message.userId]?.username || 'Anonymous'
              }
              avatarColor={
                message.userId === currentUser?.uid
                  ? currentUser.avatarColor
                  : usersMap[message.userId]?.avatarColor || '#9E9E9E'
              }
              isOnline={
                message.userId === currentUser?.uid
                  ? true
                  : usersMap[message.userId]?.isOnline || false
              }
              edited={message.edited}
            />
          ))}
          
          {typingIndicators.map((indicator) => (
            <div key={indicator.id} className="flex items-start gap-3 py-2.5">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {indicator.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium">{indicator.username}</div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-sm">typing</span>
                  <span className="animate-pulse">•••</span>
                </div>
              </div>
            </div>
          ))}
          
          <div ref={endRef} />
        </>
      )}
    </div>
  );
};

export default MessageList;
