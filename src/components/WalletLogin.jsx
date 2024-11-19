import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './WalletLogin.css';

const WalletLogin = ({ onLogin }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [chainId, setChainId] = useState('');

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountChange);
      window.ethereum.on('chainChanged', handleChainChange);
      window.ethereum.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
        window.ethereum.removeListener('chainChanged', handleChainChange);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  const checkConnection = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const network = await provider.getNetwork();
          setChainId(network.chainId);
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress('');
    setIsConnected(false);
    localStorage.removeItem('walletAddress');
  };

  const handleAccountChange = (accounts) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
      setIsConnected(true);
      if (onLogin) {
        onLogin(accounts[0]);
      }
    } else {
      handleDisconnect();
    }
  };

  const handleChainChange = (chainId) => {
    setChainId(parseInt(chainId, 16));
    window.location.reload();
  };

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = await provider.getSigner().getAddress();
        const network = await provider.getNetwork();
        setChainId(network.chainId);
        setWalletAddress(account);
        setIsConnected(true);
        setError('');
        if (onLogin) {
          onLogin(account);
        }
      } else {
        setError('Please install MetaMask to use this feature');
      }
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setIsConnected(false);
    setChainId('');
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getNetworkName = (chainId) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 137: return 'Polygon Mainnet';
      case 80001: return 'Mumbai Testnet';
      default: return 'Unknown Network';
    }
  };

  return (
    <div className="wallet-login-container">
      <h1>Passwords Of Azkaban</h1>
      {error && <p className="error">{error}</p>}
      
      {!isConnected ? (
        <button className="connect-button" onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <div className="wallet-info">
          <p>
            <strong>Connected Wallet:</strong><br />
            {formatAddress(walletAddress)}
          </p>
          {chainId && (
            <p>
              <strong>Network:</strong><br />
              {getNetworkName(chainId)}
            </p>
          )}
          <button className="disconnect-button" onClick={disconnectWallet}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletLogin; 