import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodeViewer from './CodeViewer';
import { Contract } from '@/hooks/use-contract-storage';
import ContractVisualizer from './ContractVisualizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelative } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronLeft, ChevronRight, Info, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CodeSkeleton, LoadingSkeleton } from './ui/loading-skeleton';
import { useContractABI, useContractBytecode } from "@/hooks/use-contract-data";

// Definir tipos para ABI items
interface ABIItem {
  type: string;
  name?: string;
  inputs?: Array<{type: string, name?: string}>;
  outputs?: Array<{type: string, name?: string}>;
  stateMutability?: string;
  anonymous?: boolean;
  // otros campos posibles
  [key: string]: any;
}

// Definir tipo para secciones
interface ABISections {
  functions: ABIItem[];
  events: ABIItem[];
  constructor: ABIItem[];
  fallback: ABIItem[];
  receive: ABIItem[];
  other: ABIItem[];
}

interface ContractDetailsViewerProps {
  contract: Contract | null;
}

const ContractDetailsViewer: React.FC<ContractDetailsViewerProps> = ({ contract }) => {
  const [currentAbiPage, setCurrentAbiPage] = useState(1);
  const [expandedAbiSection, setExpandedAbiSection] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 5;

  // Usar React Query para cargar datos de ABI de manera eficiente
  const { 
    data: abiData,
    isLoading: isLoadingAbi,
    error: abiError 
  } = useContractABI(contract?.id || null, currentAbiPage, ITEMS_PER_PAGE);

  // Cargar bytecode de manera eficiente
  const {
    data: bytecode,
    isLoading: isLoadingBytecode
  } = useContractBytecode(contract?.id || null);

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Selecciona un contrato para ver sus detalles</p>
      </div>
    );
  }

  // Inicializar las secciones de ABI
  const abiSections: ABISections = {
    functions: [],
    events: [],
    constructor: [],
    fallback: [],
    receive: [],
    other: []
  };

  // Organizar ABI por categorías si hay datos disponibles
  if (abiData?.items && Array.isArray(abiData.items)) {
    abiData.items.forEach((item: ABIItem) => {
      const itemType = item.type || 'other';
      
      if (itemType === 'function' && Array.isArray(abiSections.functions)) {
        abiSections.functions.push(item);
      } else if (itemType === 'event' && Array.isArray(abiSections.events)) {
        abiSections.events.push(item);
      } else if (itemType === 'constructor' && Array.isArray(abiSections.constructor)) {
        abiSections.constructor.push(item);
      } else if (itemType === 'fallback' && Array.isArray(abiSections.fallback)) {
        abiSections.fallback.push(item);
      } else if (itemType === 'receive' && Array.isArray(abiSections.receive)) {
        abiSections.receive.push(item);
      } else if (Array.isArray(abiSections.other)) {
        abiSections.other.push(item);
      }
    });
  }

  // Helper para renderizar el ABI en formato legible
  const renderFormattedJson = (json: any) => {
    return JSON.stringify(json, null, 2);
  };

  // Extraer funciones del ABI para la sección de explicación
  const getFunctionSummary = (func: ABIItem) => {
    if (!func.name) return "Función anónima";
    
    const inputs = func.inputs?.map((input) => 
      `${input.type} ${input.name || ''}`
    ).join(', ') || '';
    
    return `${func.name}(${inputs})`;
  };

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    if (page < 1 || page > (abiData?.totalPages || 1)) return;
    setCurrentAbiPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{contract.name}</h2>
          <p className="text-gray-400 mt-1">{contract.description}</p>
        </div>
        <div className="text-sm text-gray-400">
          <p>Creado: {formatRelative(new Date(contract.createdAt), new Date(), { locale: es })}</p>
          <p>Última actualización: {formatRelative(new Date(contract.lastUpdatedAt), new Date(), { locale: es })}</p>
        </div>
      </div>

      <Tabs defaultValue="source" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="source">Código Fuente</TabsTrigger>
          <TabsTrigger value="abi">ABI</TabsTrigger>
          <TabsTrigger value="bytecode">Bytecode</TabsTrigger>
        </TabsList>
        
        <TabsContent value="source">
          <CodeViewer 
            code={contract.sourceCode} 
            language="solidity" 
            title="Código Fuente"
          />
        </TabsContent>
        
        <TabsContent value="abi" className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Application Binary Interface (ABI)</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">El ABI define cómo interactuar con el contrato, incluyendo funciones, eventos y su estructura.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {isLoadingAbi ? (
              <div className="space-y-4 py-4">
                <LoadingSkeleton height={8} width="100%" />
                <LoadingSkeleton height={20} width="100%" />
                <LoadingSkeleton height={20} width="100%" />
              </div>
            ) : abiError ? (
              <div className="text-red-500 p-4 bg-red-900/20 rounded">
                Error al cargar los datos del ABI. Intente nuevamente.
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-sm mb-4">
                  El ABI contiene {abiData?.total || 0} elementos. Mostrando página {currentAbiPage} de {abiData?.totalPages || 1}.
                </p>

                <Accordion type="single" collapsible className="w-full mb-4">
                  {Object.entries(abiSections).map(([sectionName, items]) => {
                    // Mostrar sección solo si tiene elementos
                    if (!items || items.length === 0) return null;
                    
                    return (
                      <AccordionItem key={sectionName} value={sectionName}>
                        <AccordionTrigger className="text-gray-200 hover:bg-gray-800 px-3 rounded">
                          {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} ({items.length})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pl-2">
                            {items.map((item, idx) => (
                              <Card key={idx} className="bg-gray-800 border-gray-700">
                                <CardHeader className="py-3 px-4">
                                  <CardTitle className="text-sm font-semibold text-white">
                                    {item.name || item.type}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="py-2 px-4">
                                  <div className="max-h-[200px] overflow-auto text-xs">
                                    <pre className="text-gray-300">{renderFormattedJson(item)}</pre>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
                
                {(abiData?.totalPages || 0) > 1 && (
                  <Pagination className="my-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(currentAbiPage - 1)}
                          className={currentAbiPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: abiData?.totalPages || 0 }).map((_, idx) => {
                        const page = idx + 1;
                        // Mostrar solo páginas cercanas a la actual para evitar sobrecarga
                        if (
                          page === 1 || 
                          page === abiData?.totalPages || 
                          (page >= currentAbiPage - 1 && page <= currentAbiPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={page === currentAbiPage}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          page === currentAbiPage - 2 ||
                          page === currentAbiPage + 2
                        ) {
                          return <PaginationEllipsis key={page} />;
                        }
                        return null;
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(currentAbiPage + 1)}
                          className={currentAbiPage === (abiData?.totalPages || 1) ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
                
                <div className="mt-4 text-sm text-gray-400">
                  <p>Para ver el ABI completo sin formato, utilice la vista de código abajo:</p>
                </div>
                
                <div className="mt-4">
                  <CodeViewer 
                    code={contract.abi} 
                    language="json" 
                    title="ABI Raw" 
                    className="max-h-[300px]"
                  />
                </div>
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="bytecode">
          <Card>
            <CardHeader className="py-3">
              <CardTitle>Bytecode</CardTitle>
              <CardDescription>Representación binaria compilada del contrato</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBytecode ? (
                <div className="space-y-2">
                  <LoadingSkeleton className="h-6 w-full" />
                  <LoadingSkeleton className="h-6 w-full" />
                  <LoadingSkeleton className="h-6 w-full" />
                </div>
              ) : (
                <>
                  <div className="max-h-[200px] overflow-auto mb-2">
                    <CodeViewer 
                      code={bytecode || contract.bytecode} 
                      language="text" 
                      showLineNumbers={false}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    El bytecode es el código de máquina que se ejecuta en la EVM (Ethereum Virtual Machine).
                    Generalmente no es necesario interactuar directamente con él.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visualización</CardTitle>
            <CardDescription>Estructura visual del contrato</CardDescription>
          </CardHeader>
          <CardContent>
            <ContractVisualizer contractData={{ sourceCode: contract.sourceCode }} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Funciones</CardTitle>
            <CardDescription>Explicación de las funciones principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingAbi ? (
                <div className="space-y-3">
                  <LoadingSkeleton className="h-16 w-full" />
                  <LoadingSkeleton className="h-16 w-full" />
                </div>
              ) : abiSections.functions.length > 0 ? (
                abiSections.functions.slice(0, 4).map((func, idx) => (
                  <div key={idx} className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-2">{getFunctionSummary(func)}</h4>
                    <p className="text-gray-300">
                      {func.stateMutability === 'view' ? 'Lee datos del contrato sin modificar su estado' : 
                       func.stateMutability === 'pure' ? 'Función pura que no accede al estado del contrato' :
                       func.stateMutability === 'payable' ? 'Permite recibir Ether al llamarla' :
                       'Modifica el estado del contrato'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-gray-400">No se han identificado funciones en el ABI</p>
                </div>
              )}
              
              {abiSections.functions.length > 4 && (
                <Button variant="outline" className="w-full">
                  Ver todas las funciones ({abiSections.functions.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContractDetailsViewer; 