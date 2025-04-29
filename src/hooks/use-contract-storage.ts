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
  selectedContractId: string | null;
  selectedContract: Contract | undefined;
  getContract: (id: string) => Contract | undefined;
  saveContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'lastUpdatedAt'> & { id?: string }) => Contract;
  updateContract: (id: string, updates: Partial<Omit<Contract, 'id' | 'createdAt' | 'lastUpdatedAt'>>) => Contract | undefined;
  deleteContract: (id: string) => void;
  selectContract: (id: string | null) => void;
}

const STORAGE_KEY = 'rootstock_contracts';
const SELECTED_CONTRACT_KEY = 'rootstock_selected_contract';

const useContractStorage = (): UseContractStorageReturnType => {
  const [contracts, setContracts] = useState<Contract[]>(() => {
    try {
      const storedContracts = localStorage.getItem(STORAGE_KEY);
      return storedContracts ? JSON.parse(storedContracts) : [];
    } catch (error) {
      console.error('Error loading contracts from localStorage:', error);
      return [];
    }
  });

  const [selectedContractId, setSelectedContractId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SELECTED_CONTRACT_KEY);
    } catch (error) {
      console.error('Error loading selected contract from localStorage:', error);
      return null;
    }
  });

  // Persist contracts to localStorage
  useEffect(() => {
    try {
      console.log('[Effect] Saving contracts to localStorage:', contracts);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
    } catch (error) {
      console.error('[Effect] Error saving contracts to localStorage:', error);
      // Consider showing a toast notification to the user here
    }
  }, [contracts]);

  // Persist selected contract to localStorage
  useEffect(() => {
    try {
      if (selectedContractId) {
        console.log('[Effect] Saving selectedContractId to localStorage:', selectedContractId);
        localStorage.setItem(SELECTED_CONTRACT_KEY, selectedContractId);
      } else {
        console.log('[Effect] Removing selectedContractId from localStorage');
        localStorage.removeItem(SELECTED_CONTRACT_KEY);
      }
    } catch (error) {
      console.error('[Effect] Error saving selected contract ID to localStorage:', error);
       // Consider showing a toast notification to the user here
    }
  }, [selectedContractId]);

  const getContract = (id: string): Contract | undefined => {
    return contracts.find(contract => contract.id === id);
  };

  const selectedContract = selectedContractId ? getContract(selectedContractId) : undefined;

  const saveContract = (contract: Omit<Contract, 'id' | 'createdAt' | 'lastUpdatedAt'> & { id?: string }): Contract => {
    const now = new Date().toISOString();
    const newContract: Contract = {
      ...contract,
      id: contract.id || `contract_${Date.now()}`,
      createdAt: now,
      lastUpdatedAt: now,
    };

    setContracts(prev => [newContract, ...prev]);
    setSelectedContractId(newContract.id); // Auto-select the new contract
    return newContract;
  };

  const updateContract = (id: string, updates: Partial<Omit<Contract, 'id' | 'createdAt' | 'lastUpdatedAt'>>): Contract | undefined => {
    let updatedContract: Contract | undefined;

    setContracts(prev => {
      return prev.map(contract => {
        if (contract.id === id) {
          let mergedAnalysis = contract.analysis; // Start with existing analysis

          // If the update includes analysis data, merge it intelligently
          if (updates.analysis) {
            try {
              const existingAnalysisData = contract.analysis ? JSON.parse(contract.analysis) : {};
              const newAnalysisData = JSON.parse(updates.analysis); // Assume updates.analysis is a JSON string containing the *new part*
              // Merge new data into existing data
              const mergedData = { ...existingAnalysisData, ...newAnalysisData };
              mergedAnalysis = JSON.stringify(mergedData);
            } catch (e) {
              console.error("Error merging analysis data:", e);
              // Keep original analysis if merging fails
            }
          }
          
          updatedContract = {
            ...contract,
            ...updates, // Apply other updates
            analysis: mergedAnalysis, // Use the potentially merged analysis
            lastUpdatedAt: new Date().toISOString(),
          };
          return updatedContract;
        }
        return contract;
      });
    });

    // Ensure the component consuming the hook re-renders with the updated contract object
    // This might require forcing a re-fetch or ensuring dependencies are correct where selectedContract is used.
    // However, the state update in setContracts should trigger re-renders in consumers.

    return updatedContract;
  };

  const deleteContract = (id: string): void => {
    let nextSelectedId: string | null = null;
    let wasSelectedDeleted = false;

    setContracts(prev => {
      const contractToDeleteIndex = prev.findIndex(c => c.id === id);
      if (contractToDeleteIndex === -1) return prev;

      wasSelectedDeleted = prev[contractToDeleteIndex].id === selectedContractId;
      const updatedContracts = prev.filter(contract => contract.id !== id);

      if (wasSelectedDeleted && updatedContracts.length > 0) {
        const nextIndex = Math.min(contractToDeleteIndex, updatedContracts.length - 1);
        nextSelectedId = updatedContracts[nextIndex].id;
      }
      
      console.log(`[Delete] Deleting ${id}. New contract list length: ${updatedContracts.length}. Next selected ID: ${nextSelectedId}`);
      return updatedContracts;
    });
    
    // Update selection outside of setContracts
    if (wasSelectedDeleted) {
       console.log(`[Delete] Setting selected ID to: ${nextSelectedId}`);
       setSelectedContractId(nextSelectedId); 
    }
  };

  const selectContract = (id: string | null): void => {
    setSelectedContractId(id);
  };

  return {
    contracts,
    selectedContractId,
    selectedContract,
    getContract,
    saveContract,
    updateContract,
    deleteContract,
    selectContract,
  };
};

export default useContractStorage; 