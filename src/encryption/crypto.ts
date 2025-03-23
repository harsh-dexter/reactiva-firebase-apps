
import CryptoJS from 'crypto-js';

// This is a simple client-side implementation for demo purposes
// In a production app, you would use proper end-to-end encryption with key exchange

// WARNING: In a real app, NEVER store encryption keys in the frontend code
// This is for demonstration purposes only
const ENCRYPTION_KEY = 'demonstrate-e2e-encryption-key';

export const encryptMessage = (message: string): string => {
  try {
    return CryptoJS.AES.encrypt(message, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return message;
  }
};

export const decryptMessage = (encryptedMessage: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return 'Could not decrypt message';
  }
};

export const isEncrypted = (message: string): boolean => {
  try {
    // Try to decrypt the message
    const bytes = CryptoJS.AES.decrypt(message, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    // If decryption succeeds and returns a non-empty string, it was encrypted
    return decrypted !== '';
  } catch (error) {
    // If decryption fails, the message was not encrypted
    return false;
  }
};

// ⚠️ Note: This implementation is for demo purposes only!
// In a production app, you would use a proper end-to-end encryption library
// with secure key exchange mechanisms and not store keys in the frontend code.
