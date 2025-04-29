import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Contract } from '@/hooks/use-contract-storage';
import { Search, BookOpen, Code, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CodeViewer from './CodeViewer';

interface FunctionDetails {
  name: string;
  type: string;
  description: string;
  inputs: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  outputs: Array<{
    type: string;
    description: string;
  }>;
  access: 'public' | 'private' | 'external' | 'internal' | 'onlyOwner';
  stateMutability: string;
  source: string;
  security: Array<{
    type: 'warning' | 'info' | 'error';
    message: string;
  }>;
  example: string;
}

interface FunctionDocumentationProps {
  contract: Contract | null;
  className?: string;
  isLoading?: boolean;
}

const FunctionDocumentation = ({ contract, className = '', isLoading = false }: FunctionDocumentationProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [functions, setFunctions] = useState<FunctionDetails[]>([]);
  
  useEffect(() => {
    // Cuando el contrato cambia, procesamos la documentación de las funciones
    if (contract && contract.analysis) {
      try {
        console.log("Procesando análisis del contrato para documentación:", contract.analysis);
        const analysisData = JSON.parse(contract.analysis);
        
        if (analysisData.functionDescriptions) {
          // Generate function details from the API-provided documentation
          try {
            const abiItems = JSON.parse(contract.abi || '[]');
            const processFunctions = abiItems
              .filter((item: any) => item.type === 'function' && item.name)
              .map((item: any) => {
                const name = item.name;
                return {
                  name,
                  type: item.type,
                  description: analysisData.functionDescriptions[name] || `Función ${name}`,
                  inputs: (item.inputs || []).map((input: any) => ({
                    name: input.name || '',
                    type: input.type || 'unknown',
                    description: input.description || `Parámetro ${input.name || ''}`
                  })),
                  outputs: (item.outputs || []).map((output: any) => ({
                    type: output.type || 'unknown',
                    description: output.description || 'Valor de retorno'
                  })),
                  access: item.stateMutability === 'view' || item.stateMutability === 'pure' 
                    ? 'public' 
                    : item.name.includes('owner') ? 'onlyOwner' : 'public',
                  stateMutability: item.stateMutability || 'nonpayable',
                  source: '', // No tenemos el código fuente exacto de cada función
                  security: [],
                  example: ''
                };
              });
              
            console.log("Funciones procesadas:", processFunctions);
            if (processFunctions.length > 0) {
              setFunctions(processFunctions);
              // Seleccionar la primera función por defecto si no hay ninguna seleccionada
              if (!selectedFunction) {
                setSelectedFunction(processFunctions[0].name);
              }
              return;
            }
          } catch (error) {
            console.error("Error al procesar el ABI:", error);
            // Seguimos con el mock como fallback
          }
        } else {
          // También buscamos en otros lugares posibles donde podrían estar las descripciones de funciones
          // Por ejemplo, como se ve en la consola, podría estar directamente en el primer nivel
          const functionDescriptions = analysisData.functionDescriptions || {};
          
          if (Object.keys(functionDescriptions).length > 0) {
            try {
              const abiItems = JSON.parse(contract.abi || '[]');
              const processFunctions = abiItems
                .filter((item: any) => item.type === 'function' && item.name)
                .map((item: any) => {
                  const name = item.name;
                  return {
                    name,
                    type: item.type,
                    description: functionDescriptions[name] || `Función ${name}`,
                    inputs: (item.inputs || []).map((input: any) => ({
                      name: input.name || '',
                      type: input.type || 'unknown',
                      description: input.description || `Parámetro ${input.name || ''}`
                    })),
                    outputs: (item.outputs || []).map((output: any) => ({
                      type: output.type || 'unknown',
                      description: output.description || 'Valor de retorno'
                    })),
                    access: item.stateMutability === 'view' || item.stateMutability === 'pure' 
                      ? 'public' 
                      : item.name.includes('owner') ? 'onlyOwner' : 'public',
                    stateMutability: item.stateMutability || 'nonpayable',
                    source: '',
                    security: [],
                    example: ''
                  };
                });
                
              console.log("Funciones procesadas desde functionDescriptions:", processFunctions);
              if (processFunctions.length > 0) {
                setFunctions(processFunctions);
                if (!selectedFunction) {
                  setSelectedFunction(processFunctions[0].name);
                }
                return;
              }
            } catch (error) {
              console.error("Error al procesar el ABI con functionDescriptions:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error al procesar el análisis del contrato:", error);
        // Seguimos con el mock como fallback
      }
    }
    
    // Si llegamos aquí, significa que no pudimos procesar el análisis o no hay datos de análisis
    setFunctions(mockFunctions);
    if (!selectedFunction && mockFunctions.length > 0) {
      setSelectedFunction(mockFunctions[0].name);
    }
  }, [contract, selectedFunction]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">Generando documentación...</h3>
        <p className="text-gray-400">Analizando el contrato para crear documentación detallada de sus funciones.</p>
      </div>
    );
  }
  
  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Selecciona un contrato para ver la documentación de sus funciones</p>
      </div>
    );
  }
  
  // Filtrar funciones por búsqueda
  const filteredFunctions = functions.filter(
    func => func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            func.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Obtener los detalles de la función seleccionada
  const selectedFunctionData = functions.find(func => func.name === selectedFunction) || null;
  
  // Renderizar etiqueta de acceso
  const getAccessBadge = (access: string) => {
    switch (access) {
      case 'public':
        return <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10">Public</Badge>;
      case 'private':
        return <Badge variant="outline" className="border-red-500 text-red-500 bg-red-500/10">Private</Badge>;
      case 'external':
        return <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-500/10">External</Badge>;
      case 'internal':
        return <Badge variant="outline" className="border-purple-500 text-purple-500 bg-purple-500/10">Internal</Badge>;
      case 'onlyOwner':
        return <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/10">Only Owner</Badge>;
      default:
        return <Badge variant="outline">{access}</Badge>;
    }
  };
  
  // Renderizar etiqueta de seguridad
  const getSecurityBadge = (type: 'warning' | 'info' | 'error') => {
    switch (type) {
      case 'warning':
        return <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/10">Advertencia</Badge>;
      case 'info':
        return <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-500/10">Información</Badge>;
      case 'error':
        return <Badge variant="outline" className="border-red-500 text-red-500 bg-red-500/10">Error</Badge>;
      default:
        return null;
    }
  };
  
  // Obtener icono para la función según su tipo
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

  return (
    <div className={`grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 ${className}`}>
      {/* Lista de funciones */}
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
              filteredFunctions.map((func) => (
                <button
                  key={func.name}
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
                        <Badge variant="outline" className="border-gray-600 text-gray-400 bg-gray-700/50">
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
      
      {/* Detalles de la función */}
      <div>
        {selectedFunctionData ? (
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="flex items-center space-x-3">
                {getFunctionIcon(selectedFunctionData)}
                <span>{selectedFunctionData.name}</span>
              </CardTitle>
              <CardDescription>{selectedFunctionData.description}</CardDescription>
              <div className="flex items-center flex-wrap gap-2 mt-3">
                {getAccessBadge(selectedFunctionData.access)}
                {selectedFunctionData.stateMutability && (
                  <Badge variant="outline" className="border-gray-600 text-gray-400 bg-gray-700/50">
                    {selectedFunctionData.stateMutability}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="params">
                <TabsList className="w-full bg-gray-900 rounded-none h-auto p-0 border-b border-gray-700">
                  <TabsTrigger value="params" className="flex-1 rounded-none py-3 data-[state=active]:bg-gray-800">
                    Parámetros
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex-1 rounded-none py-3 data-[state=active]:bg-gray-800">
                    Código
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex-1 rounded-none py-3 data-[state=active]:bg-gray-800">
                    Seguridad
                  </TabsTrigger>
                  <TabsTrigger value="example" className="flex-1 rounded-none py-3 data-[state=active]:bg-gray-800">
                    Ejemplo
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="params" className="p-4">
                  <div className="space-y-4">
                    {selectedFunctionData.inputs.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">Entradas</h3>
                        <div className="space-y-2">
                          {selectedFunctionData.inputs.map((input, index) => (
                            <div key={index} className="bg-gray-900 p-3 rounded-md">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-500/10">
                                  {input.type}
                                </Badge>
                                <span className="font-medium text-white">{input.name}</span>
                              </div>
                              <p className="mt-1 text-sm text-gray-400">{input.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedFunctionData.outputs.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">Salidas</h3>
                        <div className="space-y-2">
                          {selectedFunctionData.outputs.map((output, index) => (
                            <div key={index} className="bg-gray-900 p-3 rounded-md">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10">
                                  {output.type}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-gray-400">{output.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedFunctionData.inputs.length === 0 && selectedFunctionData.outputs.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <p>Esta función no tiene parámetros ni valores de retorno</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="code" className="border-t border-gray-700">
                  <CodeViewer code={selectedFunctionData.source} language="solidity" />
                </TabsContent>
                
                <TabsContent value="example" className="border-t border-gray-700">
                  <CodeViewer code={selectedFunctionData.example} language="javascript" title="Ejemplo de uso" />
                </TabsContent>
                
                <TabsContent value="security" className="p-4">
                  {selectedFunctionData.security.length > 0 ? (
                    <div className="space-y-3">
                      {selectedFunctionData.security.map((item, index) => (
                        <div key={index} className={`p-3 rounded-md ${
                          item.type === 'warning' ? 'bg-amber-900/20 border border-amber-800' :
                          item.type === 'error' ? 'bg-red-900/20 border border-red-800' :
                          'bg-blue-900/20 border border-blue-800'
                        }`}>
                          <div className="flex items-start gap-3">
                            {item.type === 'warning' ? (
                              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            ) : item.type === 'error' ? (
                              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="mb-1">{getSecurityBadge(item.type)}</div>
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
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Selecciona una función para ver sus detalles</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Datos de ejemplo para mostrar cuando no hay análisis del contrato
const mockFunctions: FunctionDetails[] = [
  {
    name: 'transfer',
    type: 'function',
    description: 'Transfiere tokens del remitente al destinatario especificado. Esta función implementa el estándar ERC20 para transferencia de tokens y emite un evento Transfer cuando se realiza correctamente.',
    inputs: [
      {
        name: 'to',
        type: 'address',
        description: 'Dirección del destinatario que recibirá los tokens'
      },
      {
        name: 'amount',
        type: 'uint256',
        description: 'Cantidad de tokens a transferir (en unidades completas)'
      }
    ],
    outputs: [
      {
        type: 'bool',
        description: 'True si la transferencia se completó correctamente'
      }
    ],
    access: 'public',
    stateMutability: 'nonpayable',
    source: `function transfer(address to, uint256 amount) public virtual override returns (bool) {
  require(to != address(0), "ERC20: transfer to the zero address");
  require(!paused(), "ERC20: token transfer while paused");
  
  _transfer(_msgSender(), to, amount);
  return true;
}`,
    security: [
      {
        type: 'warning',
        message: 'Asegúrate de no transferir a la dirección cero (0x0)'
      },
      {
        type: 'info',
        message: 'Esta función fallará si el contrato está pausado'
      }
    ],
    example: `// Ejemplo de uso con web3.js
const contractInstance = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

// Transferir 100 tokens a otra dirección
const recipient = "0x1234...";
const amount = web3.utils.toWei("100", "ether"); // 100 tokens con 18 decimales

contractInstance.methods.transfer(recipient, amount)
  .send({ from: myWalletAddress })
  .then(receipt => {
    console.log("Transferencia exitosa:", receipt);
  })
  .catch(error => {
    console.error("Error en la transferencia:", error);
  });`
  },
  {
    name: 'balanceOf',
    type: 'function',
    description: 'Devuelve el saldo de tokens que posee una dirección específica. Esta función es parte del estándar ERC20 y permite consultar saldos sin modificar el estado.',
    inputs: [
      {
        name: 'account',
        type: 'address',
        description: 'Dirección de la cuenta para consultar el saldo'
      }
    ],
    outputs: [
      {
        type: 'uint256',
        description: 'Saldo de tokens de la cuenta (en unidades base con decimales)'
      }
    ],
    access: 'public',
    stateMutability: 'view',
    source: `function balanceOf(address account) public view virtual override returns (uint256) {
  return _balances[account];
}`,
    security: [],
    example: `// Ejemplo de uso con ethers.js
const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// Consultar el saldo de una dirección
const address = "0x1234...";

const balance = await contractInstance.balanceOf(address);
console.log("Saldo:", ethers.utils.formatUnits(balance, 18)); // Formatear a unidades legibles`
  },
  {
    name: 'mint',
    type: 'function',
    description: 'Crea nuevos tokens y los asigna a la dirección especificada. Esta función solo puede ser llamada por el propietario del contrato y aumenta el suministro total de tokens.',
    inputs: [
      {
        name: 'to',
        type: 'address',
        description: 'Dirección que recibirá los tokens recién creados'
      },
      {
        name: 'amount',
        type: 'uint256',
        description: 'Cantidad de tokens a crear (en unidades completas)'
      }
    ],
    outputs: [],
    access: 'onlyOwner',
    stateMutability: 'nonpayable',
    source: `function mint(address to, uint256 amount) public onlyOwner {
  _mint(to, amount);
}`,
    security: [
      {
        type: 'warning',
        message: 'Acuñar una gran cantidad de tokens puede causar inflación y diluir el valor del token'
      },
      {
        type: 'error',
        message: 'Esta función fallará si es llamada por una cuenta que no sea el propietario'
      }
    ],
    example: `// Ejemplo de uso con web3.js (desde la cuenta del propietario)
const contractInstance = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

// Acuñar 1000 tokens para una dirección
const recipient = "0x1234...";
const amount = web3.utils.toWei("1000", "ether"); // 1000 tokens con 18 decimales

contractInstance.methods.mint(recipient, amount)
  .send({ from: ownerWalletAddress })
  .then(receipt => {
    console.log("Tokens acuñados correctamente:", receipt);
  })
  .catch(error => {
    console.error("Error al acuñar tokens:", error);
  });`
  },
  {
    name: 'pause',
    type: 'function',
    description: 'Pausa todas las transferencias de tokens en el contrato. Esto es útil en situaciones de emergencia o cuando se detecta un comportamiento sospechoso en el contrato.',
    inputs: [],
    outputs: [],
    access: 'onlyOwner',
    stateMutability: 'nonpayable',
    source: `function pause() public onlyOwner {
  _pause();
}`,
    security: [
      {
        type: 'info',
        message: 'Pausa temporalmente todas las transferencias hasta que se llame a unpause()'
      }
    ],
    example: `// Ejemplo de uso con ethers.js (desde la cuenta del propietario)
const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

// Pausar el contrato
await contractInstance.pause()
  .then(tx => tx.wait())
  .then(() => {
    console.log("Contrato pausado correctamente");
  })
  .catch(error => {
    console.error("Error al pausar el contrato:", error);
  });`
  }
];

export default FunctionDocumentation; 