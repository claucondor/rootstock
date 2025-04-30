import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ApiDemo = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    source: string;
    success: boolean;
  } | null>(null);
  const { toast } = useToast();

  const examplePrompts = [
    "Crea un token ERC20 llamado 'RootstockToken' con símbolo 'RSK' y 18 decimales",
    'Genera un contrato que permita hacer swaps en Uniswap V3 en Rootstock',
    'Crea un contrato de staking simple que permita a usuarios depositar tokens ERC20',
    'Genera un contrato que permita a los usuarios proveer liquidez en pools de Uniswap V3',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (prompt.trim() === '') {
      toast({
        title: 'Error',
        description: 'Please enter a prompt to generate the contract',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    // Simulamos la llamada a la API (en producción esto sería una llamada real)
    setTimeout(() => {
      // Ejemplo de respuesta simulada
      setResult({
        success: true,
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RootstockToken is ERC20, ERC20Burnable, Pausable, Ownable {
    constructor() ERC20("RootstockToken", "RSK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}`,
      });
      setLoading(false);

      toast({
        title: 'Contract generated',
        description: 'The contract has been generated successfully',
      });
    }, 2000);
  };

  const useExamplePrompt = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold mb-6 text-white">Try our API</h3>

      <div className="mb-6">
        <h4 className="text-sm text-gray-400 mb-2">Prompt examples:</h4>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => useExamplePrompt(example)}
              className="text-xs bg-gray-800/70 text-gray-300 px-3 py-1 rounded-full hover:bg-rootstock-primary/30 hover:text-white transition-colors"
            >
              {example.length > 40 ? example.substring(0, 40) + '...' : example}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <textarea
            className="w-full bg-gray-800/50 text-white border border-gray-700 rounded-lg p-4 min-h-[120px]"
            placeholder="Describe the smart contract you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-rootstock-primary text-white rounded-lg flex items-center justify-center hover:bg-rootstock-primary/90 transition-colors disabled:bg-gray-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating contract...
            </>
          ) : (
            'Generate contract'
          )}
        </button>
      </form>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <h4 className="text-white font-semibold mb-2">Generated contract:</h4>
          <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[400px]">
            <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
              {result.source}
            </pre>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <p>
              In a real implementation, the response would also include the contract ABI,
              compiled bytecode and additional analysis.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ApiDemo;
