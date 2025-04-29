import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatInterface from '@/components/ChatInterface';
import { ArrowLeft, Home, FileCode, Cpu, Book, LayoutGrid, FileJson, Code, ChevronDown, AlertCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import ContractDetailsViewer, { ContractABIViewer, ContractBytecodeViewer } from '@/components/ContractDetailsViewer';
import useContractStorage, { Contract } from '@/hooks/use-contract-storage';
import DiagramView from '@/components/DiagramView';
import DeploymentView from '@/components/DeploymentView';
import ContractInteraction from '@/components/ContractInteraction';
import FunctionDocumentation from '@/components/FunctionDocumentation';
import AnimatedCard from '@/components/ui/animated-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ContractGenerator = () => {
  const [activeTab, setActiveTab] = useState('code');
  const [activeCodeSection, setActiveCodeSection] = useState('source');
  const { 
    contracts, 
    deleteContract, 
    selectedContractId,
    selectedContract,
    selectContract
  } = useContractStorage();
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [loadingDocumentation, setLoadingDocumentation] = useState(false);
  const [loadingDiagram, setLoadingDiagram] = useState(false);
  const [alertDialogData, setAlertDialogData] = useState<{ id: string; name: string } | null>(null);

  // Handle loading states from ChatInterface component
  const handleLoadingStates = (docLoading: boolean, diagramLoading: boolean) => {
    setLoadingDocumentation(docLoading);
    setLoadingDiagram(diagramLoading);
  };

  const handleViewContract = (contractId: string) => {
    selectContract(contractId);
  };

  const handleDeleteContract = (contractId: string) => {
    deleteContract(contractId);
  };

  const handleDeploymentSuccess = (address: string) => {
    setDeployedAddress(address);
    setActiveTab('interaction');
  };

  const handleDeleteSelectedContract = () => {
    if (selectedContractId) {
      deleteContract(selectedContractId);
      // No need to select another one here, the hook will handle it (or set to null)
    }
  };

  // Helper function to parse analysis data
  const parseAnalysisData = (analysisString: string | undefined | null) => {
    if (!analysisString) return { hasDiagram: false, hasDocumentation: false, data: null };
    try {
      const data = JSON.parse(analysisString);
      // Check for the specific keys we expect
      const hasDiagram = !!(data && data.diagramData && Array.isArray(data.diagramData.nodes) && Array.isArray(data.diagramData.edges));
      const hasDocumentation = !!(data && data.functionAnalyses && typeof data.functionAnalyses === 'object' && Object.keys(data.functionAnalyses).length > 0 && !data.functionAnalyses.error);
      return { hasDiagram, hasDocumentation, data };
    } catch (error) {
      console.error("Error parsing analysis data in ContractGenerator:", error);
      return { hasDiagram: false, hasDocumentation: false, data: null };
    }
  };

  // Log selectedContract whenever it changes
  useEffect(() => {
     console.log('[ContractGenerator] Selected contract updated:', selectedContract);
  }, [selectedContract]);

  // Parse analysis data from the selected contract
  const analysisResult = parseAnalysisData(selectedContract?.analysis);
  const hasDiagram = analysisResult.hasDiagram;
  const hasDocumentation = analysisResult.hasDocumentation;
  const analysisDataForChildren = analysisResult.data; // Contains parsed { functionAnalyses, diagramData }

  // Log analysis parsing results
  console.log('[ContractGenerator] Analysis Result:', { hasDiagram, hasDocumentation });
  console.log('[ContractGenerator] Data being passed to children:', analysisDataForChildren);

  // Función para renderizar el panel de código según la subsección activa
  const renderCodePanel = () => {
    switch (activeCodeSection) {
      case 'source':
        return <ContractDetailsViewer contract={selectedContract} />;
      case 'abi':
        return <ContractABIViewer contract={selectedContract} />;
      case 'bytecode':
        return <ContractBytecodeViewer contract={selectedContract} />;
      default:
        return <ContractDetailsViewer contract={selectedContract} />;
    }
  };

  // Función para renderizar el panel derecho según la pestaña activa
  const renderRightPanel = () => {
    const analysisData = analysisResult.data;
    const hasDocumentation = !!analysisData?.functionAnalyses;
    const hasDiagram = !!analysisData?.diagramData?.nodes && analysisData.diagramData.nodes.length > 0;

    switch (activeTab) {
      case 'code':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="mb-4">
              <Tabs 
                value={activeCodeSection} 
                onValueChange={setActiveCodeSection}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="source">
                    <Code className="h-4 w-4 mr-2" />
                    Código Fuente
                  </TabsTrigger>
                  <TabsTrigger value="abi">
                    <FileJson className="h-4 w-4 mr-2" />
                    ABI
                  </TabsTrigger>
                  <TabsTrigger value="bytecode">
                    <FileCode className="h-4 w-4 mr-2" />
                    Bytecode
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="source" className="mt-0">
                  <ContractDetailsViewer contract={selectedContract} />
                </TabsContent>
                
                <TabsContent value="abi" className="mt-0">
                  <ContractABIViewer contract={selectedContract} />
                </TabsContent>
                
                <TabsContent value="bytecode" className="mt-0">
                  <ContractBytecodeViewer contract={selectedContract} />
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        );
      case 'diagram':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 rounded-lg p-6 min-h-[400px]"
          >
            {!selectedContract ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>Selecciona un contrato del dropdown superior para ver su diagrama.</p>
              </div>
            ) : !hasDiagram && !loadingDiagram ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>El análisis del diagrama no está disponible o no se pudo generar para este contrato.</p>
                <p className="text-sm mt-1">(La generación del diagrama se inicia después de crear el contrato).</p>
              </div>
            ) : (
              <DiagramView contract={selectedContract} isLoading={loadingDiagram} analysisData={analysisDataForChildren} />
            )}
          </motion.div>
        );
      case 'documentation':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 rounded-lg p-6 min-h-[400px]"
          >
            {!selectedContract ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>Selecciona un contrato del dropdown superior para ver su documentación.</p>
              </div>
            ) : !hasDocumentation && !loadingDocumentation ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>La documentación de funciones no está disponible o no se pudo generar para este contrato.</p>
                <p className="text-sm mt-1">(La generación de documentación se inicia después de crear el contrato).</p>
              </div>
            ) : (
              <FunctionDocumentation contract={selectedContract} isLoading={loadingDocumentation} analysisData={analysisDataForChildren} />
            )}
          </motion.div>
        );
      case 'deploy':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <DeploymentView 
              contract={selectedContract} 
              onDeploymentSuccess={handleDeploymentSuccess}
            />
          </motion.div>
        );
      case 'interaction':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <ContractInteraction 
              contract={selectedContract}
              deployedAddress={deployedAddress}
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left Side: Navigation & Title */}
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">Generador de Contratos</h1>
          </div>
          
          {/* Center: Contract Selector Dropdown & Delete Button */}
          <div className="flex-1 flex justify-center items-center px-8 gap-2">
            <Select 
              value={selectedContractId || ""} 
              onValueChange={(value) => selectContract(value || null)}
              disabled={contracts.length === 0}
            >
              <SelectTrigger className="w-[350px] bg-gray-800 border-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue placeholder="No se han generado contratos" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {contracts.map((contract) => (
                  <SelectItem 
                    key={contract.id} 
                    value={contract.id}
                    className="hover:bg-gray-700 focus:bg-gray-700"
                  >
                    {contract.name} ({new Date(contract.createdAt).toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Delete Button with Confirmation Dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline"
                  size="icon" 
                  disabled={!selectedContractId} // Disable if no contract is selected
                  className="border-red-500/50 text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el contrato 
                    "{selectedContract?.name || 'seleccionado'}" de tu historial.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 border-gray-600">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteSelectedContract}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          {/* Right Side: Back Button */}
          <div>
            <Link to="/">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border-blue-500/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main Content - Split Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left Panel - Fixed */}
          <div className="space-y-6">
            {/* Chat Interface */}
            <AnimatedCard className="overflow-hidden p-0" delay={0.1}>
              <ChatInterface 
                 onLoadingStateChange={handleLoadingStates} 
               />
            </AnimatedCard>
          </div>
          
          {/* Right Panel - Dynamic Content */}
          <div className="space-y-6">
            {/* Progress Indicators */}
            <div className="flex items-center justify-between px-2">
              <motion.div 
                className={`flex flex-col items-center ${activeTab === 'code' ? 'text-blue-500' : 'text-gray-500'}`}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveTab('code')}
                style={{ cursor: 'pointer' }}
              >
                <div className={`rounded-full w-12 h-12 flex items-center justify-center ${
                  activeTab === 'code' 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-700/30' 
                    : 'bg-gray-800'
                } transition-all duration-300`}>
                  <FileCode className="h-5 w-5" />
                </div>
                <span className="mt-1 text-xs font-medium">Código</span>
              </motion.div>
              
              <div className="h-1 w-12 bg-gray-700"></div>
              
              <motion.div 
                className={`flex flex-col items-center ${activeTab === 'diagram' || activeTab === 'documentation' ? 'text-blue-500' : 'text-gray-500'}`}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveTab(activeTab === 'documentation' ? 'diagram' : 'documentation')}
                style={{ cursor: 'pointer' }}
              >
                <div className={`rounded-full w-12 h-12 flex items-center justify-center ${
                  activeTab === 'diagram' || activeTab === 'documentation' 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-700/30' 
                    : 'bg-gray-800'
                } transition-all duration-300`}>
                  <Book className="h-5 w-5" />
                </div>
                <span className="mt-1 text-xs font-medium">Docs</span>
              </motion.div>
              
              <div className="h-1 w-12 bg-gray-700"></div>
              
              <motion.div 
                className={`flex flex-col items-center ${activeTab === 'deploy' ? 'text-blue-500' : 'text-gray-500'}`}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveTab('deploy')}
                style={{ cursor: 'pointer' }}
              >
                <div className={`rounded-full w-12 h-12 flex items-center justify-center ${
                  activeTab === 'deploy' 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-700/30' 
                    : 'bg-gray-800'
                } transition-all duration-300`}>
                  <Cpu className="h-5 w-5" />
                </div>
                <span className="mt-1 text-xs font-medium">Deploy</span>
              </motion.div>
              
              <div className="h-1 w-12 bg-gray-700"></div>
              
              <motion.div 
                className={`flex flex-col items-center ${activeTab === 'interaction' ? 'text-blue-500' : 'text-gray-500'}`}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveTab('interaction')}
                style={{ cursor: 'pointer' }}
              >
                <div className={`rounded-full w-12 h-12 flex items-center justify-center ${
                  activeTab === 'interaction' 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-700/30' 
                    : 'bg-gray-800'
                } transition-all duration-300`}>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 17a2 2 0 100-4 2 2 0 000 4zM16 17a2 2 0 100-4 2 2 0 000 4z" />
                    <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" />
                    <path d="M16 10a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <span className="mt-1 text-xs font-medium">Interactuar</span>
              </motion.div>
            </div>
            
            {/* Tab Navigation */}
            <AnimatedCard className="p-0 overflow-hidden border-0" delay={0.3}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-gray-800/50 backdrop-blur-sm">
                  <TabsTrigger 
                    value="code" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700"
                  >
                    Código
                  </TabsTrigger>
                  <TabsTrigger 
                    value="diagram"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700"
                  >
                    Diagrama
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documentation"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700"
                  >
                    Funciones
                  </TabsTrigger>
                  <TabsTrigger 
                    value="deploy"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700"
                  >
                    Desplegar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="interaction"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700"
                  >
                    Interactuar
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab} className="m-0">
                  {renderRightPanel()}
                </TabsContent>
              </Tabs>
            </AnimatedCard>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ContractGenerator;