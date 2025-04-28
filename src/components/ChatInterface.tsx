import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Code, MessageSquare, PanelLeftOpen, PanelLeftClose, Eye, EyeOff, Compass, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ContractVisualizer from './ContractVisualizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CodeViewer from './CodeViewer';
import useContractStorage from '@/hooks/use-contract-storage';
import GenerationConsole from './GenerationConsole';
import AnimatedCard from './ui/animated-card';

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

// Simular ABI y Bytecode para demostración
const DEFAULT_ABI = `[
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  }
]`;

const DEFAULT_BYTECODE = "0x60806040523480156100105760006000fd5b5060405161083b3803806108...";

const ChatInterface = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [isRefineMode, setIsRefineMode] = useState(false);
  const [showEditorPanel, setShowEditorPanel] = useState(true);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isExploreMode, setIsExploreMode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(DEFAULT_CONTRACT);
  const [generatedAbi, setGeneratedAbi] = useState<string>(DEFAULT_ABI);
  const [generatedBytecode, setGeneratedBytecode] = useState<string>(DEFAULT_BYTECODE);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { toast } = useToast();
  const { saveContract } = useContractStorage();
  const [functionExplanations, setFunctionExplanations] = useState({
    mint: 'Crea tokens de forma segura y creativa',
    burn: 'Reduce tokens con efectos dinámicos',
    transfer: 'Transfiere tokens de manera fluida',
    approve: 'Aprueba accesos interactivamente'
  });

  // Simulate progress during generation
  useEffect(() => {
    if (loading) {
      setGenerationProgress(0);
      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 300);
      
      return () => {
        clearInterval(interval);
        setGenerationProgress(100);
      };
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    
    setLoading(true);
    
    try {
      // Simulación de generación - En un entorno real, esto haría una llamada API
      setTimeout(() => {
        // Simulamos el resultado de la generación
        const contractName = "RootstockToken"; // En un entorno real, esto vendría de la respuesta
        
        toast({
          title: `Contrato ${isRefineMode ? 'refinado' : 'generado'} correctamente`,
          description: `El contrato ${contractName} ha sido ${isRefineMode ? 'refinado' : 'creado'} exitosamente.`,
        });
        
        // Guardamos el contrato generado
        if (!isRefineMode) {
          saveContract({
            id: Date.now().toString(),
            name: contractName,
            description: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
            sourceCode: DEFAULT_CONTRACT,
            abi: DEFAULT_ABI,
            bytecode: DEFAULT_BYTECODE
          });
        }
        
        setLoading(false);
      }, 3000);
    } catch (error) {
      toast({
        title: "Error en la generación",
        description: "Ha ocurrido un error al generar el contrato. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700 rounded-lg overflow-hidden h-screen grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0">
      <AnimatePresence>
        {showEditorPanel && (
          <motion.div
            initial={{ x: '-100%', opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: '-100%', opacity: 0, scale: 0.95 }}
            transition={{ type: 'tween', ease: 'anticipate', duration: 0.4 }}
            className="lg:block border-r border-gray-600 bg-gray-850 h-full overflow-y-auto shadow-md backdrop-blur-sm"
          >
            <div className="p-4">
              <AnimatedCard className="mb-4 shadow-lg shadow-blue-900/20 border-gray-700">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">Smart Contract AI</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Switch checked={isRefineMode} onCheckedChange={setIsRefineMode} />
                      <span className="text-sm text-gray-300">Refinamiento</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowEditorPanel(false)} className="text-gray-300 hover:text-white transition-colors duration-200">
                      <PanelLeftClose className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AnimatedCard>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-4"
              >
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Prompts de Ejemplo:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {EXAMPLE_PROMPTS.map((example, index) => (
                    <motion.div 
                      key={example.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + (index * 0.1) }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start h-auto py-2 text-left w-full group"
                        onClick={() => setPrompt(example.prompt)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                        <span className="truncate">
                          {example.title}
                        </span>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <AnimatedCard 
                className="mb-4 overflow-hidden border-gray-700" 
                delay={0.2}
              >
                <form onSubmit={handleSubmit} className="p-3">
                  <textarea 
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-3 min-h-[120px] text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
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
                    className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      isRefineMode ? 'Refinar Contrato' : 'Generar Contrato'
                    )}
                  </Button>
                </form>
              </AnimatedCard>

              {loading && (
                <AnimatedCard 
                  className="mb-4" 
                  delay={0.3}
                  hoverEffect={false}
                >
                  <GenerationConsole 
                    isGenerating={loading} 
                    progress={generationProgress} 
                  />
                </AnimatedCard>
              )}

              {isExploreMode && (
                <AnimatedCard className="mb-4" delay={0.3}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-400">Explorar Funciones</h4>
                      <Button variant="ghost" size="sm" onClick={() => setIsExploreMode(false)} className="h-7 w-7 p-0">
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(functionExplanations).map(([name, desc], index) => (
                        <motion.div 
                          key={name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + (index * 0.1) }}
                          className="p-2 bg-gray-800 rounded text-xs"
                        >
                          <div className="font-semibold text-white mb-1">{name}()</div>
                          <div className="text-gray-300">{desc}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </AnimatedCard>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-col h-full overflow-y-auto bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900">
        {!showEditorPanel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-4 left-4 z-10"
          >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowEditorPanel(true)}
              className="bg-gray-800 border-gray-700 shadow-lg"
            >
              <PanelLeftOpen className="h-4 w-4 mr-2" />
              Panel de Edición
            </Button>
          </motion.div>
        )}
        
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            <div className="lg:flex-1 order-2 lg:order-1 space-y-4">
              <AnimatedCard className="border-gray-700 shadow-xl">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold flex items-center">
                      <Code className="h-5 w-5 mr-2 text-blue-400" />
                      Contrato Generado
                    </CardTitle>
                    <div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowCode(!showCode)} 
                        className="h-8 w-8 p-0"
                      >
                        {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Vista del código con sintaxis resaltada
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {showCode && generatedCode && (
                    <CodeViewer 
                      code={generatedCode} 
                      language="solidity" 
                      maxHeight="600px"
                    />
                  )}
                </CardContent>
              </AnimatedCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatedCard className="border-gray-700" delay={0.1}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">ABI</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[200px] overflow-auto">
                      <CodeViewer 
                        code={generatedAbi} 
                        language="json" 
                        showLineNumbers={false}
                      />
                    </div>
                  </CardContent>
                </AnimatedCard>
                
                <AnimatedCard className="border-gray-700" delay={0.2}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Bytecode</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[200px] overflow-auto">
                      <CodeViewer 
                        code={generatedBytecode} 
                        language="text" 
                        showLineNumbers={false}
                      />
                    </div>
                  </CardContent>
                </AnimatedCard>
              </div>
            </div>
            
            <div className="lg:w-1/3 order-1 lg:order-2">
              <AnimatedCard className="border-gray-700 h-full shadow-xl" delay={0.3}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold">Visualización</CardTitle>
                    <div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsExploreMode(!isExploreMode)}
                        className="h-8 px-2"
                      >
                        <Compass className="h-4 w-4 mr-1" />
                        <span className="text-xs">Explorar</span>
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Representación visual del contrato
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedCode && (
                    <div className="h-[400px] lg:h-[600px]">
                      <ContractVisualizer contractData={{ sourceCode: generatedCode }} />
                    </div>
                  )}
                </CardContent>
              </AnimatedCard>
            </div>
          </div>
        </div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-3 bg-gray-800/70 backdrop-blur-sm border-t border-gray-700 text-xs text-gray-400"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="mr-4">
                <Switch 
                  checked={isCompactMode} 
                  onCheckedChange={setIsCompactMode} 
                  className="mr-2"
                />
                Modo compacto
              </span>
            </div>
            <div>
              Ayuda: Usa el panel izquierdo para generar o refinar contratos
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatInterface;
