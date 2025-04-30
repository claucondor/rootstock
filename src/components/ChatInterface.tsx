import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Loader2,
  Code,
  MessageSquare,
  PanelLeftOpen,
  PanelLeftClose,
  Eye,
  EyeOff,
  Compass,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ContractVisualizer from './ContractVisualizer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import CodeViewer from './CodeViewer';
import useContractStorage from '@/hooks/use-contract-storage';
import GenerationConsole from './GenerationConsole';
import AnimatedCard from './ui/animated-card';

const EXAMPLE_PROMPTS = [
  {
    title: 'ERC20 Token',
    prompt:
      "Create an ERC20 token called 'RootstockToken' with symbol 'RSK' that allows the owner to pause transfers",
  },
  {
    title: 'NFT Collection',
    prompt:
      'Generate a contract for an NFT collection with limited mint of 1000 tokens and whitelist',
  },
  {
    title: 'DeFi Staking',
    prompt:
      'Create a staking contract that allows users to deposit tokens and receive rewards',
  },
];

const DEFAULT_CONTRACT = ``;

// Eliminar ABI y Bytecode por defecto
const DEFAULT_ABI = `[]`;
const DEFAULT_BYTECODE = ``;

// Add the interface for the component props
interface ChatInterfaceProps {
  onLoadingStateChange?: (
    documentationLoading: boolean,
    diagramLoading: boolean
  ) => void;
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
  const [generatedBytecode, setGeneratedBytecode] =
    useState<string>(DEFAULT_BYTECODE);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [apiData, setApiData] = useState<any>(null);
  const { toast, dismiss } = useToast();
  const { saveContract, updateContract } = useContractStorage();
  const [functionExplanations, setFunctionExplanations] = useState<
    Record<string, string>
  >({});
  // New state for documentation and diagram data
  const [documentationData, setDocumentationData] = useState<any>(null);
  const [diagramData, setDiagramData] = useState<any>(null);
  const [contractGenerated, setContractGenerated] = useState<boolean>(false);

  // Simulate progress during generation
  useEffect(() => {
    if (loading) {
      setGenerationProgress(0);
      const interval = setInterval(() => {
        setGenerationProgress((prev) => {
          // Ajustar para aproximadamente 80 segundos totales
          // Incrementos más pequeños para un progreso más realista
          const incremento =
            prev < 50
              ? 1.5 // Primeros 50%: incremento más rápido
              : prev < 80
                ? 0.8 // 50-80%: incremento medio
                : 0.3; // 80-99%: incremento más lento
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
    // Agrega validación antes de enviar la solicitud
    if (!prompt.trim() || loading) {
      if (!prompt.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a prompt to generate the contract.',
          variant: 'destructive',
        });
      }
      return;
    }

    // Verifica si estamos en modo refinamiento y falta el código generado
    if (isRefineMode && !generatedCode) {
      toast({
        title: 'Error',
        description:
          'No generated code to refine. Make sure a contract is selected or generated first.',
        variant: 'destructive',
      });
      setLoading(false); // Asegurarse de desactivar el estado de carga si falla la validación
      return;
    }

    setLoading(true);
    // Reset previous results
    setGeneratedCode(null);
    setGeneratedAbi(DEFAULT_ABI);
    setGeneratedBytecode(DEFAULT_BYTECODE);
    setContractGenerated(false);
    setDocumentationData(null);
    setDiagramData(null);

    let analysisToastId: string | undefined = undefined;
    const generationToast = toast({
      title: isRefineMode ? 'Refining contract...' : 'Generating contract...',
      description: 'Please wait, the AI is working.',
      duration: Infinity, // Keep open until dismissed or updated
    });

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL ||
        'https://solidity-compiler-api-466947410626.us-central1.run.app';
      const endpoint = isRefineMode ? '/refine' : '/generate';
      const payload = isRefineMode
        ? {
            source: generatedCode,
            prompt: prompt,
          }
        : {
            prompt: prompt,
          };

      // --- Añadidos para depuración ---
      console.log('Modo refine:', isRefineMode);
      console.log('URL de la API:', `${apiUrl}${endpoint}`);
      console.log('Payload a enviar:', JSON.stringify(payload, null, 2));
      console.log('Headers:', { 'Content-Type': 'application/json' });
      // --- Fin de añadidos para depuración ---

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            'Error en la generación/refinamiento del contrato'
        );
      }

      const data = await response.json();
      setApiData(data);
      setGeneratedCode(data.sourceCode || data.source);
      setGeneratedAbi(JSON.stringify(data.abi, null, 2));
      setGeneratedBytecode(data.bytecode);
      setContractGenerated(true);

      const contractName =
        extractContractName(data.sourceCode || data.source) ||
        'UnnamedContract';

      // Update toast for successful generation/refinement & start analysis info
      generationToast.update({
        id: generationToast.id,
        title: `Contract ${isRefineMode ? 'refined' : 'generated'}`,
        description: `${contractName} ready! Starting post-generation analysis...`,
        duration: 5000, // Show for 5 seconds then dismiss
      });

      let savedContractId = null;
      if (!isRefineMode) {
        // Save contract and get ID
        const savedContract = await saveContract({
          name: contractName,
          description:
            prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
          sourceCode: data.sourceCode || data.source,
          abi: JSON.stringify(data.abi, null, 2),
          bytecode: data.bytecode,
          analysis: null,
        });
        savedContractId = savedContract.id;
      } else {
        // TODO: Handle getting the ID of the contract being refined
        console.warn(
          'Refinement update logic not fully implemented for storage.'
        );
        // savedContractId = currentlySelectedContractId;
      }

      // --- Analysis Phase ---
      if (savedContractId) {
        analysisToastId = toast({
          title: 'Analyzing contract...',
          description: 'Generating documentation and diagram...',
          duration: Infinity,
        }).id;

        // Fetch documentation and diagram in parallel
        const results = await Promise.allSettled([
          fetchDocumentation(
            data.sourceCode || data.source,
            data.abi,
            savedContractId
          ),
          fetchDiagram(
            data.sourceCode || data.source,
            data.abi,
            savedContractId
          ),
        ]);

        const docResult = results[0];
        const diagramResult = results[1];

        let analysisStatus = 'Analysis Complete';
        let analysisDescription = `Analysis completed for ${contractName}.`;
        let analysisVariant: 'default' | 'destructive' = 'default';
        let combinedAnalysisUpdate: any = {};

        // Process Documentation Result
        if (docResult.status === 'fulfilled' && docResult.value) {
          combinedAnalysisUpdate.functionAnalyses =
            docResult.value.functionAnalyses;
        } else {
          analysisStatus = 'Partial Analysis';
          analysisDescription =
            'Diagram generated but documentation failed.';
          analysisVariant = 'destructive';
          if (docResult.status === 'rejected') {
            console.error('Documentation fetch failed:', docResult.reason);
          } else {
            console.error(
              'Documentation fetch failed with unexpected status:',
              docResult.status
            );
          }
        }

        // Process Diagram Result
        if (diagramResult.status === 'fulfilled' && diagramResult.value) {
          combinedAnalysisUpdate.diagramData = diagramResult.value.diagramData;
        } else {
          if (analysisStatus === 'Análisis Parcial') {
            // Both failed
            analysisStatus = 'Analysis Error';
            analysisDescription =
              'Could not generate documentation or diagram.';
          } else {
            // Only diagram failed (doc succeeded)
            analysisStatus = 'Partial Analysis';
            analysisDescription =
              'Documentation generated but diagram failed.';
            // Update status because doc succeeded but diagram failed
            analysisStatus = 'Análisis Parcial';
          }
          analysisVariant = 'destructive';
          if (diagramResult.status === 'rejected') {
            console.error('Diagram fetch failed:', diagramResult.reason);
          } else {
            console.error(
              'Diagram fetch failed with unexpected status:',
              diagramResult.status
            );
          }
        }

        // Single update call if at least one part succeeded
        if (Object.keys(combinedAnalysisUpdate).length > 0) {
          try {
            console.log(
              'Calling updateContract with combined analysis:',
              combinedAnalysisUpdate
            );
            updateContract(savedContractId, {
              analysis: JSON.stringify(combinedAnalysisUpdate),
            });
          } catch (updateError) {
            console.error(
              'Error updating contract with combined analysis:',
              updateError
            );
            analysisStatus = 'Error Saving Analysis';
            analysisDescription =
              'Analysis completed but there was an error saving it.';
            analysisVariant = 'destructive';
          }
        }

        // Dismiss the persistent analysis toast
        if (analysisToastId) dismiss(analysisToastId);

        // Show final status toast
        toast({
          title: analysisStatus,
          description: analysisDescription,
          variant: analysisVariant,
          duration: 5000,
        });
      } else if (isRefineMode) {
        // Maybe show a different toast for refine mode if needed
        console.log(
          'Analysis not started for refinement due to missing contract ID.'
        );
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ha ocurrido un error inesperado.';
      // Update the generation toast with error
      generationToast.update({
        id: generationToast.id,
        title: 'Generation/Refinement Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 10000, // Keep error longer
      });
      // Ensure analysis toast is dismissed if it was somehow created before error
      if (analysisToastId) dismiss(analysisToastId);
    } finally {
      setLoading(false);
      setGenerationProgress(100);
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
      abi.forEach((item) => {
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
              description =
                'Consulta la cantidad de tokens que un propietario ha aprobado para un gastador';
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
  const fetchDocumentation = async (
    source: string,
    abi: any,
    contractId: string
  ): Promise<{ functionAnalyses: any } | null> => {
    if (!source || !abi || contractId === 'temp-refine-id') {
      console.warn('Skipping documentation fetch for temp ID');
      return Promise.reject('Invalid contract ID for documentation');
    }
    setLoadingDocumentation(true);

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL ||
        'https://solidity-compiler-api-466947410626.us-central1.run.app';
      const response = await fetch(`${apiUrl}/generate/documentation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, abi }),
      });
      if (!response.ok) throw new Error('Error API documentación');
      const data = await response.json();
      setDocumentationData(data);
      if (data.functionAnalyses) {
        console.log('fetchDocumentation successful, returning data:', data);
        // DON'T update contract here, just return the data part
        return { functionAnalyses: data.functionAnalyses };
      } else {
        throw new Error('Respuesta sin análisis de funciones');
      }
    } catch (error) {
      console.error('Error fetchDocumentation:', error);
      throw error; // Re-throw for Promise.allSettled to catch as rejected
    } finally {
      setLoadingDocumentation(false);
    }
  };

  // Nueva función para obtener el diagrama
  const fetchDiagram = async (
    source: string,
    abi: any,
    contractId: string
  ): Promise<{ diagramData: any } | null> => {
    if (!source || !abi || contractId === 'temp-refine-id') {
      console.warn('Skipping diagram fetch for temp ID');
      return Promise.reject('Invalid contract ID for diagram'); // Return rejection
    }
    setLoadingDiagram(true);
    // Remove individual toast here
    // const diagramToast = toast({ ... });

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL ||
        'https://solidity-compiler-api-466947410626.us-central1.run.app';
      // Pass current documentation data if available for better context
      const functionDescriptions =
        documentationData?.functionDescriptions || {};
      const response = await fetch(`${apiUrl}/generate/diagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, abi, functionDescriptions }),
      });
      if (!response.ok) throw new Error('Error API diagrama');
      const data = await response.json();
      setDiagramData(data.diagramData);
      if (data.diagramData) {
        console.log('fetchDiagram successful, returning data:', data);
        // DON'T update contract here, just return the data part
        // No need to format here, let the update logic handle the raw structure
        return { diagramData: data.diagramData };
      } else {
        throw new Error('Respuesta sin datos de diagrama');
      }
    } catch (error) {
      console.error('Error fetchDiagram:', error);
      // diagramToast.update({ ... }); // Remove update
      throw error; // Re-throw for Promise.allSettled to catch as rejected
    } finally {
      setLoadingDiagram(false);
    }
  };

  // Función auxiliar para calcular posiciones de nodos si no vienen definidas
  const calculatePosition = (id: string, totalNodes: number) => {
    // Posiciones por defecto para algunos nodos comunes
    const defaultPositions: Record<string, { x: number; y: number }> = {
      contract: { x: 400, y: 50 },
      ERC20: { x: 200, y: 150 },
      Ownable: { x: 400, y: 150 },
      Pausable: { x: 600, y: 150 },
      constructor: { x: 200, y: 250 },
      transfer: { x: 400, y: 250 },
      pause: { x: 600, y: 250 },
      unpause: { x: 200, y: 350 },
      _beforeTokenTransfer: { x: 400, y: 350 },
      balanceOf: { x: 600, y: 350 },
    };

    if (defaultPositions[id]) {
      return defaultPositions[id];
    }

    // Si no es un nodo conocido, calcular posición en círculo
    const angle =
      (parseInt(id, 36) % totalNodes) * ((2 * Math.PI) / totalNodes);
    const radius = 200;
    return {
      x: 400 + radius * Math.cos(angle),
      y: 250 + radius * Math.sin(angle),
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
                      <h3 className="text-lg font-bold text-white">
                        Smart Contract AI
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={isRefineMode}
                          onCheckedChange={setIsRefineMode}
                        />
                        <span className="text-sm text-gray-300">
                          Refinement
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEditorPanel(false)}
                        className="text-gray-300 hover:text-white transition-colors duration-200"
                      >
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
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    Example Prompts:
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {EXAMPLE_PROMPTS.map((example, index) => (
                      <motion.div
                        key={example.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start h-auto py-2 text-left w-full group"
                          onClick={() => setPrompt(example.prompt)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                          <span className="truncate">{example.title}</span>
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
                      placeholder={
                        isRefineMode
                          ? 'Describe the changes you want to make to the contract...'
                          : 'Describe the smart contract you want to generate...'
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
                          Generating...
                        </>
                      ) : isRefineMode ? (
                        'Refinar Contrato'
                      ) : (
                        'Generar Contrato'
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
                        Contract generation may take up to 90 seconds
                        while the AI creates, compiles and optimizes your contract.
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
                        <h4 className="text-sm font-semibold text-gray-400">
                          Explore Functions
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsExploreMode(false)}
                          className="h-7 w-7 p-0"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(functionExplanations).map(
                          ([name, desc], index) => (
                            <motion.div
                              key={name}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                              className="p-2 bg-gray-800 rounded text-xs"
                            >
                              <div className="font-semibold text-white mb-1">
                                {name}()
                              </div>
                              <div className="text-gray-300">{desc}</div>
                            </motion.div>
                          )
                        )}
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
                Editor Panel
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
                    Contract generation may take up to 90 seconds
                    while the AI creates, compiles and optimizes your contract.
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
                        {contractGenerated
                          ? 'Generated Contract'
                          : 'Code Editor'}
                      </CardTitle>
                      <div>
                        {contractGenerated && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCode(!showCode)}
                            className="h-8 w-8 p-0"
                          >
                            {showCode ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      {contractGenerated
                        ? 'Code view with syntax highlighting'
                        : 'Generate a contract using the left panel'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {!contractGenerated && !loading ? (
                      <div className="flex items-center justify-center h-[300px] bg-gray-800/50 text-gray-400 text-sm">
                        No contract generated. Use the left panel to
                        generate one.
                      </div>
                    ) : (
                      showCode &&
                      generatedCode && (
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
                        <CardTitle className="text-sm font-medium">
                          ABI
                        </CardTitle>
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
                        <CardTitle className="text-sm font-medium">
                          Bytecode
                        </CardTitle>
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
                <AnimatedCard
                  className="border-gray-700 h-full shadow-xl"
                  delay={0.3}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold">
                        Visualization
                      </CardTitle>
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
                      {contractGenerated
                        ? 'Contract visual representation'
                        : 'Will appear when you generate a contract'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!contractGenerated ? (
                      <div className="flex items-center justify-center h-[300px] bg-gray-800/50 text-gray-400 text-sm">
                        Generate a contract to see its visualization
                      </div>
                    ) : (
                      generatedCode && (
                        <div className="h-[400px] lg:h-[600px]">
                          <ContractVisualizer
                            contractData={{
                              sourceCode: generatedCode,
                              analysis: apiData?.analysis
                                ? JSON.stringify(apiData.analysis)
                                : null,
                            }}
                          />
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
            <span>Compact mode</span>
          </div>
          <div>
            Help: Use the left panel to generate or refine contracts
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatInterface;
