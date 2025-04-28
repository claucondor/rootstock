
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConnectWalletProps {
  onConnected?: () => void;
}

export const ConnectWallet = ({ onConnected }: ConnectWalletProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: "MetaMask no detectado",
        description: "Por favor instala MetaMask para continuar",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      setIsConnected(true);
      toast({
        title: "Wallet conectada",
        description: "Tu wallet ha sido conectada exitosamente"
      });
      
      if (onConnected) {
        onConnected();
      }
    } catch (error) {
      toast({
        title: "Error al conectar",
        description: "Hubo un error al conectar tu wallet",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button 
      onClick={connectWallet} 
      disabled={isConnecting || isConnected}
      variant="outline"
      className="bg-rootstock-primary text-white hover:bg-rootstock-primary/90"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isConnected ? 'Conectado' : isConnecting ? 'Conectando...' : 'Conectar Wallet'}
    </Button>
  );
};
