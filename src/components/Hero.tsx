import { motion } from 'framer-motion';
import { ArrowDown, Code, Zap, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="pt-32 pb-16 px-4 md:px-8 relative min-h-[90vh] flex items-center">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-48 left-10 w-72 h-72 bg-rootstock-primary opacity-10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-600 opacity-10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-600 opacity-10 rounded-full blur-[90px]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-repeat opacity-5"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <span className="bg-gradient-to-r from-rootstock-primary to-purple-600 px-4 py-1 rounded-full text-sm font-medium text-white">
                Powered by IA
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Smart Contracts{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rootstock-primary to-purple-600">
                in Seconds
              </span>
            </motion.h1>

            <motion.p
              className="text-xl text-gray-300 mb-8 max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Crea y personaliza contratos inteligentes para Rootstock
              utilizando IA. Optimizado con OpenZeppelin y compatible con los
              estándares más recientes.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center">
                <div className="mr-2 p-2 bg-rootstock-primary/20 rounded-full">
                  <Code className="h-5 w-5 text-rootstock-primary" />
                </div>
                <span className="text-gray-300">100% Personalizable</span>
              </div>

              <div className="flex items-center">
                <div className="mr-2 p-2 bg-rootstock-primary/20 rounded-full">
                  <Shield className="h-5 w-5 text-rootstock-primary" />
                </div>
                <span className="text-gray-300">Seguridad Verificada</span>
              </div>

              <div className="flex items-center">
                <div className="mr-2 p-2 bg-rootstock-primary/20 rounded-full">
                  <Zap className="h-5 w-5 text-rootstock-primary" />
                </div>
                <span className="text-gray-300">Despliegue Rápido</span>
              </div>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link
                to="/contract-generator"
                className="px-8 py-4 bg-rootstock-primary text-white rounded-lg hover:bg-rootstock-primary/90 transition-colors flex items-center justify-center"
              >
                Get Started
              </Link>

              <a
                href="#how-it-works"
                className="px-8 py-4 bg-transparent border border-gray-600 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                How It Works
                <ArrowDown className="ml-2 h-5 w-5" />
              </a>
            </motion.div>
          </div>

          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-rootstock-primary to-purple-600 rounded-lg opacity-75 blur-sm"></div>
              <div className="relative bg-gray-800 p-2 rounded-lg border border-gray-700">
                <div className="bg-gray-900 rounded-md p-4 overflow-hidden">
                  <div className="flex items-center mb-4">
                    <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <div className="ml-4 text-xs text-gray-400">
                      smart-contract.sol
                    </div>
                  </div>

                  <pre className="text-xs md:text-sm font-mono text-gray-300 overflow-x-auto">
                    <code>
                      {`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RootstockToken is ERC20, Ownable {
    constructor() ERC20("RootstockToken", "RSK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`}
                    </code>
                  </pre>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-rootstock-primary text-white text-sm px-4 py-2 rounded-lg shadow-lg">
                Generated in seconds with AI
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
