declare module 'solc' {
  interface CompilerInput {
    language: string;
    sources: {
      [fileName: string]: {
        content: string;
      };
    };
    settings: {
      outputSelection: {
        [fileName: string]: {
          [contractName: string]: string[];
        };
      };
      optimizer?: {
        enabled?: boolean;
        runs?: number;
      };
      evmVersion?: string;
      libraries?: {
        [fileName: string]: {
          [libName: string]: string;
        };
      };
    };
  }

  interface CompilerOutput {
    contracts: {
      [fileName: string]: {
        [contractName: string]: {
          abi: any[];
          evm: {
            bytecode: {
              object: string;
              opcodes?: string;
              sourceMap?: string;
              linkReferences?: any;
            };
          };
        };
      };
    };
    sources: {
      [fileName: string]: {
        id: number;
        ast: any;
      };
    };
    errors?: Array<{
      severity: 'error' | 'warning' | 'info';
      formattedMessage?: string;
      message: string;
      type?: string;
      sourceLocation?: {
        file: string;
        start: number;
        end: number;
      };
    }>;
  }

  interface CompilerSettings {
    version: string;
    settings: any;
  }

  function compile(
    input: string,
    readCallback?: (path: string) => { contents: string; error: string }
  ): string;
  function setupMethods(soljson: any): any;
  function loadRemoteVersion(
    version: string,
    callback: (err: Error | null, solc: any) => void
  ): void;
}
