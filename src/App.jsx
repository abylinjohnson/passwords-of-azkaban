import { useState, useEffect } from 'react';
import WalletLogin from './components/WalletLogin';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Check for existing session on component mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('walletAddress');
    if (savedWallet) {
      setWalletAddress(savedWallet);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (address) => {
    setWalletAddress(address);
    setIsAuthenticated(true);
    localStorage.setItem('walletAddress', address);
  };

  const handleLogout = () => {
    setWalletAddress('');
    setIsAuthenticated(false);
    localStorage.removeItem('walletAddress');
  };

  return (
    <div className="App">
      {!isAuthenticated ? (
        <WalletLogin onLogin={handleLogin} />
      ) : (
        <Dashboard 
          walletAddress={walletAddress} 
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
