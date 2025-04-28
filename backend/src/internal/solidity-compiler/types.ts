/**
 * Interface for compilation errors and warnings
 */
export interface CompilationError {
  severity: string;
  message: string;
  formattedMessage?: string;
}

/**
 * Interface for compilation output
 */
export interface CompilationOutput {
  errors?: CompilationError[];
  warnings?: CompilationError[];
  abi?: any;
  bytecode?: string;
  functionDescriptions?: Record<string, string>;
  diagramData?: {
    nodes: any[];
    edges: any[];
    explanation: string;
  };
}