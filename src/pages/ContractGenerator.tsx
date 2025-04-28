import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatInterface from '@/components/ChatInterface';
import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const ContractGenerator = () => {
  const [activeTab, setActiveTab] = useState('generator');

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">Generador de Contratos Inteligentes</h1>
          </div>
          
          <div>
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Landing
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="generator" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="generator">Generador de Contratos</TabsTrigger>
            <TabsTrigger value="history">Historial de Contratos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator" className="mt-0">
            <ChatInterface />
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
            <div className="bg-gray-900 rounded-lg p-8 text-center">
              <h3 className="text-xl font-bold text-white mb-4">Historial de Contratos</h3>
              <p className="text-gray-400 mb-6">Aquí podrás ver todos los contratos que has generado anteriormente.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Placeholder para contratos generados anteriormente */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-medium text-white mb-2">RootstockToken (ERC20)</h4>
                  <p className="text-sm text-gray-400 mb-4">Generado el 28/04/2025</p>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('generator')}>
                      Ver Contrato
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
};

export default ContractGenerator;