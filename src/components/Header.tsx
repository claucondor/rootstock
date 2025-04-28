import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ConnectWallet } from '@/components/ConnectWallet';

interface HeaderProps {
  isWalletConnected?: boolean;
  onWalletConnected?: () => void;
}

const Header = ({ isWalletConnected = false, onWalletConnected }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0c0f1d]/90 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto flex items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center">
          <div className="mr-3 text-rootstock-primary font-bold text-3xl">R</div>
          <span className="text-xl font-semibold text-white">SmartGenAI</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors">Características</a>
          <a href="#demo" className="text-gray-300 hover:text-white transition-colors">Demo</a>
          <a href="#roadmap" className="text-gray-300 hover:text-white transition-colors">Roadmap</a>
          <a href="#about" className="text-gray-300 hover:text-white transition-colors">Nosotros</a>
          <Link to="/contract-generator" className="text-rootstock-primary hover:text-rootstock-primary/80 transition-colors">
            Generador de Contratos
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <a href="/docs" className="hidden md:block text-gray-300 hover:text-white transition-colors">Docs</a>
          {isWalletConnected ? (
            <Link to="/contract-generator" className="px-5 py-2 bg-rootstock-primary text-white rounded-lg hover:bg-rootstock-primary/80 transition-colors">
              Ir al Generador
            </Link>
          ) : (
            <ConnectWallet onConnected={onWalletConnected} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
