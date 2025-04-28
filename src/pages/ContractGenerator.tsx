import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatInterface from '@/components/ChatInterface';
import { ArrowLeft, Home, FileCode, Cpu, Book, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import ContractHistoryList from '@/components/ContractHistoryList';
import ContractDetailsViewer from '@/components/ContractDetailsViewer';
import useContractStorage from '@/hooks/use-contract-storage';
import DiagramView from '@/components/DiagramView';
import DeploymentView from '@/components/DeploymentView';
import ContractInteraction from '@/components/ContractInteraction';
import FunctionDocumentation from '@/components/FunctionDocumentation';
import AnimatedCard from '@/components/ui/animated-card';

const ContractGenerator = () => {
  const [activeTab, setActiveTab] = useState('code');
  const { contracts, getContract, deleteContract } = useContractStorage();
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const selectedContract = selectedContractId ? getContract(selectedContractId) : null;

  const handleViewContract = (contractId: string) => {
    setSelectedContractId(contractId);
  };

  const handleDeleteContract = (contractId: string) => {
    deleteContract(contractId);
    if (selectedContractId === contractId) {
      setSelectedContractId(null);
    }
  };

  const handleDeploymentSuccess = (address: string) => {
    setDeployedAddress(address);
    setActiveTab('interaction');
  };

  // Función para renderizar el panel derecho según la pestaña activa
  const renderRightPanel = () => {
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
            <ContractDetailsViewer contract={selectedContract} />
          </motion.div>
        );
      case 'diagram':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <DiagramView contract={selectedContract} />
          </motion.div>
        );
      case 'documentation':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <FunctionDocumentation contract={selectedContract} />
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
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">Generador de Contratos Inteligentes</h1>
          </div>
          
          <div>
            <Link to="/">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border-blue-500/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Landing
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
              <ChatInterface />
            </AnimatedCard>
            
            {/* Contract History */}
            <AnimatedCard className="p-4" delay={0.2}>
              <div className="flex items-center mb-4">
                <LayoutGrid className="h-5 w-5 mr-2 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Historial de Contratos</h3>
              </div>
              <ContractHistoryList 
                contracts={contracts}
                onViewContract={handleViewContract}
                onDeleteContract={handleDeleteContract}
                selectedContractId={selectedContractId}
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