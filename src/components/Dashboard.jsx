import { useState, useEffect } from 'react';
import { 
  generateEncryptionKey, 
  encryptWithWallet, 
  decryptWithWallet,
  encryptData,
  decryptData
} from '../utils/encryption';
import { saveToStorage, getFromStorage, STORAGE_KEYS } from '../utils/storage';
import { databases, DATABASE_ID, COLLECTION_ID, MASTER_KEYS_COLLECTION_ID } from '../config/appwrite';
import { ID, Query } from 'appwrite';
import './Dashboard.css';

const Dashboard = ({ walletAddress, onLogout }) => {
  const [passwords, setPasswords] = useState([]);
  const [masterKey, setMasterKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPassword, setNewPassword] = useState({
    website: '',
    username: '',
    password: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const initializeMasterKey = async () => {
    try {
      console.log('Initializing master key...');
      
      // Check Appwrite for existing master key
      const response = await databases.listDocuments(
        DATABASE_ID,
        MASTER_KEYS_COLLECTION_ID,
        [Query.equal('wallet_address', walletAddress.toLowerCase())]
      );

      let key;
      if (response.documents.length === 0) {
        console.log('No stored key found, generating new one...');
        key = generateEncryptionKey();
        console.log('Generated new key');
        
        const encryptedKey = await encryptWithWallet(key, walletAddress);
        console.log('Encrypted new key');
        
        // Save to Appwrite
        await databases.createDocument(
          DATABASE_ID,
          MASTER_KEYS_COLLECTION_ID,
          ID.unique(),
          {
            wallet_address: walletAddress.toLowerCase(),
            encrypted_key: encryptedKey
          }
        );
        console.log('Saved new key to Appwrite');
        
        // Save to local storage as backup
        saveToStorage(STORAGE_KEYS.MASTER_KEY, encryptedKey);
      } else {
        console.log('Found stored key, decrypting...');
        try {
          const encryptedKey = response.documents[0].encrypted_key;
          key = decryptWithWallet(encryptedKey, walletAddress);
          console.log('Successfully decrypted stored key');
          
          // Update local storage
          saveToStorage(STORAGE_KEYS.MASTER_KEY, encryptedKey);
        } catch (err) {
          console.error('Failed to decrypt stored key:', err);
          throw err;
        }
      }

      if (!key) {
        throw new Error('Failed to initialize master key');
      }

      setMasterKey(key);
      return key;
    } catch (error) {
      console.error('Master key initialization error:', error);
      throw new Error(`Failed to initialize master key: ${error.message}`);
    }
  };

  const loadPasswords = async (key) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('wallet_address', walletAddress.toLowerCase())]
      );
      
      const decryptedPasswords = response.documents.map(doc => {
        try {
          return {
            ...doc,
            ...decryptData(doc.encrypted_data, key)
          };
        } catch (err) {
          console.error('Failed to decrypt password:', err);
          return null;
        }
      }).filter(pwd => pwd !== null);

      setPasswords(decryptedPasswords);
      
      // Update local storage as backup
      saveToStorage(STORAGE_KEYS.PASSWORDS, response.documents);
    } catch (error) {
      console.error('Error loading passwords:', error);
      throw new Error('Failed to load passwords');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const key = await initializeMasterKey();
        await loadPasswords(key);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    if (walletAddress) {
      initialize();
    }
  }, [walletAddress]);

  const handleAddPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!masterKey) {
      setError('Encryption key not available');
      return;
    }

    try {
      const dataToEncrypt = {
        website: newPassword.website,
        username: newPassword.username,
        password: newPassword.password
      };

      const encryptedData = encryptData(dataToEncrypt, masterKey);
      
      // Save to Appwrite
      const newDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          wallet_address: walletAddress.toLowerCase(),
          encrypted_data: encryptedData,
          created_at: new Date().toISOString()
        }
      );

      // Update state
      setPasswords(prev => [...prev, {
        ...newDoc,
        ...dataToEncrypt
      }]);

      // Update local storage
      const storedPasswords = getFromStorage(STORAGE_KEYS.PASSWORDS) || [];
      saveToStorage(STORAGE_KEYS.PASSWORDS, [...storedPasswords, newDoc]);

      setNewPassword({ website: '', username: '', password: '' });
      setShowAddForm(false);
    } catch (error) {
      setError('Failed to save password: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      // Delete from Appwrite
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
      );

      // Update state
      setPasswords(passwords.filter(pwd => pwd.$id !== id));

      // Update local storage
      const storedPasswords = getFromStorage(STORAGE_KEYS.PASSWORDS) || [];
      saveToStorage(STORAGE_KEYS.PASSWORDS, storedPasswords.filter(pwd => pwd.$id !== id));
    } catch (error) {
      setError('Failed to delete password');
      console.error('Error deleting password:', error);
    }
  };

  const filteredPasswords = passwords.filter(pwd => 
    pwd.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pwd.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-wrapper">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>Passwords Of Azkaban</h1>
          <button 
            className="hamburger-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        
        <div className={`nav-content ${isMenuOpen ? 'open' : ''}`}>
          <div className="nav-search">
            <input
              type="text"
              placeholder="Search passwords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="nav-actions">
            <span className="wallet-address">
              {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
            </span>
            <button className="add-btn" onClick={() => setShowAddForm(true)}>
              + New Password
            </button>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {error && <div className="error-message">{error}</div>}

        <div className="table-container">
          <table className="passwords-table">
            <thead>
              <tr>
                <th>Website</th>
                <th>Username</th>
                <th>Password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPasswords.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-state">
                    No passwords saved yet
                  </td>
                </tr>
              ) : (
                filteredPasswords.map(pwd => (
                  <tr key={pwd.id}>
                    <td data-label="Website">{pwd.website}</td>
                    <td data-label="Username">{pwd.username}</td>
                    <td data-label="Password">••••••••</td>
                    <td data-label="Actions">
                      <div className="table-actions">
                        <button 
                          className="copy-btn tooltip"
                          onClick={() => navigator.clipboard.writeText(pwd.password)}
                          data-tooltip="Copy Password"
                        >
                          📋
                        </button>
                        <button 
                          className="delete-btn tooltip"
                          onClick={() => handleDelete(pwd.id)}
                          data-tooltip="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Password</h3>
            <form onSubmit={handleAddPassword}>
              <input
                type="text"
                placeholder="Website"
                value={newPassword.website}
                onChange={(e) => setNewPassword({...newPassword, website: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Username"
                value={newPassword.username}
                onChange={(e) => setNewPassword({...newPassword, username: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newPassword.password}
                onChange={(e) => setNewPassword({...newPassword, password: e.target.value})}
                required
              />
              <div className="modal-buttons">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 