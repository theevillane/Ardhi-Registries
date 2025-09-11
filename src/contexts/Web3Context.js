import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import LandRegistryABI from '../abis/LandRegistry.json';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Contract configuration
  const CONTRACT_ADDRESSES = {
    1337: process.env.REACT_APP_CONTRACT_ADDRESS || "0x...", // Ganache
    5777: process.env.REACT_APP_CONTRACT_ADDRESS || "0x...", // Ganache CLI
    3: process.env.REACT_APP_CONTRACT_ADDRESS_ROPSTEN || "0x...", // Ropsten
    4: process.env.REACT_APP_CONTRACT_ADDRESS_RINKEBY || "0x...", // Rinkeby
    5: process.env.REACT_APP_CONTRACT_ADDRESS_GOERLI || "0x...", // Goerli
  };

  const initializeWeb3 = useCallback(async () => {
    try {
      setError(null);
      setIsConnecting(true);

      if (window.ethereum) {
        // Modern dapp browsers
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });

        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }

        // Get network ID
        const networkId = await web3Instance.eth.net.getId();
        setNetworkId(networkId);

        // Initialize contract
        const contractAddress = CONTRACT_ADDRESSES[networkId];
        if (contractAddress && contractAddress !== "0x...") {
          const contractInstance = new web3Instance.eth.Contract(
            LandRegistryABI.abi,
            contractAddress
          );
          setContract(contractInstance);
        }

        // Set up event listeners
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        window.ethereum.on('disconnect', handleDisconnect);

      } else if (window.web3) {
        // Legacy dapp browsers
        const web3Instance = new Web3(window.web3.currentProvider);
        setWeb3(web3Instance);
        
        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }

        const networkId = await web3Instance.eth.net.getId();
        setNetworkId(networkId);

        const contractAddress = CONTRACT_ADDRESSES[networkId];
        if (contractAddress && contractAddress !== "0x...") {
          const contractInstance = new web3Instance.eth.Contract(
            LandRegistryABI.abi,
            contractAddress
          );
          setContract(contractInstance);
        }
      } else {
        throw new Error('No Ethereum provider detected. Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error initializing Web3:', error);
      setError(error.message);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      setIsConnecting(true);

      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        localStorage.setItem('connectedAccount', accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setIsConnected(false);
    setContract(null);
    setNetworkId(null);
    localStorage.removeItem('connectedAccount');
  }, []);

  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
      localStorage.setItem('connectedAccount', accounts[0]);
    }
  }, [disconnectWallet]);

  const handleChainChanged = useCallback((chainId) => {
    // Reload the page when chain changes
    window.location.reload();
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  const getContractAddress = useCallback(() => {
    return CONTRACT_ADDRESSES[networkId] || null;
  }, [networkId]);

  const isCorrectNetwork = useCallback(() => {
    const supportedNetworks = Object.keys(CONTRACT_ADDRESSES);
    return supportedNetworks.includes(networkId?.toString());
  }, [networkId]);

  // Initialize on mount
  useEffect(() => {
    // Check if user was previously connected
    const savedAccount = localStorage.getItem('connectedAccount');
    if (savedAccount && window.ethereum) {
      initializeWeb3();
    }
  }, [initializeWeb3]);

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [handleAccountsChanged, handleChainChanged, handleDisconnect]);

  const value = {
    web3,
    account,
    contract,
    networkId,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    initializeWeb3,
    getContractAddress,
    isCorrectNetwork,
    setError
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Context;
