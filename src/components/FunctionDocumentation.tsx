import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Contract } from '@/hooks/use-contract-storage';
import { Search, BookOpen, Code, FileText, AlertTriangle } from 'lucide-react';
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
}

const FunctionDocumentation = ({ contract, className = '' }: FunctionDocumentationProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  
  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Selecciona un contrato para ver la documentación de sus funciones</p>
      </div>
    );
  }
  
  // Mock de funciones - En una implementación real, esto vendría de un análisis
  // del código del contrato o de la API
  const functions: FunctionDetails[] = [
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
        },
        {
          type: 'warning',
          message: 'El uso frecuente de esta función puede afectar la confianza de los usuarios en el token'
        }
      ],
      example: `// Ejemplo de uso con ethers.js (desde la cuenta del propietario)
const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

// Pausar el contrato
await contractInstance.pause();
console.log("Contrato pausado correctamente");`
    },
    {
      name: 'unpause',
      type: 'function',
      description: 'Reanuda las transferencias de tokens en el contrato después de que hayan sido pausadas. Revierte el estado del contrato a su funcionamiento normal.',
      inputs: [],
      outputs: [],
      access: 'onlyOwner',
      stateMutability: 'nonpayable',
      source: `function unpause() public onlyOwner {
    _unpause();
}`,
      security: [
        {
          type: 'info',
          message: 'Reanuda las transferencias de tokens después de haber sido pausadas'
        }
      ],
      example: `// Ejemplo de uso con ethers.js (desde la cuenta del propietario)
const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

// Reanudar el contrato
await contractInstance.unpause();
console.log("Contrato reanudado correctamente");`
    }
  ];
  
  // Filtrar funciones basadas en el término de búsqueda
  const filteredFunctions = functions.filter(func => 
    func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    func.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Obtener la función seleccionada
  const getSelectedFunction = (): FunctionDetails | null => {
    if (!selectedFunction) {
      return filteredFunctions.length > 0 ? filteredFunctions[0] : null;
    }
    return filteredFunctions.find(f => f.name === selectedFunction) || null;
  };
  
  const currentFunction = getSelectedFunction();
  
  // Formatear el tipo de acceso
  const getAccessBadge = (access: string) => {
    let color = '';
    switch (access) {
      case 'public':
        color = 'bg-green-600';
        break;
      case 'private':
        color = 'bg-red-600';
        break;
      case 'external':
        color = 'bg-blue-600';
        break;
      case 'internal':
        color = 'bg-yellow-600';
        break;
      case 'onlyOwner':
        color = 'bg-purple-600';
        break;
      default:
        color = 'bg-gray-600';
    }
    return <Badge className={color}>{access}</Badge>;
  };
  
  // Formatear el tipo de seguridad
  const getSecurityBadge = (type: 'warning' | 'info' | 'error') => {
    switch (type) {
      case 'warning':
        return <Badge className="bg-yellow-600">Advertencia</Badge>;
      case 'info':
        return <Badge className="bg-blue-600">Info</Badge>;
      case 'error':
        return <Badge className="bg-red-600">Error</Badge>;
      default:
        return null;
    }
  };
  
  // Renderizar el icono según el tipo de función
  const getFunctionIcon = (func: FunctionDetails) => {
    if (func.access === 'onlyOwner') {
      return <Badge className="bg-purple-600">Admin</Badge>;
    }
    
    if (func.stateMutability === 'view' || func.stateMutability === 'pure') {
      return <Badge className="bg-blue-600">Lectura</Badge>;
    }
    
    return <Badge className="bg-orange-600">Escritura</Badge>;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <h2 className="text-2xl font-bold text-white">Documentación de Funciones</h2>
      <p className="text-gray-400">
        Documentación detallada de las funciones del contrato {contract.name}.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar funciones..."
          className="bg-gray-800 border-gray-700 pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 h-fit">
          <h3 className="text-lg font-semibold text-white mb-4">Funciones</h3>
          <div className="space-y-2">
            {filteredFunctions.length > 0 ? (
              filteredFunctions.map((func) => (
                <Card 
                  key={func.name}
                  className={`cursor-pointer transition-colors ${
                    selectedFunction === func.name ? 'bg-gray-700 border-blue-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                  }`}
                  onClick={() => setSelectedFunction(func.name)}
                >
                  <CardHeader className="p-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-white">{func.name}</CardTitle>
                      {getFunctionIcon(func)}
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No se encontraron funciones</p>
            )}
          </div>
        </div>

        <div>
          {currentFunction ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl text-white">{currentFunction.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    {getAccessBadge(currentFunction.access)}
                    <Badge className={
                      currentFunction.stateMutability === 'view' || currentFunction.stateMutability === 'pure' 
                        ? 'bg-blue-600' 
                        : 'bg-orange-600'
                    }>
                      {currentFunction.stateMutability}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {currentFunction.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="details" className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Detalles
                    </TabsTrigger>
                    <TabsTrigger value="code" className="flex items-center">
                      <Code className="h-4 w-4 mr-2" />
                      Código
                    </TabsTrigger>
                    <TabsTrigger value="example" className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Ejemplo
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Seguridad
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="mt-0 space-y-4">
                    {currentFunction.inputs.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Parámetros</h4>
                        <div className="bg-gray-900 rounded-md p-3">
                          {currentFunction.inputs.map((input, idx) => (
                            <div key={idx} className="py-2 border-b border-gray-800 last:border-b-0">
                              <div className="flex items-center text-sm">
                                <span className="text-gray-400 w-1/4">{input.name}</span>
                                <span className="text-blue-400 w-1/4 font-mono">{input.type}</span>
                                <span className="text-gray-300 w-2/4">{input.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {currentFunction.outputs.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Retorno</h4>
                        <div className="bg-gray-900 rounded-md p-3">
                          {currentFunction.outputs.map((output, idx) => (
                            <div key={idx} className="py-2 border-b border-gray-800 last:border-b-0">
                              <div className="flex items-center text-sm">
                                <span className="text-blue-400 w-1/4 font-mono">{output.type}</span>
                                <span className="text-gray-300 w-3/4">{output.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Características</h4>
                      <div className="bg-gray-900 rounded-md p-3">
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tipo:</span>
                            <span className="text-white">{currentFunction.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Acceso:</span>
                            <span className="text-white">{currentFunction.access}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Mutabilidad:</span>
                            <span className="text-white">{currentFunction.stateMutability}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Parámetros:</span>
                            <span className="text-white">{currentFunction.inputs.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="code" className="mt-0">
                    <CodeViewer 
                      code={currentFunction.source} 
                      language="solidity" 
                      title="Implementación"
                      showLineNumbers={true}
                      maxHeight="300px"
                    />
                  </TabsContent>
                  
                  <TabsContent value="example" className="mt-0">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-300">Ejemplo de Uso</h4>
                      <CodeViewer 
                        code={currentFunction.example} 
                        language="javascript"
                        showLineNumbers={true}
                        maxHeight="300px"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="security" className="mt-0">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-300">Consideraciones de Seguridad</h4>
                      
                      {currentFunction.security.length > 0 ? (
                        <div className="space-y-3">
                          {currentFunction.security.map((item, idx) => (
                            <div key={idx} className="bg-gray-900 rounded-md p-3 flex items-start">
                              <div className="mr-3 mt-0.5">
                                {getSecurityBadge(item.type)}
                              </div>
                              <p className="text-gray-300 text-sm">{item.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 bg-gray-900 rounded-md p-3 text-sm">
                          No hay consideraciones de seguridad especiales para esta función.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-800 rounded-lg p-8 border border-gray-700">
              <p className="text-gray-400">Selecciona una función para ver su documentación</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FunctionDocumentation; 