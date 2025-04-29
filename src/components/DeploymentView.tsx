import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Contract } from '@/hooks/use-contract-storage';
import { useToast } from '@/hooks/use-toast';
import ReactConfetti from 'react-confetti';
import { motion } from 'framer-motion';

interface DeploymentViewProps {
  contract: Contract | null;
  onDeploymentSuccess?: (deployedAddress: string) => void;
}

const DeploymentView = ({
  contract,
  onDeploymentSuccess,
}: DeploymentViewProps) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [deploymentTxHash, setDeploymentTxHash] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });
  const { toast } = useToast();

  // Update window dimensions when the component mounts
  useEffect(() => {
    const updateDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Hide confetti after 5 seconds
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const handleDeploy = async () => {
    if (!contract) return;

    setIsDeploying(true);
    setDeploymentError(null);

    try {
      // Simulación de despliegue - En una implementación real, esto sería una llamada a Web3/ethers.js
      setTimeout(() => {
        // Simular una dirección de contrato desplegado y un hash de transacción
        const mockAddress = '0x' + Math.random().toString(16).slice(2, 42);
        const mockTxHash = '0x' + Math.random().toString(16).slice(2, 66);

        setDeployedAddress(mockAddress);
        setDeploymentTxHash(mockTxHash);
        setShowConfetti(true);

        if (onDeploymentSuccess) {
          onDeploymentSuccess(mockAddress);
        }

        toast({
          title: 'Contrato desplegado correctamente',
          description: `El contrato ha sido desplegado en la dirección ${mockAddress.slice(0, 8)}...`,
        });

        setIsDeploying(false);
      }, 3000);
    } catch (error) {
      setDeploymentError(
        'Error al desplegar el contrato. Por favor, inténtelo de nuevo.'
      );
      setIsDeploying(false);
    }
  };

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Selecciona un contrato para desplegar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showConfetti && (
        <ReactConfetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
        />
      )}

      <h2 className="text-2xl font-bold text-white">Despliegue de Contrato</h2>
      <p className="text-gray-400">
        Despliega tu contrato inteligente en la testnet de Rootstock.
      </p>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Configuración de Despliegue
          </CardTitle>
          <CardDescription>Contrato: {contract.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {!deployedAddress ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-900 rounded-md">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Información del Contrato
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nombre:</span>
                    <span className="text-white">{contract.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tamaño del Bytecode:</span>
                    <span className="text-white">
                      {Math.floor(contract.bytecode.length / 2)} bytes
                    </span>
                  </div>
                </div>
              </div>

              {deploymentError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{deploymentError}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 border-none"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Desplegando contrato...
                    </>
                  ) : (
                    <>
                      Desplegar a Rootstock Testnet
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Alert className="bg-green-900/20 border-green-800">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                <AlertTitle className="text-green-500">
                  Contrato desplegado correctamente
                </AlertTitle>
                <AlertDescription className="text-green-400">
                  Tu contrato ha sido desplegado en la testnet de Rootstock.
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-gray-900 rounded-md">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Información del Despliegue
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">
                      Dirección del Contrato:
                    </span>
                    <motion.span
                      className="text-green-400 font-mono"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {deployedAddress}
                    </motion.span>
                  </div>
                  {deploymentTxHash && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">
                        Hash de Transacción:
                      </span>
                      <motion.span
                        className="text-blue-400 font-mono"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {deploymentTxHash}
                      </motion.span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `https://explorer.testnet.rsk.co/address/${deployedAddress}`,
                      '_blank'
                    )
                  }
                  className="bg-purple-900/20 border-purple-700 text-purple-300 hover:bg-purple-800/30"
                >
                  Ver en Explorador
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentView;
