import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Contract } from "@/hooks/use-contract-storage";
import { useToast } from "@/hooks/use-toast";
import ReactConfetti from "react-confetti";
import { motion } from "framer-motion";
import { ethers } from "ethers";

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
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
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

  const handleDeploy = useCallback(async () => {
    if (!contract) return;

    setIsDeploying(true);
    setDeploymentError(null);

    if (typeof window.ethereum === "undefined") {
      setDeploymentError(
        "MetaMask is not installed. Please install MetaMask to deploy the contract."
      );
      setIsDeploying(false);
      return;
    }

    try {
      // Request account access if needed
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Connect to the provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Contract factory
      const factory = new ethers.ContractFactory(
        contract.abi,
        contract.bytecode,
        signer
      );

      // Deploy the contract
      const contractInstance = await factory.deploy();
      await contractInstance.deployed();

      setDeployedAddress(contractInstance.address);
      setDeploymentTxHash(contractInstance.deployTransaction.hash);
      setShowConfetti(true);

      if (onDeploymentSuccess) {
        onDeploymentSuccess(contractInstance.address);
      }

      toast({
        title: "Contract deployed successfully",
        description: `Contract has been deployed to ${contractInstance.address.slice(
          0,
          8
        )}...`,
      });

      setIsDeploying(false);
    } catch (error: any) {
      console.error("Deployment error:", error);
      setDeploymentError(
        `Deployment failed: ${error.message || "Unknown error"}`
      );
      setIsDeploying(false);
    }
  }, [contract, onDeploymentSuccess, toast]);

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Select a contract to deploy</p>
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

      <h2 className="text-2xl font-bold text-white">Contract Deployment</h2>
      <p className="text-gray-400">
        Deploy your smart contract to the Rootstock testnet.
      </p>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Deployment Configuration
          </CardTitle>
          <CardDescription>Contrato: {contract.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {!deployedAddress ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-900 rounded-md">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Deployment Information
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{contract.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bytecode Size:</span>
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
                      Deploying contract...
                    </>
                  ) : (
                    <>
                      Deploy to Rootstock Testnet
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
                  Contract deployed successfully
                </AlertTitle>
                <AlertDescription className="text-green-400">
                  Your contract has been deployed to the Rootstock testnet.
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-gray-900 rounded-md">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Deployment Information
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">
                      Contract Address:
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
                        Transaction Hash:
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
                  View on Explorer
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
