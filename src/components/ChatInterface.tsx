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

const DEFAULT_CONTRACT = ``;

// Eliminar ABI y Bytecode por defecto
const DEFAULT_ABI = `[]`;
const DEFAULT_BYTECODE = ``;

// Add the interface for the component props
interface ChatInterfaceProps {
  onLoadingStateChange?: (documentationLoading: boolean, diagramLoading: boolean) => void;
}

const ChatInterface = ({ onLoadingStateChange }: ChatInterfaceProps = {}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDocumentation, setLoadingDocumentation] = useState(false);
  const [loadingDiagram, setLoadingDiagram] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [isRefineMode, setIsRefineMode] = useState(false);
  const [showEditorPanel, setShowEditorPanel] = useState(true);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isExploreMode, setIsExploreMode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedAbi, setGeneratedAbi] = useState<string>(DEFAULT_ABI);
  const [generatedBytecode, setGeneratedBytecode] = useState<string>(DEFAULT_BYTECODE);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [apiData, setApiData] = useState<any>(null);
  const { toast } = useToast();
  const { saveContract, updateContract } = useContractStorage();
  const [functionExplanations, setFunctionExplanations] = useState<Record<string, string>>({});
  // New state for documentation and diagram data
  const [documentationData, setDocumentationData] = useState<any>(null);
  const [diagramData, setDiagramData] = useState<any>(null);
  const [contractGenerated, setContractGenerated] = useState<boolean>(false);

  // Simulate progress during generation
  useEffect(() => {
    if (loading) {
      setGenerationProgress(0);
      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          // Ajustar para aproximadamente 80 segundos totales
          // Incrementos más pequeños para un progreso más realista
          const incremento = prev < 50 ? 1.5 : // Primeros 50%: incremento más rápido
                             prev < 80 ? 0.8 : // 50-80%: incremento medio
                             0.3;              // 80-99%: incremento más lento
          const newProgress = prev + incremento;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 1000); // Actualizar cada segundo
      
      return () => {
        clearInterval(interval);
        setGenerationProgress(100);
      };
    }
  }, [loading]);

  // Add effect to notify parent of loading state changes
  useEffect(() => {
    if (onLoadingStateChange) {
      onLoadingStateChange(loadingDocumentation, loadingDiagram);
    }
  }, [loadingDocumentation, loadingDiagram, onLoadingStateChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    
    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://solidity-compiler-api-466947410626.us-central1.run.app';
      
      // Determinar si estamos generando o refinando
      const endpoint = isRefineMode ? '/refine' : '/generate';
      
      // Preparar el payload según el modo
      const payload = isRefineMode ? {
        source: generatedCode, // El código actual que queremos refinar
        prompt: prompt
      } : {
        prompt: prompt
      };

      console.log(`Llamando a la API: ${apiUrl}${endpoint}`, payload);

      // Configurar un timeout más largo (2 minutos = 120000 ms)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      // Limpiar el timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error en la generación del contrato');
      }

      const data = await response.json();
      console.log("Respuesta de la API recibida:", data);
      
      // Guardar la respuesta completa de la API
      setApiData(data);
      
      // Actualizar el estado con la respuesta de la API
      setGeneratedCode(data.sourceCode || data.source);
      setGeneratedAbi(JSON.stringify(data.abi, null, 2));
      setGeneratedBytecode(data.bytecode);
      setContractGenerated(true);

      // Extraer el nombre del contrato del código fuente
      const contractName = extractContractName(data.sourceCode || data.source) || "UnnamedContract";

      // Generar explicaciones predeterminadas basadas en el ABI
      const newFunctionExplanations = generateFunctionExplanations(data.abi);
      setFunctionExplanations(newFunctionExplanations);

      toast({
        title: `Contrato ${isRefineMode ? 'refinado' : 'generado'} correctamente`,
        description: `El contrato ${contractName} ha sido ${isRefineMode ? 'refinado' : 'creado'} exitosamente.`,
      });
      
      // Si no estamos en modo refinamiento, guardar el nuevo contrato
      if (!isRefineMode) {
        const contractData = {
          name: contractName,
          description: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
          sourceCode: data.sourceCode || data.source,
          abi: JSON.stringify(data.abi, null, 2),
          bytecode: data.bytecode,
          analysis: null // Inicialmente no hay análisis
        };
        
        const savedContract = await saveContract(contractData);
        
        // Ahora obtener documentación y diagrama de forma asíncrona
        fetchDocumentation(data.sourceCode || data.source, data.abi, savedContract.id);
        fetchDiagram(data.sourceCode || data.source, data.abi, savedContract.id);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error en la generación",
        description: error instanceof Error ? error.message : "Ha ocurrido un error al generar el contrato. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function para extraer el nombre del contrato del código fuente
  const extractContractName = (sourceCode: string): string | null => {
    const contractMatch = sourceCode.match(/contract\s+(\w+)/);
    return contractMatch ? contractMatch[1] : null;
  };

  // Helper function para generar explicaciones de funciones basadas en el ABI
  const generateFunctionExplanations = (abi: any[]) => {
    const explanations: Record<string, string> = {};
    
    if (Array.isArray(abi)) {
      abi.forEach(item => {
        if (item.type === 'function') {
          const name = item.name;
          if (name) {
            let description = '';
            
            // Generar una descripción basada en el nombre y tipo de función
            if (name.includes('mint')) {
              description = 'Crea nuevos tokens según parámetros específicos';
            } else if (name.includes('burn')) {
              description = 'Destruye tokens existentes';
            } else if (name.includes('transfer')) {
              description = 'Transfiere tokens entre direcciones';
            } else if (name.includes('approve')) {
              description = 'Aprueba a otra dirección para gastar tokens';
            } else if (name.includes('allowance')) {
              description = 'Consulta la cantidad de tokens que un propietario ha aprobado para un gastador';
            } else if (name.includes('balance')) {
              description = 'Consulta el saldo de tokens de una dirección';
            } else if (name.includes('pause')) {
              description = 'Pausa la funcionalidad del contrato';
            } else if (name.includes('unpause')) {
              description = 'Reanuda la funcionalidad del contrato';
            } else if (name.includes('owner')) {
              description = 'Consulta o modifica el propietario del contrato';
            } else {
              description = `Interactúa con la función ${name}`;
            }
            
            explanations[name] = description;
          }
        }
      });
    }
    
    return explanations;
  };

  // Nueva función para obtener la documentación
  const fetchDocumentation = async (source: string, abi: any, contractId: string) => {
    if (!source || !abi) return;
    
    setLoadingDocumentation(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://solidity-compiler-api-466947410626.us-central1.run.app';
      
      const response = await fetch(`${apiUrl}/generate/documentation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          abi
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al generar la documentación');
      }
      
      const data = await response.json();
      console.log("Documentación recibida:", data);
      
      // Mostrar explícitamente las descripciones de funciones para ayudar en la depuración
      if (data.functionDescriptions) {
        console.log("Descripciones de funciones disponibles:", data.functionDescriptions);
      }
      
      // Actualizar el estado con las descripciones de funciones
      if (data.functionDescriptions) {
        setFunctionExplanations(data.functionDescriptions);
        setDocumentationData(data);
        
        // Actualizar el contrato guardado con los datos de documentación
        const analysisData = {
          ...apiData?.analysis || {},
          functionDescriptions: data.functionDescriptions
        };
        
        console.log("Guardando datos de análisis con descripciones de funciones:", analysisData);
        
        // Actualizar el contrato en el almacenamiento directamente usando el hook importado
        updateContract(contractId, {
          analysis: JSON.stringify(analysisData)
        });
      }
    } catch (error) {
      console.error('Error al obtener documentación:', error);
      toast({
        title: "Advertencia",
        description: "No se pudo generar la documentación completa del contrato.",
        variant: "default"
      });
    } finally {
      setLoadingDocumentation(false);
    }
  };
  
  // Nueva función para obtener el diagrama
  const fetchDiagram = async (source: string, abi: any, contractId: string) => {
    if (!source || !abi) return;
    
    setLoadingDiagram(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://solidity-compiler-api-466947410626.us-central1.run.app';
      
      const response = await fetch(`${apiUrl}/generate/diagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          abi,
          functionDescriptions: functionExplanations
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al generar el diagrama');
      }
      
      const data = await response.json();
      console.log("Diagrama recibido:", data);
      
      // Mostrar explícitamente los datos del diagrama para ayudar en la depuración
      if (data.diagramData) {
        console.log("Datos del diagrama disponibles:", data.diagramData);
      }
      
      // Actualizar el estado con los datos del diagrama
      if (data.diagramData) {
        setDiagramData(data.diagramData);
        
        // Formatear los datos para asegurar que son compatibles con React Flow
        const formattedDiagramData = {
          ...data.diagramData,
          nodes: data.diagramData.nodes.map((node: any) => ({
            ...node,
            // Asegurar que cada nodo tiene una posición
            position: node.position || calculatePosition(node.id, data.diagramData.nodes.length),
            // Asegurar que cada nodo tiene datos
            data: node.data || { label: node.label || node.id || 'Node' }
          })),
          edges: data.diagramData.edges.map((edge: any) => ({
            ...edge,
            id: edge.id || `e-${edge.source}-${edge.target}`,
            animated: edge.animated || false
          }))
        };
        
        console.log("Datos del diagrama formateados:", formattedDiagramData);
        
        // Actualizar el contrato guardado con los datos del diagrama
        const analysisData = {
          ...apiData?.analysis || {},
          diagramData: formattedDiagramData
        };
        
        console.log("Guardando datos de análisis con diagrama:", analysisData);
        
        // Actualizar el contrato en el almacenamiento directamente usando el hook importado
        updateContract(contractId, {
          analysis: JSON.stringify(analysisData)
        });
      }
    } catch (error) {
      console.error('Error al obtener diagrama:', error);
      toast({
        title: "Advertencia",
        description: "No se pudo generar el diagrama del contrato.",
        variant: "default"
      });
    } finally {
      setLoadingDiagram(false);
    }
  };
  
  // Función auxiliar para calcular posiciones de nodos si no vienen definidas
  const calculatePosition = (id: string, totalNodes: number) => {
    // Posiciones por defecto para algunos nodos comunes
    const defaultPositions: Record<string, { x: number, y: number }> = {
      'contract': { x: 400, y: 50 },
      'ERC20': { x: 200, y: 150 },
      'Ownable': { x: 400, y: 150 },
      'Pausable': { x: 600, y: 150 },
      'constructor': { x: 200, y: 250 },
      'transfer': { x: 400, y: 250 },
      'pause': { x: 600, y: 250 },
      'unpause': { x: 200, y: 350 },
      '_beforeTokenTransfer': { x: 400, y: 350 },
      'balanceOf': { x: 600, y: 350 }
    };
    
    if (defaultPositions[id]) {
      return defaultPositions[id];
    }
    
    // Si no es un nodo conocido, calcular posición en círculo
    const angle = (parseInt(id, 36) % totalNodes) * (2 * Math.PI / totalNodes);
    const radius = 200;
    return {
      x: 400 + radius * Math.cos(angle),
      y: 250 + radius * Math.sin(angle)
    };
  };

  return (
    <div className="relative bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700 rounded-lg overflow-hidden h-screen flex flex-col">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0">
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
                    <div className="mb-2 px-3 py-1 bg-blue-900/30 border border-blue-700/30 rounded-md">
                      <p className="text-xs text-blue-300">
                        La generación de contratos puede tomar hasta 90 segundos mientras la IA crea, compila y optimiza tu contrato.
                      </p>
                    </div>
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
            {loading && (
              <AnimatedCard 
                className="mb-4 w-full mx-auto lg:max-w-3xl" 
                delay={0.2}
                hoverEffect={false}
              >
                <div className="mb-2 px-3 py-1 bg-blue-900/30 border border-blue-700/30 rounded-md">
                  <p className="text-xs text-blue-300">
                    La generación de contratos puede tomar hasta 90 segundos mientras la IA crea, compila y optimiza tu contrato.
                  </p>
                </div>
                <GenerationConsole 
                  isGenerating={loading} 
                  progress={generationProgress} 
                />
              </AnimatedCard>
            )}

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              <div className="lg:flex-1 order-2 lg:order-1 space-y-4">
                <AnimatedCard className="border-gray-700 shadow-xl">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold flex items-center">
                        <Code className="h-5 w-5 mr-2 text-blue-400" />
                        {contractGenerated ? "Contrato Generado" : "Editor de Código"}
                      </CardTitle>
                      <div>
                        {contractGenerated && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowCode(!showCode)} 
                            className="h-8 w-8 p-0"
                          >
                            {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      {contractGenerated ? "Vista del código con sintaxis resaltada" : "Genera un contrato usando el panel izquierdo"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {!contractGenerated && !loading ? (
                      <div className="flex items-center justify-center h-[300px] bg-gray-800/50 text-gray-400 text-sm">
                        No hay contrato generado. Usa el panel izquierdo para generar uno.
                      </div>
                    ) : (
                      showCode && generatedCode && (
                        <CodeViewer 
                          code={generatedCode} 
                          language="solidity" 
                          maxHeight="600px"
                        />
                      )
                    )}
                  </CardContent>
                </AnimatedCard>

                {contractGenerated && (
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
                )}
              </div>
              
              <div className="lg:w-1/3 order-1 lg:order-2">
                <AnimatedCard className="border-gray-700 h-full shadow-xl" delay={0.3}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold">Visualización</CardTitle>
                      <div>
                        {contractGenerated && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIsExploreMode(!isExploreMode)}
                            className="h-8 px-2"
                          >
                            <Compass className="h-4 w-4 mr-1" />
                            <span className="text-xs">Explorar</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      {contractGenerated ? "Representación visual del contrato" : "Se mostrará cuando generes un contrato"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!contractGenerated ? (
                      <div className="flex items-center justify-center h-[300px] bg-gray-800/50 text-gray-400 text-sm">
                        Genera un contrato para ver su visualización
                      </div>
                    ) : (
                      generatedCode && (
                        <div className="h-[400px] lg:h-[600px]">
                          <ContractVisualizer contractData={{ 
                            sourceCode: generatedCode,
                            analysis: apiData?.analysis ? JSON.stringify(apiData.analysis) : null 
                          }} />
                        </div>
                      )
                    )}
                  </CardContent>
                </AnimatedCard>
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full p-4 bg-gray-800/70 backdrop-blur-sm border-t border-gray-700 text-sm text-gray-400"
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={isCompactMode} 
              onCheckedChange={setIsCompactMode} 
            />
            <span>Modo compacto</span>
          </div>
          <div>
            Ayuda: Usa el panel izquierdo para generar o refinar contratos
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatInterface;