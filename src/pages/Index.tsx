import { useState } from 'react';
import Hero from '@/components/Hero';
import Terminal from '@/components/Terminal';
import Roadmap from '@/components/Roadmap';
import Header from '@/components/Header';
import HowItWorks from '@/components/HowItWorks';
import UseCases from '@/components/UseCases';
import Technologies from '@/components/Technologies';
import Footer from '@/components/Footer';

const Index = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const handleWalletConnection = (connected: boolean) => {
    setIsWalletConnected(connected);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header 
        isWalletConnected={isWalletConnected} 
        onWalletConnected={() => handleWalletConnection(true)} 
      />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Terminal Demo */}
      <Terminal />
      
      {/* How It Works Section */}
      <HowItWorks />
      
      {/* Use Cases Section */}
      <UseCases />
      
      {/* Roadmap Section */}
      <section id="roadmap" className="py-20">
        <Roadmap />
      </section>
      
      {/* Technologies Section */}
      <Technologies />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
