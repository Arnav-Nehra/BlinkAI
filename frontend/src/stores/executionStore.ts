import { create } from 'zustand';
import { Execution } from '@/types/execution';

interface ExecutionStore {
  executionList: Execution[];
  setExecutionList: (executions: Execution[]) => void;
  addExecution: (execution: Execution) => void;
  updateExecution: (id: string, updates: Partial<Execution>) => void;
  removeExecution: (id: string) => void;
  clearExecutions: () => void;
}

export const useExecutionStore = create<ExecutionStore>((set) => ({
  executionList: [],
  
  setExecutionList: (executions) => set({ executionList: executions }),
  
  addExecution: (execution) => 
    set((state) => ({ 
      executionList: [...state.executionList, execution] 
    })),
  
  updateExecution: (id, updates) =>
    set((state) => ({
      executionList: state.executionList.map((execution) =>
        execution.id === id ? { ...execution, ...updates } : execution
      ),
    })),
  
  removeExecution: (id) =>
    set((state) => ({
      executionList: state.executionList.filter((execution) => execution.id !== id),
    })),
  
  clearExecutions: () => set({ executionList: [] }),
}));
