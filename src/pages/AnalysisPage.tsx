'use client'; // Required for client-side Mermaid rendering

import React, { useState, useEffect } from 'react';
import MermaidDiagram from '../components/MermaidDiagram';
// Assume ContractAnalysisOutput is correctly typed and imported/shared
// If not shared, you might need to copy/redefine the type here
import type { ContractAnalysisOutput } from '../../../backend/src/internal/contract-analyzer/types'; // Adjust path as needed

// --- Placeholder for your API fetching function ---
async function fetchContractAnalysis(source: string, abi: any[]): Promise<ContractAnalysisOutput> {
    // Replace with your actual API call
    console.log('Fetching analysis for:', { source, abi });
    const response = await fetch('/api/analyze', { // Replace with your actual endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, abi }),
    });
    if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error(`Analysis failed: ${response.statusText}`);
    }
    return response.json();
}
// --- End Placeholder ---

const AnalysisPage: React.FC = () => {
    const [analysisResult, setAnalysisResult] = useState<ContractAnalysisOutput | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // --- Placeholder: Trigger analysis fetch ---
    // Replace this with your actual logic to get source/ABI and trigger fetch
    // For example, on component mount or after a user action
    useEffect(() => {
        const exampleSource = 'contract HelloWorld { function greet() public pure returns (string memory) { return "Hello World!"; } }';
        const exampleAbi = [{ "inputs": [], "name": "greet", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "pure", "type": "function" }];

        const loadAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await fetchContractAnalysis(exampleSource, exampleAbi);
                setAnalysisResult(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                setAnalysisResult(null); // Clear previous results on error
            } finally {
                setIsLoading(false);
            }
        };

        loadAnalysis();
    }, []);
    // --- End Placeholder ---

    // --- Basic Accordion State (Replace with your UI library if available) ---
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };
    // --- End Accordion State ---

    return (
        <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
            <h1>Contract Analysis</h1>

            {/* Add controls here to trigger analysis if not done on mount */}

            {isLoading && <p>Loading analysis...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {analysisResult && (
                <div>
                    {/* Section for General Diagram */}
                    {analysisResult.diagramData.generalDiagram && (
                        <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
                            <h2>General Contract Flow</h2>
                            <p>{analysisResult.diagramData.generalDiagram.explanation}</p>
                            <div style={{ marginTop: '15px', border: '1px dashed #eee', padding: '10px' }}>
                                <MermaidDiagram chart={analysisResult.diagramData.generalDiagram.mermaidCode} />
                            </div>
                        </div>
                    )}

                    {/* Section for Function Details and Diagrams */}
                    <h2>Function Details & Diagrams</h2>
                    {Object.keys(analysisResult.functionAnalyses).length > 0 ? (
                        Object.entries(analysisResult.functionAnalyses).map(([funcName, funcDetails]) => {
                            // Skip if it's just an error marker from the backend
                            if (funcName === 'error') return null;

                            const funcDiagram = analysisResult.diagramData.functionDiagrams[funcName];
                            const accordionId = `func-${funcName}`;
                            const isOpen = openAccordion === accordionId;

                            return (
                                <div key={funcName} style={{ marginBottom: '15px', border: '1px solid #eee', borderRadius: '4px' }}>
                                    {/* Basic Accordion Header (Replace with UI lib) */}
                                    <button
                                        onClick={() => toggleAccordion(accordionId)}
                                        style={{
                                            width: '100%', textAlign: 'left', padding: '10px',
                                            border: 'none', background: '#f0f0f0', cursor: 'pointer',
                                            fontWeight: 'bold', fontSize: '1.1em'
                                        }}
                                    >
                                        {funcName} {isOpen ? '-' : '+'}
                                    </button>

                                    {/* Basic Accordion Content (Replace with UI lib) */}
                                    {isOpen && (
                                        <div style={{ padding: '15px' }}>
                                            {/* Display Function Analysis Details */}
                                            <p><strong>Description:</strong> {funcDetails.description}</p>
                                            {funcDetails.example && (
                                                <div><strong>Example Usage (JS):</strong> <pre style={{ background: '#f9f9f9', padding: '5px', borderRadius: '3px', overflowX: 'auto' }}><code>{funcDetails.example}</code></pre></div>
                                            )}
                                            {funcDetails.security && funcDetails.security.length > 0 && (
                                                <div>
                                                    <strong>Security Notes:</strong>
                                                    <ul>
                                                        {funcDetails.security.map((note, index) => (
                                                            <li key={index}>[{note.type.toUpperCase()}]: {note.message}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                             {funcDetails.source && (
                                                <div><strong>Source Code:</strong> <pre style={{ background: '#f9f9f9', padding: '5px', borderRadius: '3px', overflowX: 'auto' }}><code>{funcDetails.source}</code></pre></div>
                                            )}

                                            {/* Display Function-Specific Diagram */}
                                            {funcDiagram && (
                                                <div style={{ marginTop: '20px' }}>
                                                    <h3>Function Flow Diagram</h3>
                                                    <p>{funcDiagram.explanation}</p>
                                                    <div style={{ border: '1px dashed #eee', padding: '10px', marginTop: '10px' }}>
                                                        <MermaidDiagram chart={funcDiagram.mermaidCode} />
                                                    </div>
                                                </div>
                                            )}
                                            {!funcDiagram && analysisResult.diagramData.functionDiagrams.hasOwnProperty(funcName) && (
                                                <p style={{ fontStyle: 'italic', marginTop:'15px' }}>Diagram could not be generated or validated for this function.</p>
                                            )}
                                             {!analysisResult.diagramData.functionDiagrams.hasOwnProperty(funcName) && (
                                                <p style={{ fontStyle: 'italic', marginTop:'15px' }}>LLM did not select this function for diagram generation.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p>No function details available.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalysisPage; 