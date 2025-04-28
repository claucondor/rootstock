import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Info, Loader2 } from 'lucide-react';
import { Contract } from '@/hooks/use-contract-storage';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

interface ContractABIFunction {
  name: string;
  type: string;
  inputs: Array<{
    name: string;
    type: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
  }>;
  stateMutability: string;
}

interface ContractInteractionProps {
  contract: Contract | null;
  deployedAddress?: string | null;
}

const ContractInteraction = ({ contract, deployedAddress }: ContractInteractionProps) => {
  const [selectedFunction, setSelectedFunction] = useState<ContractABIFunction | null>(null);
  const [functionInputs, setFunctionInputs] = useState<Record<string, string>>({});
  const [callResult, setCallResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Filtrar funciones del ABI - Esto es una simplificación, en una app real
  // tendrías que parsear el ABI del contrato correctamente
  const getFunctions = (): ContractABIFunction[] => {
    if (!contract) return [];
    
    try {
      // Simplificado para el ejemplo - en una app real se parsearia el ABI correctamente
      return [
        {
          name: "transfer",
          type: "function",
          inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" }
          ],
          outputs: [
            { name: "", type: "bool" }
          ],
          stateMutability: "nonpayable"
        },
        {
          name: "balanceOf",
          type: "function",
          inputs: [
            { name: "account", type: "address" }
          ],
          outputs: [
            { name: "", type: "uint256" }
          ],
          stateMutability: "view"
        },
        {
          name: "mint",
          type: "function",
          inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" }
          ],
          outputs: [],
          stateMutability: "nonpayable"
        },
        {
          name: "pause",
          type: "function",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable"
        },
        {
          name: "unpause",
          type: "function",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable"
        }
      ];
    } catch (error) {
      console.error("Error parsing ABI:", error);
      return [];
    }
  };

  const handleFunctionSelect = (func: ContractABIFunction) => {
    setSelectedFunction(func);
    setFunctionInputs({});
    setCallResult(null);
  };

  const handleInputChange = (name: string, value: string) => {
    setFunctionInputs(prevInputs => ({
      ...prevInputs,
      [name]: value
    }));
  };

  const callFunction = async () => {
    if (!selectedFunction || !deployedAddress) return;
    
    setIsLoading(true);
    setCallResult(null);
    
    try {
      // Simulación de llamada a la función - En una app real, esto sería una llamada usando Web3/ethers.js
      setTimeout(() => {
        let result;
        
        // Simulación de diferentes resultados basados en el tipo de función
        if (selectedFunction.name === 'balanceOf') {
          result = '1000000000000000000'; // 1 token con 18 decimales
        } else if (selectedFunction.stateMutability === 'view') {
          result = 'true';
        } else {
          // Para funciones que modifican el estado, simular un hash de tx
          result = '0x' + Math.random().toString(16).slice(2, 66);
        }
        
        setCallResult(result);
        
        toast({
          title: "Función ejecutada correctamente",
          description: `La función ${selectedFunction.name} ha sido ejecutada correctamente`,
        });
        
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: `Error al ejecutar la función ${selectedFunction.name}`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const getFunctionDescription = (funcName: string): string => {
    const descriptions: Record<string, string> = {
      transfer: "Transfiere tokens al destinatario especificado",
      balanceOf: "Verifica el saldo de tokens de una dirección",
      mint: "Crea nuevos tokens y los asigna a una dirección (solo owner)",
      pause: "Pausa todas las transferencias de tokens (solo owner)",
      unpause: "Reanuda las transferencias de tokens (solo owner)"
    };
    
    return descriptions[funcName] || "No hay descripción disponible";
  };

  const formatStateMutability = (stateMutability: string): JSX.Element => {
    let color = '';
    
    switch (stateMutability) {
      case 'view':
        color = 'bg-blue-600';
        break;
      case 'pure':
        color = 'bg-purple-600';
        break;
      case 'nonpayable':
        color = 'bg-orange-600';
        break;
      case 'payable':
        color = 'bg-green-600';
        break;
      default:
        color = 'bg-gray-600';
    }
    
    return <Badge className={color}>{stateMutability}</Badge>;
  };

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Selecciona un contrato para interactuar</p>
      </div>
    );
  }

  if (!deployedAddress) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Primero debes desplegar el contrato para poder interactuar con él</p>
      </div>
    );
  }

  const functions = getFunctions();
  const viewFunctions = functions.filter(f => f.stateMutability === 'view' || f.stateMutability === 'pure');
  const writeFunctions = functions.filter(f => f.stateMutability !== 'view' && f.stateMutability !== 'pure');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Interactuar con el Contrato</h2>
      <p className="text-gray-400 mb-6">
        Dirección: <span className="font-mono text-green-400">{deployedAddress}</span>
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Funciones del Contrato</h3>
          
          <Tabs defaultValue="read">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="read">Lectura</TabsTrigger>
              <TabsTrigger value="write">Escritura</TabsTrigger>
            </TabsList>
            
            <TabsContent value="read" className="mt-0">
              <div className="space-y-2">
                {viewFunctions.length > 0 ? (
                  viewFunctions.map((func) => (
                    <Button
                      key={func.name}
                      variant={selectedFunction?.name === func.name ? "default" : "outline"}
                      onClick={() => handleFunctionSelect(func)}
                      className="w-full justify-start"
                    >
                      <span className="truncate">{func.name}</span>
                    </Button>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No hay funciones de lectura</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="write" className="mt-0">
              <div className="space-y-2">
                {writeFunctions.length > 0 ? (
                  writeFunctions.map((func) => (
                    <Button
                      key={func.name}
                      variant={selectedFunction?.name === func.name ? "default" : "outline"}
                      onClick={() => handleFunctionSelect(func)}
                      className="w-full justify-start"
                    >
                      <span className="truncate">{func.name}</span>
                    </Button>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No hay funciones de escritura</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          {selectedFunction ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    {selectedFunction.name}
                    <span className="ml-2">
                      {formatStateMutability(selectedFunction.stateMutability)}
                    </span>
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getFunctionDescription(selectedFunction.name)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription>
                  {getFunctionDescription(selectedFunction.name)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFunction.inputs.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-300">Parámetros</h4>
                    {selectedFunction.inputs.map((input, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="text-sm text-gray-400">
                          {input.name} <span className="text-gray-500">({input.type})</span>
                        </label>
                        <Input
                          type="text"
                          placeholder={`Ingrese ${input.name || input.type}`}
                          value={functionInputs[input.name] || ''}
                          onChange={(e) => handleInputChange(input.name, e.target.value)}
                          className="bg-gray-900 border-gray-700"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button 
                    onClick={callFunction} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ejecutando...
                      </>
                    ) : (
                      <>
                        Ejecutar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
                
                {callResult && (
                  <div className="mt-6 p-4 bg-gray-900 rounded-md">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Resultado</h4>
                    <div className="font-mono text-sm bg-gray-950 p-3 rounded overflow-x-auto">
                      <pre className="text-green-400">{callResult}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-800 rounded-lg p-8 border border-gray-700">
              <p className="text-gray-400">Selecciona una función para interactuar con el contrato</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractInteraction; 