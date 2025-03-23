
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getChatRooms, 
  createChatRoom, 
  getMessages, 
  sendMessage,
  editMessage, 
  deleteMessage, 
  updateTypingStatus,
  getTypingUsers
} from '../firebase/firebase';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/use-toast';

type Message = {
  id: string;
  userId: string;
  text: string;
  type: string;
  createdAt: string;
  expiresAt: string;
  edited: boolean;
};

type Room = {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
};

type TypingUser = {
  userId: string;
  timestamp: string;
};

type ChatContextType = {
  rooms: Room[];
  currentRoom: Room | null;
  messages: Message[];
  typingUsers: { [key: string]: TypingUser };
  loadingMessages: boolean;
  messageError: string | null;
  setCurrentRoom: (room: Room) => void;
  createRoom: (name: string, description: string) => Promise<string | null>;
  sendNewMessage: (text: string, type?: string) => Promise<string | null>;
  editExistingMessage: (messageId: string, newText: string) => Promise<void>;
  deleteExistingMessage: (messageId: string) => Promise<void>;
  setTyping: (isTyping: boolean) => Promise<void>;
};

const ChatContext = createContext<ChatContextType>({
  rooms: [],
  currentRoom: null,
  messages: [],
  typingUsers: {},
  loadingMessages: false,
  messageError: null,
  setCurrentRoom: () => {},
  createRoom: async () => null,
  sendNewMessage: async () => null,
  editExistingMessage: async () => {},
  deleteExistingMessage: async () => {},
  setTyping: async () => {}
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: TypingUser }>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  // Get chat rooms
  useEffect(() => {
    const unsubscribe = getChatRooms((roomsData) => {
      const roomsList = Object.entries(roomsData).map(([id, room]: [string, any]) => ({
        id,
        ...room
      }));
      setRooms(roomsList);
      
      // Set the first room as current if there's no current room
      if (roomsList.length > 0 && !currentRoom) {
        setCurrentRoom(roomsList[0]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentRoom]);

  // Get messages for the current room
  useEffect(() => {
    if (!currentRoom) return;

    setLoadingMessages(true);
    setMessageError(null);

    const unsubscribe = getMessages(currentRoom.id, (messagesData) => {
      const messagesList = Object.entries(messagesData)
        .map(([id, message]: [string, any]) => ({
          id,
          ...message
        }))
        .filter(message => {
          // Filter out expired messages
          if (message.expiresAt) {
            return new Date(message.expiresAt) > new Date();
          }
          return true;
        })
        .sort((a, b) => {
          // Sort by timestamp
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return aTime - bTime;
        });
      
      setMessages(messagesList);
      setLoadingMessages(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentRoom]);

  // Get typing users for the current room
  useEffect(() => {
    if (!currentRoom || !currentUser) return;

    const unsubscribe = getTypingUsers(currentRoom.id, (typingData) => {
      // Filter out typing indicators older than 10 seconds
      const now = Date.now();
      const filteredTyping = Object.entries(typingData)
        .filter(([userId, data]: [string, any]) => {
          // Skip current user
          if (userId === currentUser.uid) return false;
          
          // Check if typing indicator is less than 10 seconds old
          if (data.timestamp) {
            const typingTime = data.timestamp ? new Date(data.timestamp).getTime() : 0;
            return now - typingTime < 10000; // 10 seconds
          }
          return false;
        })
        .reduce((acc, [userId, data]) => {
          acc[userId] = data as TypingUser;
          return acc;
        }, {} as { [key: string]: TypingUser });
      
      setTypingUsers(filteredTyping);
    });

    return () => {
      unsubscribe();
    };
  }, [currentRoom, currentUser]);

  const createRoom = async (name: string, description: string) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create a room",
        variant: "destructive"
      });
      return null;
    }

    try {
      const roomId = await createChatRoom(name, description, currentUser.uid);
      toast({
        title: "Success",
        description: `Room "${name}" created successfully`,
      });
      return roomId;
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive"
      });
      return null;
    }
  };

  const sendNewMessage = async (text: string, type = 'text') => {
    if (!currentUser || !currentRoom) {
      toast({
        title: "Error",
        description: "You must be logged in and in a room to send a message",
        variant: "destructive"
      });
      return null;
    }

    try {
      const messageId = await sendMessage(currentRoom.id, currentUser.uid, text, type);
      return messageId;
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return null;
    }
  };

  const editExistingMessage = async (messageId: string, newText: string) => {
    if (!currentRoom) return;

    try {
      await editMessage(currentRoom.id, messageId, newText);
    } catch (error) {
      console.error("Error editing message:", error);
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive"
      });
    }
  };

  const deleteExistingMessage = async (messageId: string) => {
    if (!currentRoom) return;

    try {
      await deleteMessage(currentRoom.id, messageId);
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
  };

  const setTyping = async (isTyping: boolean) => {
    if (!currentUser || !currentRoom) return;

    try {
      await updateTypingStatus(currentRoom.id, currentUser.uid, isTyping);
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  };

  const value = {
    rooms,
    currentRoom,
    messages,
    typingUsers,
    loadingMessages,
    messageError,
    setCurrentRoom,
    createRoom,
    sendNewMessage,
    editExistingMessage,
    deleteExistingMessage,
    setTyping
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
