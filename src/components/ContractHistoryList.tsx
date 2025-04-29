import React from 'react';
import { Button } from '@/components/ui/button';
import { Contract } from '@/hooks/use-contract-storage';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Code, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContractHistoryListProps {
  contracts: Contract[];
  onViewContract: (contractId: string) => void;
  onDeleteContract: (contractId: string) => void;
}

const ContractHistoryList: React.FC<ContractHistoryListProps> = ({
  contracts,
  onViewContract,
  onDeleteContract,
}) => {
  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <Code className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          No hay contratos guardados
        </h3>
        <p className="text-gray-400">
          Los contratos que generes aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
      {contracts.map((contract, index) => (
        <motion.div
          key={contract.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card
            className={`bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-white truncate">
                {contract.name}
              </CardTitle>
              <CardDescription className="text-gray-400">
                Creado{' '}
                {formatDistanceToNow(new Date(contract.createdAt), {
                  addSuffix: true,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-gray-300 line-clamp-2">
                {contract.description}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewContract(contract.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Contrato
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteContract(contract.id)}
                className="text-gray-400 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ContractHistoryList;
