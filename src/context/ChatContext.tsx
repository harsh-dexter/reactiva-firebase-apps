import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getDatabase, 
  ref, 
  onValue, 
  push, 
  set, 
  update,
  remove,
  serverTimestamp
} from 'firebase/database';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { encryptMessage, encryptFileMetadata } from '../encryption/crypto';

// Define the Room type
export interface Room {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
}

// Define the Message type
export interface Message {
  id: string;
  text: string;
  type: string;
  userId: string;
  createdAt: string;
  edited: boolean;
  isEncrypted?: boolean;
}

// Define the context type
interface ChatContextType {
  rooms: Room[];
  messages: Message[];
  currentRoom: Room | null;
  setCurrentRoom: (room: Room) => void;
  loadingMessages: boolean;
  typingUsers: Record<string, boolean>;
  setTyping: (isTyping: boolean) => void;
  sendNewMessage: (text: string) => Promise<void>;
  editExistingMessage: (messageId: string, newText: string) => Promise<void>;
  deleteExistingMessage: (messageId: string) => Promise<void>;
  createRoom: (name: string, description: string) => Promise<void>;
  uploadImageMessage: (file: File) => Promise<string | null>;
  uploadVoiceMessage: (audioBlob: Blob) => Promise<string | null>;
  sendVoiceMessage: (audioBlob: Blob) => Promise<string | null>;
}

// Create the context with default values
const ChatContext = createContext<ChatContextType>({
  rooms: [],
  messages: [],
  currentRoom: null,
  setCurrentRoom: () => {},
  loadingMessages: false,
  typingUsers: {},
  setTyping: () => {},
  sendNewMessage: async () => {},
  editExistingMessage: async () => {},
  deleteExistingMessage: async () => {},
  createRoom: async () => {},
  uploadImageMessage: async () => null,
  uploadVoiceMessage: async () => null,
  sendVoiceMessage: async () => null
});

// Hook to use the context
export const useChat = () => useContext(ChatContext);

// Function to upload a voice message
const uploadVoiceMessage = async (
  roomId: string, 
  userId: string, 
  audioBlob: Blob
): Promise<string> => {
  const storage = getStorage();
  const filePath = `voice-messages/${roomId}/${userId}/${Date.now()}.webm`;
  const fileRef = storageRef(storage, filePath);
  
  await uploadBytes(fileRef, audioBlob);
  const downloadUrl = await getDownloadURL(fileRef);
  
  // Create a message reference
  const db = getDatabase();
  const messagesRef = ref(db, `messages/${roomId}`);
  const newMessageRef = push(messagesRef);
  
  // Create metadata for the voice message
  const metadata = {
    url: downloadUrl,
    duration: 0, // We could calculate this
    size: audioBlob.size
  };
  
  // Encrypt the metadata
  const encryptedMetadata = encryptFileMetadata(metadata);
  
  // Save the message
  await set(newMessageRef, {
    text: encryptedMetadata,
    type: 'voice',
    userId,
    createdAt: serverTimestamp(),
    edited: false,
    isEncrypted: true
  });
  
  return newMessageRef.key || '';
};

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const db = getDatabase();

  // Fix the naming conflict by properly implementing sendVoiceMessage
  const sendVoiceMessage = async (audioBlob: Blob): Promise<string | null> => {
    if (!currentUser || !currentRoom) {
      toast({
        title: "Error",
        description: "You must be logged in and in a room to send a voice message",
        variant: "destructive"
      });
      return null;
    }

    try {
      const messageId = await uploadVoiceMessage(currentRoom.id, currentUser.uid, audioBlob);
      return messageId;
    } catch (error) {
      console.error("Error uploading voice message:", error);
      toast({
        title: "Error", 
        description: "Failed to upload voice message",
        variant: "destructive"
      });
      return null;
    }
  };

  // Upload a voice message - we'll add this function to match the ChatContextType interface
  const uploadVoiceMessage = async (audioBlob: Blob): Promise<string | null> => {
    if (!currentUser || !currentRoom) {
      toast({
        title: "Error",
        description: "You must be logged in and in a room to send a voice message",
        variant: "destructive"
      });
      return null;
    }

    try {
      const storage = getStorage();
      const filePath = `voice-messages/${currentRoom.id}/${currentUser.uid}/${Date.now()}.webm`;
      const fileRef = storageRef(storage, filePath);
      
      await uploadBytes(fileRef, audioBlob);
      const downloadUrl = await getDownloadURL(fileRef);
      
      // Create a message reference
      const messagesRef = ref(db, `messages/${currentRoom.id}`);
      const newMessageRef = push(messagesRef);
      
      // Create metadata for the voice message
      const metadata = {
        url: downloadUrl,
        duration: 0, // We could calculate this
        size: audioBlob.size
      };
      
      // Encrypt the metadata
      const encryptedMetadata = encryptFileMetadata(metadata);
      
      // Save the message
      await set(newMessageRef, {
        text: encryptedMetadata,
        type: 'voice',
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        edited: false,
        isEncrypted: true
      });
      
      return newMessageRef.key;
    } catch (error) {
      console.error("Error uploading voice message:", error);
      toast({
        title: "Error",
        description: "Failed to upload voice message",
        variant: "destructive"
      });
      return null;
    }
  };

  // Load rooms
  useEffect(() => {
    if (!currentUser) return;

    const roomsRef = ref(db, 'rooms');
    
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const roomsData = snapshot.val();
      if (!roomsData) return;
      
      const loadedRooms: Room[] = Object.entries(roomsData).map(([id, data]: [string, any]) => ({
        id,
        name: data.name,
        description: data.description,
        createdAt: data.createdAt,
        createdBy: data.createdBy
      }));
      
      setRooms(loadedRooms);
      
      // If no room is selected and rooms are available, select the first one
      if (!currentRoom && loadedRooms.length > 0) {
        setCurrentRoom(loadedRooms[0]);
      }
    });
    
    return () => unsubscribe();
  }, [currentUser, db]);

  // Load messages for the current room
  useEffect(() => {
    if (!currentRoom) {
      setMessages([]);
      return;
    }
    
    setLoadingMessages(true);
    const messagesRef = ref(db, `messages/${currentRoom.id}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      setLoadingMessages(false);
      const messagesData = snapshot.val();
      if (!messagesData) {
        setMessages([]);
        return;
      }
      
      const loadedMessages: Message[] = Object.entries(messagesData)
        .map(([id, data]: [string, any]) => ({
          id,
          text: data.text,
          type: data.type || 'text',
          userId: data.userId,
          createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
          edited: !!data.edited,
          isEncrypted: !!data.isEncrypted
        }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setMessages(loadedMessages);
    });
    
    return () => unsubscribe();
  }, [currentRoom, db]);

  // Handle typing indicators
  const setTyping = (isTyping: boolean) => {
    if (!currentUser || !currentRoom) return;
    
    const typingRef = ref(db, `typing/${currentRoom.id}/${currentUser.uid}`);
    
    if (isTyping) {
      set(typingRef, true);
      // Auto-clear typing indicator after 5 seconds
      setTimeout(() => {
        set(typingRef, null);
      }, 5000);
    } else {
      set(typingRef, null);
    }
  };

  // Listen for typing indicators
  useEffect(() => {
    if (!currentRoom) {
      setTypingUsers({});
      return;
    }
    
    const typingRef = ref(db, `typing/${currentRoom.id}`);
    
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const typingData = snapshot.val();
      if (!typingData) {
        setTypingUsers({});
        return;
      }
      
      const typingUsersObj: Record<string, boolean> = {};
      Object.keys(typingData).forEach((userId) => {
        // Don't show the current user as typing
        if (userId !== currentUser?.uid) {
          typingUsersObj[userId] = true;
        }
      });
      
      setTypingUsers(typingUsersObj);
    });
    
    return () => unsubscribe();
  }, [currentRoom, currentUser, db]);

  // Send a new message
  const sendNewMessage = async (text: string): Promise<void> => {
    if (!currentUser || !currentRoom) {
      toast({
        title: "Error",
        description: "You must be logged in and in a room to send a message",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const messagesRef = ref(db, `messages/${currentRoom.id}`);
      const newMessageRef = push(messagesRef);
      
      // Encrypt the message
      const encryptedText = encryptMessage(text);
      
      await set(newMessageRef, {
        text: encryptedText,
        type: 'text',
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        edited: false,
        isEncrypted: true
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  // Edit an existing message
  const editExistingMessage = async (messageId: string, newText: string): Promise<void> => {
    if (!currentUser || !currentRoom) {
      toast({
        title: "Error",
        description: "You must be logged in and in a room to edit a message",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const messageRef = ref(db, `messages/${currentRoom.id}/${messageId}`);
      
      // Encrypt the new message text
      const encryptedText = encryptMessage(newText);
      
      await update(messageRef, {
        text: encryptedText,
        edited: true
      });
    } catch (error) {
      console.error("Error editing message:", error);
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive"
      });
    }
  };

  // Delete an existing message
  const deleteExistingMessage = async (messageId: string): Promise<void> => {
    if (!currentUser || !currentRoom) {
      toast({
        title: "Error",
        description: "You must be logged in and in a room to delete a message",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const messageRef = ref(db, `messages/${currentRoom.id}/${messageId}`);
      await remove(messageRef);
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
  };

  // Create a new room
  const createRoom = async (name: string, description: string): Promise<void> => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create a room",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const roomsRef = ref(db, 'rooms');
      const newRoomRef = push(roomsRef);
      
      await set(newRoomRef, {
        name,
        description,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid
      });
      
      // Set the current room to the newly created room
      const newRoom: Room = {
        id: newRoomRef.key || '',
        name,
        description,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid
      };
      
      setCurrentRoom(newRoom);
      
      toast({
        title: "Success",
        description: `Room "${name}" created successfully`
      });
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive"
      });
    }
  };

  // Upload an image message
  const uploadImageMessage = async (file: File): Promise<string | null> => {
    if (!currentUser || !currentRoom) {
      toast({
        title: "Error",
        description: "You must be logged in and in a room to send an image",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      const storage = getStorage();
      const filePath = `images/${currentRoom.id}/${currentUser.uid}/${Date.now()}-${file.name}`;
      const fileRef = storageRef(storage, filePath);
      
      await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);
      
      // Create a message reference
      const messagesRef = ref(db, `messages/${currentRoom.id}`);
      const newMessageRef = push(messagesRef);
      
      // Create metadata for the image
      const metadata = {
        url: downloadUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      };
      
      // Encrypt the metadata
      const encryptedMetadata = encryptFileMetadata(metadata);
      
      // Save the message
      await set(newMessageRef, {
        text: encryptedMetadata,
        type: 'image',
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        edited: false,
        isEncrypted: true
      });
      
      return newMessageRef.key;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
      return null;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        rooms,
        messages,
        currentRoom,
        setCurrentRoom,
        loadingMessages,
        typingUsers,
        setTyping,
        sendNewMessage,
        editExistingMessage,
        deleteExistingMessage,
        createRoom,
        uploadImageMessage,
        uploadVoiceMessage,
        sendVoiceMessage
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
