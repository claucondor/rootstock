import { useState, useEffect } from 'react';

export interface Contract {
  id: string;
  name: string;
  description: string;
  sourceCode: string;
  abi: string;
  bytecode: string;
  createdAt: string;
  lastUpdatedAt: string;
  analysis?: string;
}

export interface UseContractStorageReturnType {
  contracts: Contract[];
  getContract: (id: string) => Contract | undefined;
  saveContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'lastUpdatedAt'> & { id?: string }) => Contract;
  updateContract: (id: string, updates: Partial<Omit<Contract, 'id' | 'createdAt' | 'lastUpdatedAt'>>) => Contract | undefined;
  deleteContract: (id: string) => void;
}

const STORAGE_KEY = 'rootstock_contracts';

const useContractStorage = (): UseContractStorageReturnType => {
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Load contracts from localStorage on mount
  useEffect(() => {
    try {
      const storedContracts = localStorage.getItem(STORAGE_KEY);
      if (storedContracts) {
        setContracts(JSON.parse(storedContracts));
      }
    } catch (error) {
      console.error('Error loading contracts from localStorage:', error);
    }
  }, []);

  // Save contracts to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
    } catch (error) {
      console.error('Error saving contracts to localStorage:', error);
    }
  }, [contracts]);

  const getContract = (id: string): Contract | undefined => {
    return contracts.find(contract => contract.id === id);
  };

  const saveContract = (contract: Omit<Contract, 'id' | 'createdAt' | 'lastUpdatedAt'> & { id?: string }): Contract => {
    const now = new Date().toISOString();
    const newContract: Contract = {
      ...contract,
      id: contract.id || `contract_${Date.now()}`,
      createdAt: now,
      lastUpdatedAt: now,
    };

    setContracts(prev => [newContract, ...prev]);
    return newContract;
  };

  const updateContract = (id: string, updates: Partial<Omit<Contract, 'id' | 'createdAt' | 'lastUpdatedAt'>>): Contract | undefined => {
    let updatedContract: Contract | undefined;

    setContracts(prev => {
      const updated = prev.map(contract => {
        if (contract.id === id) {
          updatedContract = {
            ...contract,
            ...updates,
            lastUpdatedAt: new Date().toISOString(),
          };
          return updatedContract;
        }
        return contract;
      });
      return updated;
    });

    return updatedContract;
  };

  const deleteContract = (id: string): void => {
    setContracts(prev => prev.filter(contract => contract.id !== id));
  };

  return {
    contracts,
    getContract,
    saveContract,
    updateContract,
    deleteContract,
  };
};

export default useContractStorage; 