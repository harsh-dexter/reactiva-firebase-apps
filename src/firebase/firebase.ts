
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  push, 
  update, 
  remove, 
  serverTimestamp 
} from "firebase/database";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Anonymous authentication
export const signInAnonymous = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Listen for auth state changes
export const onAuthChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Generate random username and avatar
export const generateRandomUsername = () => {
  const adjectives = ["Happy", "Brave", "Clever", "Gentle", "Swift", "Wise", "Calm", "Bold", "Bright", "Free"];
  const nouns = ["Wolf", "Eagle", "Tiger", "Dolphin", "Fox", "Panda", "Lion", "Falcon", "Bear", "Hawk"];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  
  return `${randomAdjective}${randomNoun}${randomNumber}`;
};

export const generateRandomAvatarColor = () => {
  const colors = [
    "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
    "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
    "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722"
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

// Chat room functions
export const createUserProfile = async (userId: string, username: string, avatarColor: string) => {
  try {
    await set(ref(database, `users/${userId}`), {
      username,
      avatarColor,
      createdAt: serverTimestamp(),
      lastOnline: serverTimestamp(),
      isOnline: true
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

export const updateUserStatus = async (userId: string, isOnline: boolean) => {
  try {
    await update(ref(database, `users/${userId}`), {
      isOnline,
      lastOnline: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};

export const getChatRooms = (callback: (rooms: any) => void) => {
  const roomsRef = ref(database, 'rooms');
  return onValue(roomsRef, (snapshot) => {
    const rooms = snapshot.val() || {};
    callback(rooms);
  });
};

export const createChatRoom = async (name: string, description: string, createdBy: string) => {
  try {
    const roomsRef = ref(database, 'rooms');
    const newRoomRef = push(roomsRef);
    await set(newRoomRef, {
      name,
      description,
      createdBy,
      createdAt: serverTimestamp()
    });
    return newRoomRef.key;
  } catch (error) {
    console.error("Error creating chat room:", error);
    throw error;
  }
};

export const getMessages = (roomId: string, callback: (messages: any) => void) => {
  const messagesRef = ref(database, `messages/${roomId}`);
  return onValue(messagesRef, (snapshot) => {
    const messages = snapshot.val() || {};
    callback(messages);
  });
};

export const sendMessage = async (roomId: string, userId: string, text: string, type = 'text') => {
  try {
    const messagesRef = ref(database, `messages/${roomId}`);
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
      userId,
      text,
      type,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      edited: false
    });
    return newMessageRef.key;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const editMessage = async (roomId: string, messageId: string, newText: string) => {
  try {
    await update(ref(database, `messages/${roomId}/${messageId}`), {
      text: newText,
      edited: true,
      editedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error editing message:", error);
    throw error;
  }
};

export const deleteMessage = async (roomId: string, messageId: string) => {
  try {
    await remove(ref(database, `messages/${roomId}/${messageId}`));
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

export const updateTypingStatus = async (roomId: string, userId: string, isTyping: boolean) => {
  try {
    if (isTyping) {
      await set(ref(database, `typing/${roomId}/${userId}`), {
        timestamp: serverTimestamp()
      });
    } else {
      await remove(ref(database, `typing/${roomId}/${userId}`));
    }
  } catch (error) {
    console.error("Error updating typing status:", error);
    throw error;
  }
};

export const getTypingUsers = (roomId: string, callback: (typingUsers: any) => void) => {
  const typingRef = ref(database, `typing/${roomId}`);
  return onValue(typingRef, (snapshot) => {
    const typingUsers = snapshot.val() || {};
    callback(typingUsers);
  });
};

export { auth, database, storage };
