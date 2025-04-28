import { useState } from 'react';
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

// Componente para cada nodo
const CustomNode = ({ data }: { data: any }) => {
  return (
    <Card className={`${data.bgColor || 'bg-gray-800'} border-gray-700 w-full max-w-[250px]`}>
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm">{data.title}</CardTitle>
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
  
  // Función para generar los nodos basados en el contrato
  const generateNodes = (): Node[] => {
    if (!contract) return [];
    
    // En una aplicación real, esto analizaría el código del contrato
    // para generar automáticamente los nodos basados en variables, funciones, etc.
    
    // Ejemplo de nodos
    return [
      // Nodo del contrato principal
      {
        id: 'contract',
        type: 'custom',
        position: { x: 400, y: 50 },
        data: { 
          title: 'RootstockToken',
          subtitle: 'ERC20, Burnable, Pausable',
          bgColor: 'bg-blue-900'
        }
      },
      
      // Herencias
      {
        id: 'erc20',
        type: 'custom',
        position: { x: 200, y: 180 },
        data: { 
          title: 'ERC20',
          subtitle: 'Interfaz Base',
          bgColor: 'bg-purple-900'
        }
      },
      {
        id: 'burnable',
        type: 'custom',
        position: { x: 400, y: 180 },
        data: { 
          title: 'ERC20Burnable',
          subtitle: 'Extensión',
          bgColor: 'bg-purple-900'
        }
      },
      {
        id: 'pausable',
        type: 'custom',
        position: { x: 600, y: 180 },
        data: { 
          title: 'Pausable',
          subtitle: 'Seguridad',
          bgColor: 'bg-purple-900'
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
      {
        id: 'name',
        type: 'custom',
        position: { x: 50, y: 400 },
        data: { 
          title: 'name',
          content: 'string',
          bgColor: 'bg-gray-700'
        }
      },
      {
        id: 'symbol',
        type: 'custom',
        position: { x: 150, y: 400 },
        data: { 
          title: 'symbol', 
          content: 'string',
          bgColor: 'bg-gray-700'
        }
      },
      {
        id: 'owner',
        type: 'custom',
        position: { x: 250, y: 400 },
        data: { 
          title: 'owner', 
          content: 'address',
          bgColor: 'bg-gray-700'
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
      {
        id: 'transfer',
        type: 'custom',
        position: { x: 350, y: 400 },
        data: { 
          title: 'transfer()', 
          content: 'Transfiere tokens',
          bgColor: 'bg-green-900'
        }
      },
      {
        id: 'mint',
        type: 'custom',
        position: { x: 450, y: 400 },
        data: { 
          title: 'mint()', 
          content: 'Crea nuevos tokens',
          bgColor: 'bg-green-900'
        }
      },
      {
        id: 'pause',
        type: 'custom',
        position: { x: 550, y: 400 },
        data: { 
          title: 'pause()', 
          content: 'Pausa transferencias',
          bgColor: 'bg-yellow-900'
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
      },
      {
        id: 'transfer-event',
        type: 'custom',
        position: { x: 700, y: 400 },
        data: { 
          title: 'Transfer',
          content: 'from, to, value',
          bgColor: 'bg-orange-900'
        }
      },
      {
        id: 'approval-event',
        type: 'custom',
        position: { x: 825, y: 400 },
        data: { 
          title: 'Approval',
          content: 'owner, spender, value',
          bgColor: 'bg-orange-900'
        }
      },
    ];
  };
  
  // Generar aristas (conexiones)
  const generateEdges = (): Edge[] => {
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

  const generateFlowChart = (): { nodes: Node[], edges: Edge[] } => {
    return {
      nodes: [
        {
          id: 'deploy',
          type: 'custom',
          position: { x: 400, y: 50 },
          data: { 
            title: 'Desplegar Contrato',
            content: 'Publica el contrato en la testnet',
            bgColor: 'bg-green-900'
          }
        },
        {
          id: 'transfer-tokens',
          type: 'custom',
          position: { x: 250, y: 150 },
          data: { 
            title: 'Transferir Tokens',
            content: 'Enviar tokens entre cuentas',
            bgColor: 'bg-blue-900'
          }
        },
        {
          id: 'manage-token',
          type: 'custom',
          position: { x: 550, y: 150 },
          data: { 
            title: 'Administrar Token',
            content: 'Funciones del propietario',
            bgColor: 'bg-purple-900'
          }
        },
        {
          id: 'user-balance',
          type: 'custom',
          position: { x: 150, y: 250 },
          data: { 
            title: 'Consultar Balance',
            content: 'Ver tokens de una cuenta',
            bgColor: 'bg-gray-800'
          }
        },
        {
          id: 'approve-spend',
          type: 'custom',
          position: { x: 350, y: 250 },
          data: { 
            title: 'Aprobar Gastos',
            content: 'Permitir a otros gastar tokens',
            bgColor: 'bg-gray-800'
          }
        },
        {
          id: 'mint',
          type: 'custom',
          position: { x: 450, y: 250 },
          data: { 
            title: 'Acuñar Tokens',
            content: 'Crear nuevos tokens',
            bgColor: 'bg-yellow-900'
          }
        },
        {
          id: 'pause',
          type: 'custom',
          position: { x: 650, y: 250 },
          data: { 
            title: 'Pausar/Reanudar',
            content: 'Controlar transferencias',
            bgColor: 'bg-yellow-900'
          }
        },
      ],
      edges: [
        { id: 'e-deploy-transfer', source: 'deploy', target: 'transfer-tokens' },
        { id: 'e-deploy-manage', source: 'deploy', target: 'manage-token' },
        { id: 'e-transfer-balance', source: 'transfer-tokens', target: 'user-balance' },
        { id: 'e-transfer-approve', source: 'transfer-tokens', target: 'approve-spend' },
        { id: 'e-manage-mint', source: 'manage-token', target: 'mint' },
        { id: 'e-manage-pause', source: 'manage-token', target: 'pause' },
      ]
    };
  };

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Selecciona un contrato para visualizar su estructura</p>
      </div>
    );
  }

  const structureDiagram = { nodes: generateNodes(), edges: generateEdges() };
  const flowDiagram = generateFlowChart();

  const getActiveNodes = () => {
    return activeTab === 'structure' ? structureDiagram.nodes : flowDiagram.nodes;
  };

  const getActiveEdges = () => {
    return activeTab === 'structure' ? structureDiagram.edges : flowDiagram.edges;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Visualización del Contrato</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Compactar
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Expandir
            </>
          )}
        </Button>
      </div>
      
      <p className="text-gray-400">
        Visualización detallada de la estructura y flujo de operación del contrato {contract.name}.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="structure">Estructura</TabsTrigger>
          <TabsTrigger value="flow">Flujo de Operación</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div 
        className={`border border-gray-700 rounded-lg overflow-hidden transition-all duration-300 ${
          expanded ? 'h-[700px]' : 'h-[450px]'
        }`}
      >
        <ReactFlow
          nodes={getActiveNodes()}
          edges={getActiveEdges()}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap
            className="bg-gray-900 border border-gray-700"
            nodeColor={(n) => {
              const bgColor = n.data?.bgColor || 'bg-gray-800';
              switch (bgColor) {
                case 'bg-blue-900': return '#3182ce';
                case 'bg-green-900': return '#38a169';
                case 'bg-purple-900': return '#805ad5';
                case 'bg-yellow-900': return '#d69e2e';
                case 'bg-orange-900': return '#dd6b20';
                default: return '#2d3748';
              }
            }}
          />
          <Background color="#666" gap={16} size={1} />
          
          <Panel position="top-right">
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" title="Zoom In">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title="Zoom Out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title="Fullscreen">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title="Descargar Diagrama">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
      
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-2">Leyenda</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-900 rounded mr-2"></div>
            <span className="text-sm text-gray-300">Contrato Principal</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-900 rounded mr-2"></div>
            <span className="text-sm text-gray-300">Herencias</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-900 rounded mr-2"></div>
            <span className="text-sm text-gray-300">Funciones Básicas</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-900 rounded mr-2"></div>
            <span className="text-sm text-gray-300">Funciones Admin</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-900 rounded mr-2"></div>
            <span className="text-sm text-gray-300">Eventos</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-2">Documentación</h3>
        <div className="space-y-4 text-sm text-gray-300">
          <p>Este diagrama muestra la estructura completa del contrato {contract.name}, incluyendo:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Herencias y dependencias del contrato</li>
            <li>Variables de estado y su visibilidad</li>
            <li>Funciones públicas y su accesibilidad</li>
            <li>Eventos emitidos por el contrato</li>
            <li>Relaciones entre los diferentes componentes</li>
          </ul>
          <p>El diagrama de flujo muestra cómo interactuar con el contrato y las operaciones principales que se pueden realizar.</p>
        </div>
      </div>
    </div>
  );
};

export default DiagramView; 