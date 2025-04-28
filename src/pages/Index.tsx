import { motion } from 'framer-motion';
import { useState } from 'react';
import Hero from '@/components/Hero';
import Terminal from '@/components/Terminal';
import Roadmap from '@/components/Roadmap';
import { ConnectWallet } from '@/components/ConnectWallet';
import Header from '@/components/Header';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const handleWalletConnection = (connected: boolean) => {
    setIsWalletConnected(connected);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <Hero />
      <Terminal />
      
      <section id="demo" className="py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-6">Smart Contract Generator</h2>
            <p className="text-gray-300 text-center max-w-2xl mb-8">
              Genera contratos inteligentes personalizados para Rootstock utilizando nuestra IA. 
              Conecta tu wallet para comenzar.
            </p>
            {!isWalletConnected && (
              <ConnectWallet onConnected={() => handleWalletConnection(true)} />
            )}
          </div>
          
          {isWalletConnected ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center max-w-3xl mx-auto">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-2">¡Wallet Conectada!</h3>
              <p className="text-gray-300 mb-6">
                Ahora puedes acceder al generador de contratos inteligentes y comenzar a crear tus propios contratos para Rootstock.
              </p>
              <Link to="/contract-generator">
                <Button className="bg-rootstock-primary hover:bg-rootstock-primary/80 text-white px-6 py-3">
                  Ir al Generador de Contratos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm text-center max-w-3xl mx-auto">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-white mb-2">Conecta tu Wallet</h3>
              <p className="text-gray-300 mb-4">
                Para acceder al generador de contratos inteligentes, necesitas conectar tu wallet.
              </p>
              <ConnectWallet onConnected={() => handleWalletConnection(true)} />
            </div>
          )}
        </div>
      </section>
      
      <section id="roadmap" className="py-20">
        <Roadmap />
      </section>
    </div>
  );
};

export default Index;
