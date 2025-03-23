
import CryptoJS from 'crypto-js';

// This implements client-side AES-256 encryption for messages
// In a production app, you would implement proper key exchange mechanisms

// Generate a random encryption key if not already in localStorage
const getEncryptionKey = (): string => {
  let key = localStorage.getItem('encryption_key');
  if (!key) {
    // Generate a secure random key (32 bytes for AES-256)
    const randomArray = new Uint8Array(32);
    window.crypto.getRandomValues(randomArray);
    key = Array.from(randomArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem('encryption_key', key);
  }
  return key;
};

// Encrypt message using AES-256
export const encryptMessage = (message: string): string => {
  try {
    const key = getEncryptionKey();
    return CryptoJS.AES.encrypt(message, key).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return message;
  }
};

// Decrypt message using AES-256
export const decryptMessage = (encryptedMessage: string): string => {
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return 'Could not decrypt message';
  }
};

// Check if a message is encrypted
export const isEncrypted = (message: string): boolean => {
  try {
    // Try to decrypt the message
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(message, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    // If decryption succeeds and returns a non-empty string, it was encrypted
    return decrypted !== '';
  } catch (error) {
    // If decryption fails, the message was not encrypted
    return false;
  }
};

// Function to encrypt and decrypt file metadata
export const encryptFileMetadata = (metadata: Record<string, any>): string => {
  const metadataStr = JSON.stringify(metadata);
  return encryptMessage(metadataStr);
};

export const decryptFileMetadata = (encryptedMetadata: string): Record<string, any> => {
  try {
    const decryptedStr = decryptMessage(encryptedMetadata);
    return JSON.parse(decryptedStr);
  } catch (error) {
    console.error('Failed to decrypt file metadata:', error);
    return {};
  }
};
