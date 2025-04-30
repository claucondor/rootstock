import { useState, useEffect, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
  Panel,
  ReactFlowProvider,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Contract } from '@/hooks/use-contract-storage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Loader2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DiagramViewProps {
  contract: Contract | null;
  className?: string;
  isLoading?: boolean;
  analysisData?: any;
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
    <Card
      className={`${data.bgColor || 'bg-gray-800'} border-gray-700 w-full max-w-[250px] relative`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-teal-500"
      />
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
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 bg-teal-500"
      />
    </Card>
  );
};

// Tipos de nodos personalizados
const nodeTypes = {
  custom: CustomNode,
};

const DiagramView = ({
  contract,
  className = '',
  isLoading = false,
  analysisData,
}: DiagramViewProps) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('structure');
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [diagramExplanation, setDiagramExplanation] = useState<string | null>(
    null
  );
  const [initialized, setInitialized] = useState(false);
  const flowContainerRef = useRef<HTMLDivElement>(null);

  // Effect to process analysis data when the contract changes
  useEffect(() => {
    if (contract?.analysis) {
      try {
        console.log(
          'Processing contract analysis for diagram:',
          contract.analysis
        );
        const analysisData = JSON.parse(contract.analysis);

        // Primero intentamos obtener diagramData como propiedad directa
        let extractedDiagramData = analysisData.diagramData;

        // Si no está como propiedad directa, podría estar anidado dentro del análisis
        if (
          !extractedDiagramData &&
          analysisData.analysis &&
          typeof analysisData.analysis === 'object'
        ) {
          extractedDiagramData = analysisData.analysis.diagramData;
        }

        // Si todavía no tenemos diagramData, podría estar en el nivel superior
        if (
          !extractedDiagramData &&
          Array.isArray(analysisData.nodes) &&
          Array.isArray(analysisData.edges)
        ) {
          extractedDiagramData = analysisData;
        }

        // Verificar si los datos están directamente en la respuesta (como se ve en la consola)
        if (
          !extractedDiagramData &&
          analysisData.attempts &&
          analysisData.diagramData
        ) {
          extractedDiagramData = analysisData.diagramData;
        }

        if (extractedDiagramData) {
          console.log('Datos de diagrama encontrados:', extractedDiagramData);
          setDiagramData(extractedDiagramData);

          if (extractedDiagramData.explanation) {
            setDiagramExplanation(extractedDiagramData.explanation);
          }
        } else {
          console.log('No diagram data found in analysis');
        }
      } catch (error) {
        console.error('Error processing diagram data:', error);
      }
    } else {
      // Resetear cuando no hay contrato o análisis
      setDiagramData(null);
      setDiagramExplanation(null);
    }
  }, [contract]);

  // Effect to ensure the container is ready before rendering ReactFlow
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

  // Function to generate nodes based on the contract
  const generateNodes = (): Node<NodeData>[] => {
    // Si tenemos datos del diagrama de la API, usarlos
    if (diagramData?.nodes && diagramData.nodes.length > 0) {
      const uniqueNodes: Node<NodeData>[] = [];
      const usedIds = new Set<string>();

      diagramData.nodes.forEach((node, index) => {
        let nodeId =
          node.id || `node-${index}-${Math.random().toString(36).substr(2, 9)}`;
        let originalId = nodeId;
        let suffix = 1;

        // Ensure the ID is a string
        nodeId = String(nodeId);
        originalId = nodeId;

        // Check for duplicates and add suffix if necessary
        while (usedIds.has(nodeId)) {
          suffix++;
          nodeId = `${originalId}_${suffix}`;
        }
        usedIds.add(nodeId);

        uniqueNodes.push({
          ...node,
          id: nodeId, // Use the guaranteed unique ID
          type: 'custom',
          position: node.position || {
            x: Math.random() * 400,
            y: Math.random() * 400,
          }, // Add random position if missing
          data: {
            title:
              node.data?.label ||
              node.data?.title ||
              node.label ||
              originalId ||
              'Node', // Use original ID for label if needed
            subtitle: node.data?.subtitle,
            content: node.data?.content,
            bgColor: node.data?.bgColor || 'bg-gray-800',
          },
        });
      });
      return uniqueNodes;
    }

    // Otherwise, use the default diagram
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
          bgColor: 'bg-blue-900',
        },
      },

      // Variables de estado
      {
        id: 'state-vars',
        type: 'custom',
        position: { x: 150, y: 300 },
        data: {
          title: 'State Variables',
          bgColor: 'bg-gray-800',
        },
      },

      // Funciones
      {
        id: 'functions',
        type: 'custom',
        position: { x: 450, y: 300 },
        data: {
          title: 'Functions',
          bgColor: 'bg-gray-800',
        },
      },

      // Eventos
      {
        id: 'events',
        type: 'custom',
        position: { x: 750, y: 300 },
        data: {
          title: 'Events',
          bgColor: 'bg-gray-800',
        },
      },
    ];
  };

  // Generate edges (connections)
  const generateEdges = (): Edge[] => {
    if (diagramData?.edges && diagramData.edges.length > 0) {
      return diagramData.edges.map((edge) => {
        // Ensure necessary properties and remove potentially problematic ones
        const {
          id,
          source,
          target,
          sourceHandle = null,
          targetHandle = null,
          ...restOfEdge
        } = edge;

        return {
          ...restOfEdge,
          id: id
            ? `edge-${id}`
            : `e-${source}-${target}-${Math.random().toString(16).slice(2)}`,
          source: String(source),
          target: String(target),
          sourceHandle: sourceHandle,
          targetHandle: targetHandle,
        };
      });
    }

    // Otherwise, use the default diagram
    return [
      // Conexiones desde el contrato a las secciones principales
      {
        id: 'e-contract-state',
        source: 'contract',
        target: 'state-vars',
        animated: true,
        sourceHandle: null,
        targetHandle: null,
      },
      {
        id: 'e-contract-functions',
        source: 'contract',
        target: 'functions',
        animated: true,
        sourceHandle: null,
        targetHandle: null,
      },
      {
        id: 'e-contract-events',
        source: 'contract',
        target: 'events',
        animated: true,
        sourceHandle: null,
        targetHandle: null,
      },
    ];
  };

  // Generate the flowchart
  const generateFlowChart = (): { nodes: Node[]; edges: Edge[] } => {
    // Si tenemos datos del diagrama de flujo de la API, usarlos
    if (diagramData?.flowData) {
      return {
        nodes: diagramData.flowData.nodes.map((node) => ({
          ...node,
          id: node.id || `flow-${Math.random().toString(36).substr(2, 9)}`,
          type: 'custom',
          position: node.position || { x: 0, y: 0 },
          data: {
            ...node.data,
            title:
              node.data?.label || node.data?.title || node.id || 'Flow Node',
          },
        })),
        edges: diagramData.flowData.edges.map((edge) => ({
          ...edge,
          id: edge.id || `e-${edge.source}-${edge.target}`,
          source: String(edge.source),
          target: String(edge.target),
          sourceHandle: edge.sourceHandle || null,
          targetHandle: edge.targetHandle || null,
        })),
      };
    }

    // Otherwise, use a simple default flowchart
    return {
      nodes: [
        {
          id: 'deploy',
          type: 'custom',
          position: { x: 400, y: 50 },
          data: {
            title: 'Deploy Contract',
            bgColor: 'bg-blue-900',
          },
        },
        {
          id: 'mint',
          type: 'custom',
          position: { x: 400, y: 150 },
          data: {
            title: 'Mint Tokens',
            bgColor: 'bg-green-900',
          },
        },
        {
          id: 'transfer',
          type: 'custom',
          position: { x: 400, y: 250 },
          data: {
            title: 'Transfer Tokens',
            bgColor: 'bg-blue-800',
          },
        },
        {
          id: 'burn',
          type: 'custom',
          position: { x: 400, y: 350 },
          data: {
            title: 'Burn Tokens',
            bgColor: 'bg-red-900',
          },
        },
      ],
      edges: [
        {
          id: 'e-deploy-mint',
          source: 'deploy',
          target: 'mint',
          sourceHandle: null,
          targetHandle: null,
        },
        {
          id: 'e-mint-transfer',
          source: 'mint',
          target: 'transfer',
          sourceHandle: null,
          targetHandle: null,
        },
        {
          id: 'e-transfer-burn',
          source: 'transfer',
          target: 'burn',
          sourceHandle: null,
          targetHandle: null,
        },
      ],
    };
  };

  // Get the active nodes according to the current tab
  const getActiveNodes = () => {
    return activeTab === 'flow' ? generateFlowChart().nodes : generateNodes();
  };

  // Get the active edges according to the current tab
  const getActiveEdges = () => {
    return activeTab === 'flow' ? generateFlowChart().edges : generateEdges();
  };

  // Log nodes and edges just before rendering ReactFlow
  const nodesToRender = getActiveNodes();
  const edgesToRender = getActiveEdges();
  console.log('[DiagramView] Rendering ReactFlow with:', {
    nodeCount: nodesToRender.length,
    edgeCount: edgesToRender.length,
  });
  console.log('[DiagramView] Nodes:', nodesToRender); // Uncommented detailed log
  console.log('[DiagramView] Edges:', edgesToRender); // Uncommented detailed log

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">
          Generating diagram...
        </h3>
        <p className="text-gray-400">
          Analyzing the contract to create a clear visualization of its
          structure.
        </p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">
          Select a contract to visualize its structure
        </p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">
            Visualización del Contrato
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {diagramExplanation ||
              'Representación visual de la estructura y componentes del contrato inteligente.'}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-700 hover:bg-gray-800 focus:bg-gray-800"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="ml-1">{expanded ? 'Reduce' : 'Expand'}</span>
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

      <Tabs
        defaultValue="structure"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="bg-gray-800 border-gray-700 p-1">
          <TabsTrigger
            value="structure"
            className="data-[state=active]:bg-gray-700"
          >
            Structure
          </TabsTrigger>
          <TabsTrigger value="flow" className="data-[state=active]:bg-gray-700">
            Flujo
          </TabsTrigger>
        </TabsList>

        <div
          ref={flowContainerRef}
          className={`bg-gray-850 border border-gray-700 rounded-b-lg overflow-hidden ${
            expanded ? 'h-[800px]' : 'h-[500px]'
          }`}
          style={{ width: '100%', height: expanded ? '800px' : '500px' }}
        >
          <ReactFlowProvider>
            {initialized && (
              <ReactFlow
                nodes={nodesToRender}
                edges={edgesToRender}
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
                          'purple-900': '#581c87',
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
            <span>Main Contract</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-900 rounded-full mr-2"></div>
            <span>Creation Functions</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-800 rounded-full mr-2"></div>
            <span>Transfer Functions</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-900 rounded-full mr-2"></div>
            <span>Burn Functions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagramView;
