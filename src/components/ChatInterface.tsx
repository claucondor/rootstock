
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Code, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ContractVisualizer from './ContractVisualizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const EXAMPLE_PROMPTS = [
  {
    title: "Token ERC20",
    prompt: "Crea un token ERC20 llamado 'RootstockToken' con símbolo 'RSK' que permita al owner pausar las transferencias"
  },
  {
    title: "NFT Collection",
    prompt: "Genera un contrato para una colección NFT con mint limitado a 1000 tokens y whitelist"
  },
  {
    title: "Staking DeFi",
    prompt: "Crea un contrato de staking que permita a los usuarios depositar tokens y recibir recompensas"
  }
];

const DEFAULT_CONTRACT = `// SPDX-License-Identifier: MIT
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
}`;

const ChatInterface = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [isRefineMode, setIsRefineMode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(DEFAULT_CONTRACT);
  const { toast } = useToast();
  const [functionExplanations, setFunctionExplanations] = useState({
    mint: "Permite al owner crear nuevos tokens y asignarlos a una dirección",
    burn: "Permite quemar (destruir) tokens, reduciendo el suministro total",
    transfer: "Permite transferir tokens entre direcciones",
    approve: "Permite aprobar a otra dirección para gastar tokens en tu nombre"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (prompt.trim() === '') {
      toast({
        title: "Error",
        description: "Por favor ingrese un prompt para generar el contrato",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Simulación de generación
      setTimeout(() => {
        setGeneratedCode(DEFAULT_CONTRACT);
        setLoading(false);
        
        toast({
          title: "Contrato generado",
          description: "El contrato se ha generado correctamente",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al generar el contrato",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row bg-gray-900 rounded-lg overflow-hidden">
      {/* Chat Section */}
      <div className="w-full lg:w-1/2 p-6 border-r border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Smart Contract Generator</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={isRefineMode}
                onCheckedChange={setIsRefineMode}
              />
              <span className="text-sm text-gray-300">Modo Refinamiento</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCode(!showCode)}
            >
              <Code className="h-4 w-4 mr-2" />
              {showCode ? 'Ocultar Código' : 'Ver Código'}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Prompts de Ejemplo:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXAMPLE_PROMPTS.map((example) => (
              <Button
                key={example.title}
                variant="outline"
                className="justify-start"
                onClick={() => setPrompt(example.prompt)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {example.title}
              </Button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <textarea 
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-4 min-h-[120px]"
            placeholder={isRefineMode 
              ? "Describe los cambios que deseas hacer al contrato..." 
              : "Describe el contrato inteligente que deseas generar..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <Button 
            type="submit"
            className="w-full mt-4"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generando...
              </>
            ) : (
              isRefineMode ? 'Refinar Contrato' : 'Generar Contrato'
            )}
          </Button>
        </form>

        {generatedCode && showCode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="bg-gray-800 rounded-lg p-4 overflow-auto max-h-[400px]">
              <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
                {generatedCode}
              </pre>
            </div>
          </motion.div>
        )}
      </div>

      {/* Visualization Section */}
      <div className="w-full lg:w-1/2 p-6">
        <ContractVisualizer />
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Explicación de Funciones</CardTitle>
              <CardDescription>Detalle de cada función del contrato</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(functionExplanations).map(([func, explanation]) => (
                  <div key={func} className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-2">{func}()</h4>
                    <p className="text-gray-300">{explanation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
