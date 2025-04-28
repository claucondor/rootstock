import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Copy, Check, Code, Maximize2, Minimize2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from './ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface CodeViewerProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  className?: string;
  maxHeight?: string;
}

const CodeViewer = ({
  code,
  language = 'solidity',
  title,
  showLineNumbers = true,
  className = '',
  maxHeight = '400px',
}: CodeViewerProps) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isWrapEnabled, setIsWrapEnabled] = useState(false);
  const [displayHeight, setDisplayHeight] = useState(maxHeight);

  // Auto-detect if content is large and adjust initial height
  useEffect(() => {
    const lineCount = code.split('\n').length;
    if (lineCount < 10) {
      setDisplayHeight('auto');
    } else {
      setDisplayHeight(maxHeight);
    }
  }, [code, maxHeight]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setDisplayHeight(isExpanded ? maxHeight : 'auto');
  };

  // Highlight search term in code
  const highlightCode = (code: string) => {
    if (!searchTerm) return code;
    
    return code;
  };

  // Function to truncate code if it's too large
  const displayCode = isExpanded || fullscreenOpen ? code : 
    code.length > 5000 && !isExpanded ? `${code.slice(0, 5000)}...\n\n/* Código truncado. Haga clic en "Expandir" para ver todo el contenido */` : code;

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center">
            <Code className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm font-medium text-gray-200">{title}</span>
            {code.length > 1000 && (
              <span className="ml-2 text-xs text-gray-400">
                ({(code.length / 1000).toFixed(1)}KB)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleExpand}
              className="h-8 px-2 text-gray-400 hover:text-white"
              title={isExpanded ? "Colapsar" : "Expandir"}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-gray-400 hover:text-white"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="flex items-center">
                          <Code className="h-4 w-4 mr-2" />
                          {title || "Código"}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="flex items-center justify-between my-2 pb-2 border-b border-gray-700">
                        <div className="relative w-full max-w-xs">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Buscar en el código..." 
                            className="pl-8 h-9 bg-gray-800 border-gray-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="wrap-code" 
                              checked={isWrapEnabled}
                              onCheckedChange={(checked) => setIsWrapEnabled(!!checked)}
                            />
                            <Label htmlFor="wrap-code">Ajustar texto</Label>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={copyToClipboard}
                            className="h-8 px-3"
                          >
                            {copied ? "Copiado" : "Copiar"}
                            {copied ? (
                              <Check className="h-4 w-4 ml-2" />
                            ) : (
                              <Copy className="h-4 w-4 ml-2" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-auto">
                        <SyntaxHighlighter
                          language={language}
                          style={vscDarkPlus}
                          showLineNumbers={showLineNumbers}
                          wrapLines={isWrapEnabled}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '0.875rem',
                            background: 'transparent',
                            height: '100%',
                          }}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver en pantalla completa</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyToClipboard}
              className="h-8 px-2 text-gray-400 hover:text-white"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
      <div 
        className={`overflow-auto transition-all duration-300`}
        style={{ maxHeight: displayHeight }}
      >
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            background: 'transparent',
          }}
        >
          {displayCode}
        </SyntaxHighlighter>
      </div>
      
      {code.length > 5000 && !isExpanded && !fullscreenOpen && (
        <div className="text-center py-2 border-t border-gray-800">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleExpand}
            className="text-xs text-gray-400"
          >
            Mostrar código completo ({(code.length / 1000).toFixed(1)}KB)
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CodeViewer; 