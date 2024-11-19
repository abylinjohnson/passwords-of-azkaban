import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';

// Generate a random encryption key
export const generateEncryptionKey = () => {
  return CryptoJS.lib.WordArray.random(256/8).toString(CryptoJS.enc.Hex);
};

// Encrypt data with user's wallet
export const encryptWithWallet = async (data, walletAddress) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Convert data to string if it's an object
    const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
    
    // Create a message with the data
    const messageString = `Encrypt this master key: ${dataString}`;
    
    // Sign the message
    const signature = await signer.signMessage(messageString);
    
    // Return both signature and original message for verification
    return JSON.stringify({
      signature,
      message: messageString
    });
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt data with signature
export const decryptWithWallet = (encryptedData, walletAddress) => {
  try {
    // Parse the stored data
    const { signature, message } = JSON.parse(encryptedData);
    
    // Verify the signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Invalid signature or wallet address mismatch');
    }
    
    // Extract the data part (after the prefix)
    const prefix = 'Encrypt this master key: ';
    const data = message.substring(prefix.length);
    
    // Try to parse as JSON if possible
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Encrypt data with a key
export const encryptData = (data, key) => {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, key).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt data with a key
export const decryptData = (encryptedData, key) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}; 