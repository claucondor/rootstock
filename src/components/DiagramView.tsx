import { useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls, 
  Background,
  Node,
  Edge,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Contract } from '@/hooks/use-contract-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DiagramViewProps {
  contract: Contract | null;
  className?: string;
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

const DiagramView = ({ contract, className = '' }: DiagramViewProps) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('structure');
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [diagramExplanation, setDiagramExplanation] = useState<string | null>(null);
  
  // Efecto para procesar los datos del análisis cuando cambia el contrato
  useEffect(() => {
    if (contract?.analysis) {
      try {
        const analysisData = JSON.parse(contract.analysis);
        
        if (analysisData.diagramData) {
          setDiagramData(analysisData.diagramData);
          
          if (analysisData.diagramData.explanation) {
            setDiagramExplanation(analysisData.diagramData.explanation);
          }
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
  
  // Función para generar los nodos basados en el contrato
  const generateNodes = (): Node<NodeData>[] => {
    // Si tenemos datos del diagrama de la API, usarlos
    if (diagramData?.nodes && diagramData.nodes.length > 0) {
      return diagramData.nodes.map(node => ({
        ...node,
        id: node.id,
        type: 'custom',
        position: node.position || { x: 0, y: 0 },
        data: {
          title: node.data?.label || node.data?.title || node.id,
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
      // Conexiones de herencia
      { id: 'e-contract-erc20', source: 'contract', target: 'erc20', animated: true },
      { id: 'e-contract-burnable', source: 'contract', target: 'burnable', animated: true },
      { id: 'e-contract-pausable', source: 'contract', target: 'pausable', animated: true },
      
      // Conexiones de variables
      { id: 'e-state-vars-name', source: 'state-vars', target: 'name' },
      { id: 'e-state-vars-symbol', source: 'state-vars', target: 'symbol' },
      { id: 'e-state-vars-owner', source: 'state-vars', target: 'owner' },
      
      // Conexiones de funciones
      { id: 'e-functions-transfer', source: 'functions', target: 'transfer' },
      { id: 'e-functions-mint', source: 'functions', target: 'mint' },
      { id: 'e-functions-pause', source: 'functions', target: 'pause' },
      
      // Conexiones de eventos
      { id: 'e-events-transfer', source: 'events', target: 'transfer-event' },
      { id: 'e-events-approval', source: 'events', target: 'approval-event' },
      
      // Conexiones funcionales
      { id: 'e-transfer-event', source: 'transfer', target: 'transfer-event', type: 'step', style: { stroke: '#666' } },
      { id: 'e-mint-transfer', source: 'mint', target: 'transfer-event', type: 'step', style: { stroke: '#666' } },
    ];
  };

  // Generar el diagrama de flujo
  const generateFlowChart = (): { nodes: Node[], edges: Edge[] } => {
    // Si tenemos datos del diagrama de flujo de la API, usarlos
    if (diagramData?.flowData) {
      return {
        nodes: diagramData.flowData.nodes.map(node => ({
          ...node,
          id: node.id,
          type: 'custom',
          position: node.position || { x: 0, y: 0 },
          data: {
            ...node.data,
            title: node.data?.label || node.data?.title || node.id,
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
          position: { x: 250, y: 250 },
          data: { 
            title: 'Transfer',
            bgColor: 'bg-green-900'
          }
        },
        {
          id: 'burn',
          type: 'custom',
          position: { x: 550, y: 250 },
          data: { 
            title: 'Burn',
            bgColor: 'bg-red-900'
          }
        }
      ],
      edges: [
        { id: 'e-deploy-mint', source: 'deploy', target: 'mint', animated: true },
        { id: 'e-mint-transfer', source: 'mint', target: 'transfer' },
        { id: 'e-mint-burn', source: 'mint', target: 'burn' }
      ]
    };
  };

  const flowDiagram = generateFlowChart();

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Selecciona un contrato para visualizar su estructura</p>
      </div>
    );
  }

  const structureDiagram = { nodes: generateNodes(), edges: generateEdges() };

  const getActiveNodes = () => {
    return activeTab === 'structure' ? structureDiagram.nodes : flowDiagram.nodes;
  };

  const getActiveEdges = () => {
    return activeTab === 'structure' ? structureDiagram.edges : flowDiagram.edges;
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`transition-all duration-300 ${expanded ? 'h-[700px]' : 'h-[500px]'}`}
        style={{ width: '100%' }}
      >
        <Tabs defaultValue="structure" className="h-full flex flex-col" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between px-2">
            <TabsList>
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="flow">Flow</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <TabsContent 
            value="structure" 
            className="h-full flex-grow overflow-hidden m-0 p-0"
            style={{ minHeight: '400px' }}
          >
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <ReactFlow
                nodes={getActiveNodes()}
                edges={getActiveEdges()}
                nodeTypes={nodeTypes}
                fitView
                className="bg-background"
              >
                <Controls />
                <MiniMap />
                <Background />
              </ReactFlow>
            </div>
          </TabsContent>

          <TabsContent 
            value="flow" 
            className="h-full flex-grow overflow-hidden m-0 p-0"
            style={{ minHeight: '400px' }}
          >
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <ReactFlow
                nodes={diagramData?.flowData?.nodes || []}
                edges={diagramData?.flowData?.edges || []}
                nodeTypes={nodeTypes}
                fitView
                className="bg-background"
              >
                <Controls />
                <MiniMap />
                <Background />
              </ReactFlow>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {diagramExplanation && (
        <div className="mt-4 text-sm text-muted-foreground">
          <p>{diagramExplanation}</p>
        </div>
      )}
    </div>
  );
};

export default DiagramView; 