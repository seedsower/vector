import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: any | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<any | null>(null);
  const [wallet, setWallet] = useState<any>(null);

  // Check if Phantom wallet is available
  const getProvider = () => {
    if ('solana' in window) {
      const provider = (window as any).solana;
      if (provider.isPhantom) {
        return provider;
      }
    }
    return null;
  };

  const connect = async () => {
    setConnecting(true);
    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('Phantom wallet not found! Please install Phantom wallet.');
      }

      const response = await provider.connect();
      setWallet(provider);
      
      // Store wallet response
      if (response.publicKey) {
        setPublicKey(response.publicKey.toString());
        setConnected(true);
        localStorage.setItem('walletConnected', 'true');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please make sure Phantom is installed and unlocked.');
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    if (wallet) {
      wallet.disconnect();
    }
    setWallet(null);
    setPublicKey(null);
    setConnected(false);
    localStorage.removeItem('walletConnected');
  };

  const signTransaction = async (transaction: any) => {
    if (!wallet || !connected) {
      throw new Error('Wallet not connected');
    }
    return await wallet.signTransaction(transaction);
  };

  const signAllTransactions = async (transactions: any[]) => {
    if (!wallet || !connected) {
      throw new Error('Wallet not connected');
    }
    return await wallet.signAllTransactions(transactions);
  };

  // Auto-connect if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'true') {
      const provider = getProvider();
      if (provider) {
        provider.connect({ onlyIfTrusted: true })
          .then((response: any) => {
            setWallet(provider);
            setPublicKey(new PublicKey(response.publicKey.toString()));
            setConnected(true);
          })
          .catch(() => {
            // Silent fail for auto-connect
            localStorage.removeItem('walletConnected');
          });
      }
    }
  }, []);

  // Listen for wallet events
  useEffect(() => {
    const provider = getProvider();
    if (provider) {
      provider.on('connect', (publicKey: PublicKey) => {
        setPublicKey(publicKey);
        setConnected(true);
      });

      provider.on('disconnect', () => {
        setConnected(false);
        setPublicKey(null);
        setWallet(null);
        localStorage.removeItem('walletConnected');
      });

      provider.on('accountChanged', (publicKey: PublicKey) => {
        if (publicKey) {
          setPublicKey(publicKey);
        } else {
          disconnect();
        }
      });
    }

    return () => {
      if (provider) {
        provider.removeAllListeners();
      }
    };
  }, []);

  const value: WalletContextType = {
    connected,
    connecting,
    publicKey,
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Connection helper - disabled for demo mode
// export const connection = new Connection(clusterApiUrl('devnet'));