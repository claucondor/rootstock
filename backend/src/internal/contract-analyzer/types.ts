/**
 * Defines the structure for a single, validated diagram item.
 */
export interface DiagramItem {
  mermaidCode: string;
  explanation: string;
}

/**
 * Defines the structure for the overall analysis result, including
 * validated diagrams.
 */
export interface AnalysisResult {
  generalDiagram: DiagramItem | null; // Null if validation/correction failed
  functionDiagrams: {
    [functionName: string]: DiagramItem; // Only includes validated diagrams
  };
}

/**
 * Interface for details about a single analyzed function (from original implementation).
 */
export interface AnalyzedFunctionDetails {
  description: string;
  source?: string; // Make optional as extraction might fail
  example?: string; // Make optional as generation might fail
  security?: Array<{
    // Make optional as generation might fail
    type: 'warning' | 'info' | 'error';
    message: string;
  }>;
}

/**
 * Interface for the complete function analysis result (from original implementation).
 */
export interface FunctionAnalyses {
  [functionName: string]: AnalyzedFunctionDetails;
}

/**
 * The combined output of the ContractAnalyzerService, including function details
 * and diagram analysis.
 */
export interface ContractAnalysisOutput {
  functionAnalyses: FunctionAnalyses;
  diagramData: AnalysisResult; // Updated to use the new AnalysisResult interface
}

/**
 * Represents the raw JSON structure expected from the LLM for diagram generation.
 * Used internally before validation and correction.
 */
export interface RawDiagramOutput {
  generalDiagram: DiagramItem;
  functionDiagrams: {
    [functionName: string]: DiagramItem;
  };
} 