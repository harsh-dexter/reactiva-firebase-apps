
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import RoomsList from '../components/RoomsList';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

const ChatPage: React.FC = () => {
  const { currentUser, loading, login } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Anonymous Chat</h1>
          <p className="text-muted-foreground">
            Join the conversation anonymously. No registration required.
          </p>
          <Button onClick={login} className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            Enter Chat Anonymously
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <ChatProvider>
      <div className="flex h-screen">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <RoomsList />
        </div>
        
        {/* Main chat area */}
        <div className="flex flex-1 flex-col">
          <ChatHeader />
          <MessageList />
          <ChatInput />
        </div>
      </div>
      <Toaster />
    </ChatProvider>
  );
};

export default ChatPage;
