import { useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls, 
  Background,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ContractVisualizerProps {
  contractData?: {
    sourceCode?: string;
    analysis?: string;
  };
}

// Tipo para los datos del diagrama que vienen de la API
interface DiagramData {
  nodes: any[];
  edges: any[];
  explanation?: string;
}

const ContractVisualizer = ({ contractData = {} }: ContractVisualizerProps) => {
  const initialNodes: Node[] = [
    {
      id: '1',
      type: 'input',
      data: { label: 'RootstockToken Contract' },
      position: { x: 250, y: 25 },
      style: { background: '#5c67e3', color: 'white', width: 200 }
    },
    // Variables
    {
      id: 'vars',
      data: { label: 'State Variables' },
      position: { x: 50, y: 125 },
      style: { background: '#2d3748', color: 'white', width: 180 }
    },
    {
      id: 'owner',
      data: { label: 'owner: address' },
      position: { x: 50, y: 200 },
    },
    {
      id: 'totalSupply',
      data: { label: 'totalSupply: uint256' },
      position: { x: 50, y: 275 },
    },
    // Functions
    {
      id: 'mint',
      data: { label: 'mint(address to, uint256 amount)' },
      position: { x: 300, y: 125 },
      style: { background: '#38a169', color: 'white', width: 220 }
    },
    {
      id: 'burn',
      data: { label: 'burn(uint256 amount)' },
      position: { x: 300, y: 200 },
      style: { background: '#e53e3e', color: 'white', width: 220 }
    },
    {
      id: 'transfer',
      data: { label: 'transfer(address to, uint256 amount)' },
      position: { x: 300, y: 275 },
      style: { background: '#3182ce', color: 'white', width: 220 }
    },
    {
      id: 'approve',
      data: { label: 'approve(address spender, uint256 amount)' },
      position: { x: 300, y: 350 },
      style: { background: '#3182ce', color: 'white', width: 220 }
    },
    // Events
    {
      id: 'events',
      data: { label: 'Events' },
      position: { x: 550, y: 125 },
      style: { background: '#6b46c1', color: 'white', width: 180 }
    },
    {
      id: 'transferEvent',
      data: { label: 'Transfer(from, to, value)' },
      position: { x: 550, y: 200 },
    },
    {
      id: 'approvalEvent',
      data: { label: 'Approval(owner, spender, value)' },
      position: { x: 550, y: 275 },
    }
  ];

  const initialEdges: Edge[] = [
    // Connect variables to contract
    { id: 'e1-vars', source: '1', target: 'vars', animated: true },
    { id: 'e-vars-owner', source: 'vars', target: 'owner' },
    { id: 'e-vars-supply', source: 'vars', target: 'totalSupply' },
    
    // Connect functions to contract
    { id: 'e1-mint', source: '1', target: 'mint', animated: true },
    { id: 'e1-burn', source: '1', target: 'burn', animated: true },
    { id: 'e1-transfer', source: '1', target: 'transfer', animated: true },
    { id: 'e1-approve', source: '1', target: 'approve', animated: true },
    
    // Connect events
    { id: 'e1-events', source: '1', target: 'events', animated: true },
    { id: 'e-events-transfer', source: 'events', target: 'transferEvent' },
    { id: 'e-events-approval', source: 'events', target: 'approvalEvent' }
  ];

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [diagramExplanation, setDiagramExplanation] = useState<string | null>(null);

  useEffect(() => {
    // Si tenemos datos de análisis, intentamos extraer los datos del diagrama
    if (contractData.analysis) {
      try {
        const analysisData = JSON.parse(contractData.analysis);
        
        if (analysisData.diagramData) {
          const diagramData = analysisData.diagramData as DiagramData;
          
          // Convertir los nodos de la API al formato esperado por ReactFlow
          if (diagramData.nodes && diagramData.nodes.length > 0) {
            const apiNodes = diagramData.nodes.map(node => ({
              ...node,
              // Asegurarnos de que los nodos tienen los campos necesarios
              id: node.id,
              data: node.data || { label: node.label || node.id },
              position: node.position || { x: 0, y: 0 },
              style: node.style || {}
            }));
            setNodes(apiNodes);
          }
          
          // Convertir las aristas de la API al formato esperado por ReactFlow
          if (diagramData.edges && diagramData.edges.length > 0) {
            const apiEdges = diagramData.edges.map(edge => ({
              ...edge,
              // Asegurarnos de que las aristas tienen los campos necesarios
              id: edge.id || `e-${edge.source}-${edge.target}`,
              source: edge.source,
              target: edge.target,
              animated: edge.animated || false
            }));
            setEdges(apiEdges);
          }
          
          // Guardar la explicación del diagrama si existe
          if (diagramData.explanation) {
            setDiagramExplanation(diagramData.explanation);
          }
        }
      } catch (error) {
        console.error("Error al procesar los datos del diagrama:", error);
      }
    } else if (contractData.sourceCode) {
      // Si no tenemos datos de análisis pero sí el código fuente, podríamos
      // generar un diagrama básico en el cliente (aunque no lo implementaremos por ahora)
      console.log('Código del contrato recibido, pero sin datos de diagrama');
    }
  }, [contractData.analysis, contractData.sourceCode]);

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold mb-6 text-white">Contract Structure</h3>
      
      <div className="text-gray-300 mb-4 text-sm">
        {diagramExplanation ? (
          <p>{diagramExplanation}</p>
        ) : (
          <p>Visualización detallada de la estructura del contrato inteligente, incluyendo variables, funciones y eventos.</p>
        )}
      </div>

      <div style={{ width: '100%', height: '600px' }} className="rounded-lg overflow-hidden border border-gray-800">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
        >
          <Controls />
          <MiniMap
            nodeStrokeColor={(n) => '#fff'}
            nodeColor={(n) => {
              switch (n.style?.background) {
                case '#5c67e3': return '#5c67e3';
                case '#38a169': return '#38a169';
                case '#e53e3e': return '#e53e3e';
                case '#3182ce': return '#3182ce';
                case '#6b46c1': return '#6b46c1';
                default: return '#2d3748';
              }
            }}
          />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <p>La visualización muestra las relaciones entre variables de estado, funciones y eventos del contrato.</p>
      </div>
    </div>
  );
};

export default ContractVisualizer;
