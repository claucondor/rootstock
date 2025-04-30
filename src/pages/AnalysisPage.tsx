'use client'; // Required for client-side Mermaid rendering

import React, { useState, useEffect } from 'react';
import MermaidDiagram from '../components/MermaidDiagram';
// Assume ContractAnalysisOutput is correctly typed and imported/shared
// If not shared, you might need to copy/redefine the type here
import type { ContractAnalysisOutput } from '../../backend/src/internal/contract-analyzer/types'; // Adjusted path based on search

// --- Removed Placeholder API fetching function ---
// async function fetchContractAnalysis(source: string, abi: any[]): Promise<ContractAnalysisOutput> { ... }

const AnalysisPage: React.FC = () => {
    const [analysisResult, setAnalysisResult] = useState<ContractAnalysisOutput | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
    const [error, setError] = useState<string | null>(null);

    // --- Load analysis from Local Storage ---
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        try {
            console.log("Attempting to load analysis from local storage...");
            const storedAbiString = localStorage.getItem('abi');
            const storedAnalysisString = localStorage.getItem('analysis');

            if (!storedAnalysisString) {
                throw new Error("Analysis data not found in local storage.");
            }
            if (!storedAbiString) {
                console.warn("ABI data not found in local storage, proceeding with analysis only.");
                // Depending on requirements, you might want to throw an error here too
            }

            console.log("Raw ABI string from localStorage:", storedAbiString?.substring(0, 100) + '...');
            console.log("Raw Analysis string from localStorage:", storedAnalysisString?.substring(0, 100) + '...');

            // Attempt to parse the analysis data
            const parsedAnalysis = JSON.parse(storedAnalysisString) as ContractAnalysisOutput; // Assume structure matches

            // Optional: Parse ABI if needed by the component later
            // const parsedAbi = storedAbiString ? JSON.parse(storedAbiString) : null;

            // Basic validation of parsed data (can be expanded)
            if (!parsedAnalysis || typeof parsedAnalysis !== 'object') {
                 throw new Error("Invalid analysis data structure after parsing.");
            }
             if (!parsedAnalysis.diagramData) {
                console.warn("Parsed analysis data is missing 'diagramData'.");
                // Depending on requirements, you might want to throw an error or handle differently
            }
             if (!parsedAnalysis.functionAnalyses) {
                console.warn("Parsed analysis data is missing 'functionAnalyses'.");
                 // Depending on requirements, you might want to throw an error or handle differently
            }

            // Normalizar los diagramas para asegurar que se rendericen correctamente
            if (parsedAnalysis.diagramData?.generalDiagram?.mermaidCode) {
                console.log("General diagram found, length:", parsedAnalysis.diagramData.generalDiagram.mermaidCode.length);
                // Normalizar el código mermaid para asegurarse de que sea válido
                const normalizedCode = normalizeMermaidCode(parsedAnalysis.diagramData.generalDiagram.mermaidCode);
                parsedAnalysis.diagramData.generalDiagram.mermaidCode = normalizedCode;
            } else {
                console.warn("No general diagram found in the analysis data");
            }

            // Normalizar también los diagramas de funciones
            if (parsedAnalysis.diagramData?.functionDiagrams) {
                console.log("Function diagrams found:", Object.keys(parsedAnalysis.diagramData.functionDiagrams).length);
                Object.entries(parsedAnalysis.diagramData.functionDiagrams).forEach(([funcName, diagram]) => {
                    if (diagram && diagram.mermaidCode) {
                        // Normalizar cada diagrama de función
                        const normalizedCode = normalizeMermaidCode(diagram.mermaidCode);
                        parsedAnalysis.diagramData.functionDiagrams[funcName].mermaidCode = normalizedCode;
                    }
                });
            }

            console.log("Successfully normalized and prepared analysis data");
            setAnalysisResult(parsedAnalysis);

        } catch (err) {
            console.error("Error loading or parsing data from local storage:", err);
            setError(err instanceof Error ? `Error loading analysis: ${err.message}` : 'An unknown error occurred while loading analysis.');
            setAnalysisResult(null); // Clear previous results on error
        } finally {
            setIsLoading(false); // Stop loading regardless of outcome
        }
    }, []); // Run only once on component mount
    // --- End Local Storage Loading ---

    // Función para normalizar el código de Mermaid
    const normalizeMermaidCode = (code: string): string => {
        if (!code) return '';

        // Eliminar espacios en blanco adicionales y caracteres extraños
        let normalized = code.trim();

        // Asegurarse de que el diagrama comienza con una declaración de tipo válida
        const validTypes = ['sequenceDiagram', 'flowchart', 'graph', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie'];
        const hasValidStart = validTypes.some(type => normalized.startsWith(type));
        
        if (!hasValidStart) {
            console.warn('Diagram does not start with a valid type declaration:', normalized.substring(0, 50) + '...');
        }

        // Reemplazar caracteres de escape que podrían causar problemas
        normalized = normalized
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\t/g, '    ');

        return normalized;
    };

    // --- Basic Accordion State (Replace with your UI library if available) ---
    const [openAccordion, setOpenAccordion] = useState<string | null>(null); // Keep track of which section is open
    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };
    // --- End Accordion State ---

    return (
        <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
            <h1>Contract Analysis</h1>

            {isLoading && <p>Loading analysis from local storage...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {analysisResult && (
                <div>
                    {/* Section for General Diagram - Now Collapsible */}
                    {analysisResult.diagramData?.generalDiagram ? ( // Check if generalDiagram exists
                        <div style={{ marginBottom: '30px', border: '1px solid #ccc', borderRadius: '5px' }}>
                            {/* Accordion Header for General Diagram */}
                            <button
                                onClick={() => toggleAccordion('general-diagram')} // Unique ID for this accordion item
                                style={{
                                    width: '100%', textAlign: 'left', padding: '10px',
                                    border: 'none', background: '#f0f0f0', cursor: 'pointer',
                                    fontWeight: 'bold', fontSize: '1.1em',
                                    borderRadius: openAccordion === 'general-diagram' ? '5px 5px 0 0' : '5px' // Adjust radius based on open state
                                }}
                            >
                                General Contract Flow {openAccordion === 'general-diagram' ? '−' : '+'} {/* Use minus sign for open */}
                            </button>

                            {/* Accordion Content for General Diagram */}
                            {openAccordion === 'general-diagram' && (
                                <div style={{ padding: '15px', borderTop: '1px solid #eee' }}> {/* Content area */}
                                    <p>{analysisResult.diagramData.generalDiagram.explanation}</p>
                                    <div style={{ marginTop: '15px', border: '1px dashed #eee', padding: '10px', background: '#fff' }}> {/* Added white background for diagram visibility */}
                                        <MermaidDiagram chart={analysisResult.diagramData.generalDiagram.mermaidCode} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                         <p>No general diagram data available.</p> // Message if no general diagram
                    )}

                    {/* Section for Function Details and Diagrams */}
                     {analysisResult.functionAnalyses && Object.keys(analysisResult.functionAnalyses).length > 0 ? (
                        <> {/* Use Fragment */}
                            <h2>Function Details & Diagrams</h2>
                            {Object.entries(analysisResult.functionAnalyses).map(([funcName, funcDetails]) => {
                                // Skip if it's just an error marker from the backend or invalid detail
                                if (funcName === 'error' || !funcDetails || typeof funcDetails !== 'object') return null;

                                // Check safely for diagram data for this function
                                const funcDiagram = analysisResult.diagramData?.functionDiagrams?.[funcName];
                                const accordionId = `func-${funcName}`;
                                const isOpen = openAccordion === accordionId;

                                // Define an expected type for funcDetails for clarity and type safety within this map
                                type ExpectedFuncDetails = {
                                    description?: string;
                                    example?: string;
                                    security?: Array<{ type?: string; message?: string }>;
                                    source?: string;
                                };

                                const details = funcDetails as ExpectedFuncDetails;

                                return (
                                    <div key={funcName} style={{ marginBottom: '15px', border: '1px solid #eee', borderRadius: '4px' }}>
                                        {/* Accordion Header for Function */}
                                        <button
                                            onClick={() => toggleAccordion(accordionId)}
                                            style={{
                                                width: '100%', textAlign: 'left', padding: '10px',
                                                border: 'none', background: '#f0f0f0', cursor: 'pointer',
                                                fontWeight: 'bold', fontSize: '1.1em',
                                                borderRadius: isOpen ? '4px 4px 0 0' : '4px' // Adjust radius
                                            }}
                                        >
                                            {funcName} {isOpen ? '−' : '+'} {/* Use minus sign */}
                                        </button>

                                        {/* Accordion Content for Function */}
                                        {isOpen && (
                                            <div style={{ padding: '15px', borderTop: '1px solid #eee' }}>
                                                {/* Display Function Analysis Details */}
                                                <p><strong>Description:</strong> {details.description || 'N/A'}</p>
                                                {details.example && (
                                                    <div><strong>Example Usage (JS):</strong> <pre style={{ background: '#f9f9f9', padding: '5px', borderRadius: '3px', overflowX: 'auto' }}><code>{details.example}</code></pre></div>
                                                )}
                                                {details.security && details.security.length > 0 && (
                                                    <div>
                                                        <strong>Security Notes:</strong>
                                                        <ul>
                                                            {details.security.map((note, index) => (
                                                                <li key={index}>[{note.type?.toUpperCase() || 'NOTE'}]: {note.message || 'No message.'}</li> // Added null checks
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {details.source && (
                                                    <div><strong>Source Code:</strong> <pre style={{ background: '#f9f9f9', padding: '5px', borderRadius: '3px', overflowX: 'auto' }}><code>{details.source}</code></pre></div>
                                                )}

                                                {/* Display Function-Specific Diagram */}
                                                {funcDiagram ? ( // Check if diagram exists
                                                    <div style={{ marginTop: '20px' }}>
                                                        <h3>Function Flow Diagram</h3>
                                                        <p>{funcDiagram.explanation || 'No explanation provided.'}</p>
                                                        <div style={{ border: '1px dashed #eee', padding: '10px', marginTop: '10px', background: '#fff' }}> {/* Added white background */}
                                                            <MermaidDiagram chart={funcDiagram.mermaidCode} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                     <p style={{ fontStyle: 'italic', marginTop:'15px' }}>No specific diagram available for this function.</p> // Message if no diagram
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                         </>
                    ) : (
                        <p>No function details available.</p> // Message if no function analyses
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalysisPage; 