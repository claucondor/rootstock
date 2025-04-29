import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Contract } from '@/hooks/use-contract-storage';
import {
  Search,
  BookOpen,
  Code,
  FileText,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CodeViewer from './CodeViewer';

// Interface defining the structure expected for each function's details in the UI state
interface FunctionDetails {
  name: string;
  type: string;
  description: string;
  inputs: Array<{ name: string; type: string; description: string }>;
  outputs: Array<{ type: string; description: string }>;
  access: 'public' | 'private' | 'external' | 'internal' | 'onlyOwner';
  stateMutability: string;
  source: string; // Now populated from analysis
  security: Array<{ type: 'warning' | 'info' | 'error'; message: string }>; // Now populated from analysis
  example: string; // Now populated from analysis
}

// Interface defining the structure expected within the analysis data from the backend
interface AnalyzedFunctionDetails {
  description: string;
  source?: string;
  example?: string;
  security?: Array<{ type: 'warning' | 'info' | 'error'; message: string }>;
}

interface FunctionAnalyses {
  [functionName: string]: AnalyzedFunctionDetails;
  error?: any; // To detect analysis errors
}

interface FunctionDocumentationProps {
  contract: Contract | null;
  className?: string;
  isLoading?: boolean;
  analysisData?: {
    // Expecting the full analysis object now
    functionAnalyses?: FunctionAnalyses;
    diagramData?: any; // Keep diagram data if present
    // ... potentially other analysis parts
  } | null;
}

const FunctionDocumentation = ({
  contract,
  className = '',
  isLoading = false,
  analysisData,
}: FunctionDocumentationProps) => {
  console.log('--- FunctionDocumentation Component Rendering --- '); // Log: Component render start

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [functions, setFunctions] = useState<FunctionDetails[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[FunctionDocumentation useEffect] Running...'); // Log: useEffect triggered
    console.log(
      '[FunctionDocumentation useEffect] Received contract:',
      contract ? contract.id : null
    );
    console.log(
      '[FunctionDocumentation useEffect] Received analysisData prop:',
      analysisData
    ); // Log: Prop recibido

    setFunctions([]);
    setAnalysisError(null);
    setSelectedFunction(null);

    const functionAnalyses = analysisData?.functionAnalyses;
    console.log(
      '[FunctionDocumentation useEffect] Extracted functionAnalyses:',
      functionAnalyses
    ); // Log: functionAnalyses extraído

    // Condición principal para procesar
    const canProcess =
      contract && contract.abi && functionAnalyses && !functionAnalyses.error;
    console.log(
      '[FunctionDocumentation useEffect] Can process data?',
      canProcess
    ); // Log: Resultado de la condición

    if (canProcess) {
      console.log('Processing contract analysis for documentation...');
      try {
        console.log(
          '[FunctionDocumentation useEffect] Attempting to parse ABI...'
        );
        const abiItems = JSON.parse(contract.abi);
        console.log(
          '[FunctionDocumentation useEffect] ABI parsed successfully. Mapping functions...'
        );

        const processedFunctions = abiItems
          .filter((item: any) => item.type === 'function' && item.name)
          .map((item: any): FunctionDetails => {
            const name = item.name;
            const analysis: AnalyzedFunctionDetails | undefined =
              functionAnalyses[name];

            return {
              name,
              type: item.type,
              description:
                analysis?.description ||
                `No description available for ${name}.`,
              inputs: (item.inputs || []).map((input: any) => ({
                name: input.name || '',
                type: input.type || 'unknown',
                description: `Parameter ${input.name || ''} of type ${input.type || 'unknown'}`, // Simple description from ABI
              })),
              outputs: (item.outputs || []).map((output: any) => ({
                type: output.type || 'unknown',
                description: `Returns ${output.type || 'unknown'}`, // Simple description from ABI
              })),
              access:
                item.stateMutability === 'view' ||
                item.stateMutability === 'pure'
                  ? 'public'
                  : item.name.includes('owner')
                    ? 'onlyOwner'
                    : 'public', // Basic inference
              stateMutability: item.stateMutability || 'nonpayable',
              // Populate from analysis, provide fallbacks
              source: analysis?.source || '// Source code not available.',
              security: analysis?.security || [],
              example: analysis?.example || '// Example not available.',
            };
          });

        console.log(
          '[FunctionDocumentation useEffect] Processed functions array:',
          processedFunctions
        ); // Log: Resultado del mapeo

        if (processedFunctions.length > 0) {
          setFunctions(processedFunctions);
          if (
            !selectedFunction ||
            !processedFunctions.some((f) => f.name === selectedFunction)
          ) {
            setSelectedFunction(processedFunctions[0].name);
            console.log(
              '[FunctionDocumentation useEffect] Set selected function to:',
              processedFunctions[0].name
            );
          }
        } else {
          console.log(
            '[FunctionDocumentation useEffect] No functions found in ABI after processing.'
          );
          setAnalysisError('No functions found in the contract ABI.');
        }
      } catch (error) {
        console.error(
          '[FunctionDocumentation useEffect] Error processing ABI or function analyses:',
          error
        );
        setAnalysisError('Failed to process contract data.');
      }
    } else if (functionAnalyses?.error) {
      console.warn(
        '[FunctionDocumentation useEffect] Analysis data contains error marker.'
      );
      setAnalysisError('Analysis failed or returned an error.');
    } else if (contract && !isLoading) {
      console.warn(
        '[FunctionDocumentation useEffect] Contract present, not loading, but missing valid functionAnalyses.'
      );
      // Log why canProcess failed
      if (!contract) console.warn('- Reason: Contract is null');
      if (!contract?.abi) console.warn('- Reason: Contract ABI is missing');
      if (!functionAnalyses)
        console.warn(
          '- Reason: functionAnalyses is missing/nullish in analysisData'
        );
      if (functionAnalyses?.error)
        console.warn('- Reason: functionAnalyses has error marker');

      setAnalysisError(
        'Function analysis data is not available for this contract.'
      );
    }
  }, [contract, analysisData, isLoading]);

  // --- Rest of the component remains the same (Loading state, No contract state, Rendering logic) ---
  // --- It will now use the `functions` state populated with real or fallback data ---

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">
          Loading Analysis...
        </h3>
        <p className="text-gray-400">Fetching detailed function information.</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">
          Select a contract to view function documentation.
        </p>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="text-center py-12 px-6">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
        <p className="text-amber-400 font-semibold">
          Could not load function details
        </p>
        <p className="text-gray-400 mt-1 text-sm">{analysisError}</p>
      </div>
    );
  }

  if (functions.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No functions available to display.</p>
      </div>
    );
  }

  // Filtering logic remains the same
  const filteredFunctions = functions.filter(
    (func) =>
      func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Finding selected function data remains the same
  const selectedFunctionData =
    functions.find((func) => func.name === selectedFunction) ||
    (filteredFunctions.length > 0 ? filteredFunctions[0] : null);

  // Badge and Icon helpers remain the same
  const getAccessBadge = (access: string) => {
    switch (access) {
      case 'public':
        return (
          <Badge
            variant="outline"
            className="border-green-500 text-green-500 bg-green-500/10"
          >
            Public
          </Badge>
        );
      case 'private':
        return (
          <Badge
            variant="outline"
            className="border-red-500 text-red-500 bg-red-500/10"
          >
            Private
          </Badge>
        );
      case 'external':
        return (
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-500 bg-blue-500/10"
          >
            External
          </Badge>
        );
      case 'internal':
        return (
          <Badge
            variant="outline"
            className="border-purple-500 text-purple-500 bg-purple-500/10"
          >
            Internal
          </Badge>
        );
      case 'onlyOwner':
        return (
          <Badge
            variant="outline"
            className="border-amber-500 text-amber-500 bg-amber-500/10"
          >
            Only Owner
          </Badge>
        );
      default:
        return <Badge variant="outline">{access}</Badge>;
    }
  };

  const getSecurityBadge = (type: 'warning' | 'info' | 'error') => {
    switch (type) {
      case 'warning':
        return (
          <Badge
            variant="outline"
            className="border-amber-500 text-amber-500 bg-amber-500/10"
          >
            Advertencia
          </Badge>
        );
      case 'info':
        return (
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-500 bg-blue-500/10"
          >
            Información
          </Badge>
        );
      case 'error':
        return (
          <Badge
            variant="outline"
            className="border-red-500 text-red-500 bg-red-500/10"
          >
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const getFunctionIcon = (func: FunctionDetails) => {
    if (func.stateMutability === 'view' || func.stateMutability === 'pure') {
      return <BookOpen className="h-4 w-4 text-blue-400" />;
    } else if (func.name.startsWith('set') || func.name.startsWith('update')) {
      return <FileText className="h-4 w-4 text-amber-400" />;
    } else if (func.name.startsWith('mint') || func.name.includes('create')) {
      return <Code className="h-4 w-4 text-green-400" />;
    } else {
      return <Code className="h-4 w-4 text-gray-400" />;
    }
  };

  // --- JSX Rendering Structure remains the same ---
  // It will use selectedFunctionData which now contains real or fallback source/example/security
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 ${className}`}
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar función..."
            className="bg-gray-800 border-gray-700 pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-1 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            {filteredFunctions.length > 0 ? (
              filteredFunctions.map((func, index) => (
                <button
                  key={`${func.name}-${index}`}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-3 ${
                    selectedFunction === func.name
                      ? 'bg-blue-900/40 text-blue-100'
                      : 'hover:bg-gray-700/50 text-gray-300'
                  }`}
                  onClick={() => setSelectedFunction(func.name)}
                >
                  {getFunctionIcon(func)}
                  <div className="flex-1 truncate">
                    <span className="font-medium">{func.name}</span>
                    <div className="flex items-center space-x-2 mt-1">
                      {getAccessBadge(func.access)}
                      {func.stateMutability && (
                        <Badge
                          variant="outline"
                          className="border-gray-600 text-gray-400 bg-gray-700/50"
                        >
                          {func.stateMutability}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No se encontraron funciones</p>
                {searchTerm && (
                  <p className="text-sm mt-1">
                    Intenta con otro término de búsqueda
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        {selectedFunctionData ? (
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="flex items-center space-x-3">
                {getFunctionIcon(selectedFunctionData)}
                <span>{selectedFunctionData.name}</span>
              </CardTitle>
              <CardDescription>
                {selectedFunctionData.description}
              </CardDescription>
              <div className="flex items-center flex-wrap gap-2 mt-3">
                {getAccessBadge(selectedFunctionData.access)}
                {selectedFunctionData.stateMutability && (
                  <Badge
                    variant="outline"
                    className="border-gray-600 text-gray-400 bg-gray-700/50"
                  >
                    {selectedFunctionData.stateMutability}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="params">
                <TabsList className="w-full bg-gray-900 rounded-none h-auto p-0 border-b border-gray-700">
                  <TabsTrigger
                    value="params"
                    className="flex-1 rounded-none py-3 data-[state=active]:bg-gray-800"
                  >
                    Parámetros
                  </TabsTrigger>
                  <TabsTrigger
                    value="code"
                    className="flex-1 rounded-none py-3 data-[state=active]:bg-gray-800"
                  >
                    Código
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="flex-1 rounded-none py-3 data-[state=active]:bg-gray-800"
                  >
                    Seguridad
                  </TabsTrigger>
                  <TabsTrigger
                    value="example"
                    className="flex-1 rounded-none py-3 data-[state=active]:bg-gray-800"
                  >
                    Ejemplo
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="params" className="p-4">
                  <div className="space-y-4">
                    {selectedFunctionData.inputs.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">
                          Entradas
                        </h3>
                        <div className="space-y-2">
                          {selectedFunctionData.inputs.map((input, index) => (
                            <div
                              key={index}
                              className="bg-gray-900 p-3 rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="border-blue-500 text-blue-500 bg-blue-500/10"
                                >
                                  {input.type}
                                </Badge>
                                <span className="font-medium text-white">
                                  {input.name}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-400">
                                {input.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedFunctionData.outputs.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">
                          Salidas
                        </h3>
                        <div className="space-y-2">
                          {selectedFunctionData.outputs.map((output, index) => (
                            <div
                              key={index}
                              className="bg-gray-900 p-3 rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="border-green-500 text-green-500 bg-green-500/10"
                                >
                                  {output.type}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-gray-400">
                                {output.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedFunctionData.inputs.length === 0 &&
                      selectedFunctionData.outputs.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <p>
                            Esta función no tiene parámetros ni valores de
                            retorno
                          </p>
                        </div>
                      )}
                  </div>
                </TabsContent>

                <TabsContent value="code" className="p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">
                    Código Fuente
                  </h4>
                  <div className="bg-gray-950 border border-gray-700 rounded-md overflow-hidden">
                    <CodeViewer
                      code={selectedFunctionData.source}
                      language="solidity"
                      title="Fuente"
                      showLineNumbers={true}
                      wrapLines={true}
                      maxHeight="400px"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="example" className="p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">
                    Ejemplo de Uso
                  </h4>
                  <div className="bg-gray-950 border border-gray-700 rounded-md overflow-hidden">
                    <CodeViewer
                      code={selectedFunctionData.example}
                      language="javascript"
                      title="Ejemplo"
                      showLineNumbers={true}
                      wrapLines={true}
                      maxHeight="400px"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="security" className="p-4">
                  {selectedFunctionData.security.length > 0 ? (
                    <div className="space-y-3">
                      {selectedFunctionData.security.map((item, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-md ${
                            item.type === 'warning'
                              ? 'bg-amber-900/20 border border-amber-800'
                              : item.type === 'error'
                                ? 'bg-red-900/20 border border-red-800'
                                : 'bg-blue-900/20 border border-blue-800'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {item.type === 'warning' ? (
                              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            ) : item.type === 'error' ? (
                              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="mb-1">
                                {getSecurityBadge(item.type)}
                              </div>
                              <p className="text-gray-300">{item.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No hay información de seguridad para esta función</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : filteredFunctions.length > 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Selecciona una función para ver sus detalles</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FunctionDocumentation;
