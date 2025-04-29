import { useState, useEffect, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls, 
  Background,
  Node,
  Edge,
  Panel,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Contract } from '@/hooks/use-contract-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ZoomIn, ZoomOut, Maximize2, Download, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DiagramViewProps {
  contract: Contract | null;
  className?: string;
  isLoading?: boolean;
}

// Tipo para los datos del diagrama que vienen de la API
interface DiagramData {
  nodes: any[];
  edges: any[];
  explanation?: string;
  flowData?: {
    nodes: any[];
    edges: any[];
  };
}

interface NodeData {
  title: string;
  subtitle?: string;
  content?: string;
  bgColor?: string;
  label?: string;
}

// Componente para cada nodo
const CustomNode = ({ data }: { data: NodeData }) => {
  return (
    <Card className={`${data.bgColor || 'bg-gray-800'} border-gray-700 w-full max-w-[250px]`}>
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm">{data.title || data.label}</CardTitle>
        {data.subtitle && (
          <CardDescription className="text-xs">{data.subtitle}</CardDescription>
        )}
      </CardHeader>
      {data.content && (
        <CardContent className="py-2 px-3 text-xs border-t border-gray-700">
          {data.content}
        </CardContent>
      )}
    </Card>
  );
};

// Tipos de nodos personalizados
const nodeTypes = {
  custom: CustomNode,
};

const DiagramView = ({ contract, className = '', isLoading = false }: DiagramViewProps) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('structure');
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [diagramExplanation, setDiagramExplanation] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const flowContainerRef = useRef<HTMLDivElement>(null);
  
  // Efecto para procesar los datos del análisis cuando cambia el contrato
  useEffect(() => {
    if (contract?.analysis) {
      try {
        console.log("Procesando análisis del contrato para diagrama:", contract.analysis);
        const analysisData = JSON.parse(contract.analysis);
        
        // Primero intentamos obtener diagramData como propiedad directa
        let extractedDiagramData = analysisData.diagramData;
        
        // Si no está como propiedad directa, podría estar anidado dentro del análisis
        if (!extractedDiagramData && analysisData.analysis && typeof analysisData.analysis === 'object') {
          extractedDiagramData = analysisData.analysis.diagramData;
        }
        
        // Si todavía no tenemos diagramData, podría estar en el nivel superior
        if (!extractedDiagramData && Array.isArray(analysisData.nodes) && Array.isArray(analysisData.edges)) {
          extractedDiagramData = analysisData;
        }
        
        // Verificar si los datos están directamente en la respuesta (como se ve en la consola)
        if (!extractedDiagramData && analysisData.attempts && analysisData.diagramData) {
          extractedDiagramData = analysisData.diagramData;
        }
        
        if (extractedDiagramData) {
          console.log("Datos de diagrama encontrados:", extractedDiagramData);
          setDiagramData(extractedDiagramData);
          
          if (extractedDiagramData.explanation) {
            setDiagramExplanation(extractedDiagramData.explanation);
          }
        } else {
          console.log("No se encontraron datos de diagrama en el análisis");
        }
      } catch (error) {
        console.error("Error al procesar los datos del diagrama:", error);
      }
    } else {
      // Resetear cuando no hay contrato o análisis
      setDiagramData(null);
      setDiagramExplanation(null);
    }
  }, [contract]);
  
  // Efecto para asegurar que el contenedor está listo antes de renderizar ReactFlow
  useEffect(() => {
    if (flowContainerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        setInitialized(true);
      });
      
      resizeObserver.observe(flowContainerRef.current);
      
      return () => {
        if (flowContainerRef.current) {
          resizeObserver.unobserve(flowContainerRef.current);
        }
      };
    }
  }, []);
  
  // Función para generar los nodos basados en el contrato
  const generateNodes = (): Node<NodeData>[] => {
    // Si tenemos datos del diagrama de la API, usarlos
    if (diagramData?.nodes && diagramData.nodes.length > 0) {
      return diagramData.nodes.map(node => ({
        ...node,
        id: node.id || `node-${Math.random().toString(36).substr(2, 9)}`,
        type: 'custom',
        position: node.position || { x: 0, y: 0 },
        data: {
          title: node.data?.label || node.data?.title || node.label || node.id || 'Node',
          subtitle: node.data?.subtitle,
          content: node.data?.content,
          bgColor: node.data?.bgColor || 'bg-gray-800'
        }
      }));
    }
    
    // En caso contrario, usar el diagrama por defecto
    if (!contract) return [];
    
    return [
      // Nodo del contrato principal
      {
        id: 'contract',
        type: 'custom',
        position: { x: 400, y: 50 },
        data: { 
          title: contract.name || 'Contract',
          subtitle: 'Smart Contract',
          bgColor: 'bg-blue-900'
        }
      },
      
      // Variables de estado
      {
        id: 'state-vars',
        type: 'custom',
        position: { x: 150, y: 300 },
        data: { 
          title: 'Variables de Estado',
          bgColor: 'bg-gray-800'
        }
      },
      
      // Funciones
      {
        id: 'functions',
        type: 'custom',
        position: { x: 450, y: 300 },
        data: { 
          title: 'Funciones',
          bgColor: 'bg-gray-800'
        }
      },
      
      // Eventos
      {
        id: 'events',
        type: 'custom',
        position: { x: 750, y: 300 },
        data: { 
          title: 'Eventos',
          bgColor: 'bg-gray-800'
        }
      }
    ];
  };
  
  // Generar aristas (conexiones)
  const generateEdges = (): Edge[] => {
    // Si tenemos datos del diagrama de la API, usarlos
    if (diagramData?.edges && diagramData.edges.length > 0) {
      return diagramData.edges.map(edge => ({
        ...edge,
        // Convertir al formato exacto que espera ReactFlow
        id: edge.id || `e-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        animated: edge.animated || false,
        type: edge.type || 'default',
        style: edge.style || {}
      }));
    }
    
    // En caso contrario, usar el diagrama por defecto
    return [
      // Conexiones desde el contrato a las secciones principales
      { id: 'e-contract-state', source: 'contract', target: 'state-vars', animated: true },
      { id: 'e-contract-functions', source: 'contract', target: 'functions', animated: true },
      { id: 'e-contract-events', source: 'contract', target: 'events', animated: true },
    ];
  };

  // Generar el diagrama de flujo
  const generateFlowChart = (): { nodes: Node[], edges: Edge[] } => {
    // Si tenemos datos del diagrama de flujo de la API, usarlos
    if (diagramData?.flowData) {
      return {
        nodes: diagramData.flowData.nodes.map(node => ({
          ...node,
          id: node.id || `flow-${Math.random().toString(36).substr(2, 9)}`,
          type: 'custom',
          position: node.position || { x: 0, y: 0 },
          data: {
            ...node.data,
            title: node.data?.label || node.data?.title || node.id || 'Flow Node',
          }
        })),
        edges: diagramData.flowData.edges.map(edge => ({
          ...edge,
          id: edge.id || `e-${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target
        }))
      };
    }
    
    // En caso contrario, usar un diagrama de flujo predeterminado simple
    return {
      nodes: [
        {
          id: 'deploy',
          type: 'custom',
          position: { x: 400, y: 50 },
          data: { 
            title: 'Deploy Contract',
            bgColor: 'bg-blue-900'
          }
        },
        {
          id: 'mint',
          type: 'custom',
          position: { x: 400, y: 150 },
          data: { 
            title: 'Mint Tokens',
            bgColor: 'bg-green-900'
          }
        },
        {
          id: 'transfer',
          type: 'custom',
          position: { x: 400, y: 250 },
          data: { 
            title: 'Transfer Tokens',
            bgColor: 'bg-blue-800'
          }
        },
        {
          id: 'burn',
          type: 'custom',
          position: { x: 400, y: 350 },
          data: { 
            title: 'Burn Tokens',
            bgColor: 'bg-red-900'
          }
        }
      ],
      edges: [
        { id: 'e-deploy-mint', source: 'deploy', target: 'mint' },
        { id: 'e-mint-transfer', source: 'mint', target: 'transfer' },
        { id: 'e-transfer-burn', source: 'transfer', target: 'burn' }
      ]
    };
  };
  
  // Obtener los nodos activos según la pestaña actual
  const getActiveNodes = () => {
    return activeTab === 'flow' ? generateFlowChart().nodes : generateNodes();
  };
  
  // Obtener las aristas activas según la pestaña actual
  const getActiveEdges = () => {
    return activeTab === 'flow' ? generateFlowChart().edges : generateEdges();
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">Generando diagrama...</h3>
        <p className="text-gray-400">Analizando el contrato para crear una visualización clara de su estructura.</p>
      </div>
    );
  }
  
  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Selecciona un contrato para visualizar su estructura</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Visualización del Contrato</h3>
          <p className="text-gray-400 text-sm mt-1">
            {diagramExplanation || "Representación visual de la estructura y componentes del contrato inteligente."}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-gray-700 hover:bg-gray-800 focus:bg-gray-800"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="ml-1">{expanded ? "Reducir" : "Expandir"}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-gray-700 hover:bg-gray-800 focus:bg-gray-800"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="structure" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800 border-gray-700 p-1">
          <TabsTrigger 
            value="structure" 
            className="data-[state=active]:bg-gray-700"
          >
            Estructura
          </TabsTrigger>
          <TabsTrigger 
            value="flow" 
            className="data-[state=active]:bg-gray-700"
          >
            Flujo
          </TabsTrigger>
        </TabsList>
        
        <div 
          ref={flowContainerRef}
          className={`bg-gray-850 border border-gray-700 rounded-b-lg ${
            expanded ? 'h-[800px]' : 'h-[500px]'
          }`}
          style={{ width: '100%', height: expanded ? '800px' : '500px' }}
        >
          <ReactFlowProvider>
            {initialized && (
              <ReactFlow
                nodes={getActiveNodes()}
                edges={getActiveEdges()}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              >
                <Controls />
                <MiniMap 
                  style={{ background: '#1f2937' }}
                  nodeStrokeColor={(n) => '#fff'}
                  nodeColor={(n) => {
                    if (n.data?.bgColor) {
                      // Extrae el color de la clase bgColor (por ejemplo, de 'bg-blue-900' extrae 'blue-900')
                      const match = n.data.bgColor.match(/bg-([a-z]+-[0-9]+)/);
                      if (match) {
                        const colorName = match[1];
                        // Mapeo simple de colores de Tailwind a hex
                        const colorMap: Record<string, string> = {
                          'blue-900': '#1e3a8a',
                          'blue-800': '#1e40af',
                          'green-900': '#14532d',
                          'red-900': '#7f1d1d',
                          'gray-800': '#1f2937',
                          'purple-900': '#581c87'
                        };
                        return colorMap[colorName] || '#1f2937';
                      }
                    }
                    return '#1f2937';
                  }}
                  maskColor="#1f2937a0"
                />
                <Background color="#aaa" gap={16} />
                
                <Panel position="top-right">
                  <div className="flex bg-gray-800 rounded-md border border-gray-700 shadow-md">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-300 hover:text-white"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-300 hover:text-white"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-300 hover:text-white"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Panel>
              </ReactFlow>
            )}
          </ReactFlowProvider>
        </div>
      </Tabs>
      
      <div className="mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-900 rounded-full mr-2"></div>
            <span>Contrato Principal</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-900 rounded-full mr-2"></div>
            <span>Funciones de Creación</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-800 rounded-full mr-2"></div>
            <span>Funciones de Transferencia</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-900 rounded-full mr-2"></div>
            <span>Funciones de Quemado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagramView; 