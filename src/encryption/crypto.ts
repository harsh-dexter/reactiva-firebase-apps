import CryptoJS from "crypto-js";

// Load the predefined encryption key from environment variables
const getEncryptionKey = (): string => {
  const key = import.meta.env.VITE_ENCRYPTION_KEY;
  
  if (!key) {
    console.error("Encryption key is missing! Set ENCRYPTION_KEY in environment variables.");
    return ""; // Prevent encryption errors
  }

  return CryptoJS.SHA256(key).toString(); // Derive a secure key
};

// Encrypt message using AES-256
export const encryptMessage = (message: string): string => {
  try {
    const key = getEncryptionKey();
    if (!key) return message; // Avoid encryption with an empty key

    return CryptoJS.AES.encrypt(message, key).toString();
  } catch (error) {
    console.error("Encryption failed:", error);
    return message;
  }
};

// Decrypt message using AES-256
export const decryptMessage = (encryptedMessage: string): string => {
  try {
    const key = getEncryptionKey();
    if (!key) return "Could not decrypt message";

    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "Could not decrypt message";
  }
};

// Check if a message is encrypted
export const isEncrypted = (message: string): boolean => {
  try {
    const key = getEncryptionKey();
    if (!key) return false;

    const bytes = CryptoJS.AES.decrypt(message, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    return decrypted !== "";
  } catch {
    return false;
  }
};

// Encrypt file metadata
export const encryptFileMetadata = (metadata: Record<string, any>): string => {
  try {
    const metadataStr = JSON.stringify(metadata);
    return encryptMessage(metadataStr);
  } catch (error) {
    console.error("Failed to encrypt file metadata:", error);
    return "";
  }
};

// Decrypt file metadata
export const decryptFileMetadata = (encryptedMetadata: string): Record<string, any> => {
  try {
    const decryptedStr = decryptMessage(encryptedMetadata);
    return JSON.parse(decryptedStr);
  } catch (error) {
    console.error("Failed to decrypt file metadata:", error);
    return {};
  }
};
