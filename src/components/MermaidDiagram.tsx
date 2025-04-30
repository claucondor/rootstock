'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string; // The Mermaid code string
}

/**
 * A component to render Mermaid diagrams using the mermaid library directly.
 * This provides better control and error handling than using wrapper libraries.
 */
const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [sanitizedChartForError, setSanitizedChartForError] = useState<string>('');
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!chart || typeof chart !== 'string') {
        console.error('No chart data provided or chart is not a string');
        setError('No chart data available.');
        setSvg('');
        setSanitizedChartForError('');
        return;
      }
      if (!initializedRef.current) {
        console.log('Mermaid not initialized yet.');
        return;
      }

      setError(null);
      setSvg('');
      setSanitizedChartForError('');

      try {
        // --- START Simplified Sanitization ---
        
        // 1. Basic Cleanup
        let cleanChart = chart.trim();
        cleanChart = cleanChart.replace(/\r\n/g, '\n'); // Normalize line endings
        console.log(`[Sanitizer] Original chart length: ${cleanChart.length}`);

        // 2. Split into sections and validate structure
        const lines = cleanChart.split('\n');
        const sections = {
          header: [],
          participants: [],
          content: []
        };

        let currentSection = 'header';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          // Header section
          if (trimmedLine === 'sequenceDiagram') {
            sections.header.push(trimmedLine);
            currentSection = 'participants';
            continue;
          }

          // Participant section
          if (currentSection === 'participants' && 
              (trimmedLine.startsWith('participant') || trimmedLine.startsWith('actor'))) {
            sections.participants.push(trimmedLine);
          } else {
            currentSection = 'content';
            sections.content.push(line); // Keep original indentation for content
          }
        }

        // 3. Minimal Fixes
        // Only apply fixes that are absolutely necessary
        const contentLines = sections.content.map(line => {
          let fixedLine = line;

          // Fix 1: Ensure returns have text if they end with colon
          if (fixedLine.match(/-->>.*:$/)) {
            fixedLine += ' success';
          }

          // Fix 2: Remove activation/deactivation markers
          fixedLine = fixedLine.replace(/(?:->>|-->>)\+/, '->>')
                              .replace(/(?:->>|-->>)-/, '->>');

          return fixedLine;
        });

        // 4. Reconstruct diagram
        cleanChart = [
          ...sections.header,
          ...sections.participants
        ].join('\n');

        if (sections.participants.length > 0) {
          cleanChart += '\n'; // Add separator after participants
        }

        cleanChart += contentLines.join('\n');
        cleanChart = cleanChart.trim() + '\n';

        console.log(`[Sanitizer] Sanitized chart:\n${cleanChart}`);

        // --- END Simplified Sanitization ---

        if (!cleanChart || cleanChart.trim() === 'sequenceDiagram') {
          console.log("[Sanitizer] Empty diagram after sanitization");
          setError("Diagram code was empty or invalid after sanitization.");
          return;
        }

        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
        console.log('[Sanitizer] Attempting to parse Mermaid code...');
        await mermaid.parse(cleanChart);
        console.log('[Sanitizer] Mermaid syntax valid, rendering diagram...');

        const { svg: renderedSvg } = await mermaid.render(id, cleanChart);
        console.log('[Sanitizer] Diagram rendered successfully!');
        setSvg(renderedSvg);

      } catch (err) {
        console.error('[Sanitizer] Error processing or rendering Mermaid diagram:', err);
        let errorMsg = 'Error rendering diagram';
        if (err instanceof Error) {
          errorMsg = err.message;
          const lineMatch = err.message.match(/Parse error on line (\d+):/);
          if (lineMatch?.[1]) {
            errorMsg += ` (near line ${lineMatch[1]})`;
          }
          console.error('[Sanitizer] Error details:', err.message);
        } else if (typeof err === 'string') {
             errorMsg = err;
        }
        if (typeof err === 'object' && err !== null && 'message' in err) {
             errorMsg = String(err.message);
        }
        setError(errorMsg);
        setSvg('');
      }
    };

    // Initialization and Render Call (same as V4/V5)
    const initializeAndRender = async () => {
      if (!initializedRef.current) {
        console.log('[V6] Initializing Mermaid...');
        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'neutral',
            securityLevel: 'loose',
            logLevel: 'error',
            flowchart: { htmlLabels: true, useMaxWidth: true },
            sequence: {
              diagramMarginX: 50, diagramMarginY: 10, boxMargin: 10,
              noteMargin: 10, messageMargin: 35, mirrorActors: true
            },
            suppressErrorRendering: true,
          });
          initializedRef.current = true;
          console.log('[V6] Mermaid initialized.');
        } catch (initError) {
          console.error("[V6] Failed to initialize Mermaid:", initError);
          setError("Failed to initialize Mermaid rendering engine.");
          initializedRef.current = false;
          return;
        }
      }
      await renderDiagram();
    };

    initializeAndRender();

  }, [chart]);

  // Conditional Rendering (same as V4/V5)
  if (error) {
    return (
      <div style={{ padding: '10px', border: '1px solid #f44336', borderRadius: '4px', marginBottom: '10px', background: '#ffeeee', fontFamily: 'monospace', fontSize: '12px' }}>
        <p style={{ color: '#d32f2f', fontWeight: 'bold', marginBottom: '5px' }}>Error rendering diagram:</p>
        <p style={{ color: '#d32f2f', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>{error}</p>
        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Attempted Diagram Code (after sanitization):</p>
        <pre style={{ background: '#f0f0f0', padding: '8px', overflowX: 'auto', maxHeight: '200px', border: '1px solid #ddd' }}>
          {sanitizedChartForError || "(No diagram code to display)"}
        </pre>
      </div>
    );
  }

  if (svg) {
    return (
      <div
        className="mermaid-diagram-container"
        style={{ overflow: 'auto', maxWidth: '100%' }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  // Show loading state
  return (
    <div
      className="mermaid-diagram-loading"
      style={{
        minHeight: '100px',
        background: '#f9f9f9',
        borderRadius: '4px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
       <div style={{ textAlign: 'center', color: '#666' }}>
        <div style={{ marginBottom: '8px' }}>Loading diagram...</div>
        <div style={{ fontSize: '12px', color: '#999' }}>If this takes too long, there might be an issue with the diagram code.</div>
      </div>
    </div>
  );
};

export default MermaidDiagram; 