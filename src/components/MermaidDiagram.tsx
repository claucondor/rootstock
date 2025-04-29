import React from 'react';
import { MermaidDiagram as MermaidDiagramLib } from '@lightenna/react-mermaid-diagram';

interface MermaidDiagramProps {
  chart: string; // The Mermaid code string
}

/**
 * A simple wrapper component to render Mermaid diagrams using
 * @lightenna/react-mermaid-diagram.
 *
 * Note: The underlying library handles Mermaid initialization and rendering.
 * Ensure the parent component using this is marked with \'use client\' if using Next.js App Router.
 */
const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  if (!chart) {
    // Don't attempt to render if the chart string is empty
    return null;
  }

  // The library expects the chart code as children
  return <MermaidDiagramLib>{chart}</MermaidDiagramLib>;
};

export default MermaidDiagram; 