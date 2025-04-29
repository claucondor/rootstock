import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Check,
  Code,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import * as prettier from 'prettier/standalone';
import type { Plugin } from 'prettier';
// Import Solidity plugin for browser
import * as solidityPlugin from 'prettier-plugin-solidity/standalone';
// import * as prettierPluginBabel from 'prettier/plugins/babel';
// import * as prettierPluginEstree from 'prettier/plugins/estree';
// import prettierPluginSolidity from 'prettier-plugin-solidity'; 

// Add a style element to handle wrapping
const wrapStyle = `
.code-wrap-enabled pre, .code-wrap-enabled code {
  white-space: pre-wrap !important;
  word-break: break-word !important;
}

.syntax-highlighter pre {
  background: transparent !important;
}

.syntax-highlighter code {
  font-family: monospace !important;
  line-height: 1.5 !important;
  tab-size: 2 !important;
}
`;

interface CodeViewerProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  className?: string;
  maxHeight?: string;
  customStyle?: React.CSSProperties;
  wrapLines?: boolean;
}

// Function to format code using Prettier
const formatCodeWithPrettier = async (code: string, parser: string = 'babel') => {
  try {
    // Determine correct plugins and parser based on language
    let plugins = [];
    let options = {
      parser: parser,
      plugins: plugins,
      semi: true,
      singleQuote: true,
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      trailingComma: 'es5',
    };
    
    if (parser === 'solidity-parse') {
      plugins = [solidityPlugin];
      // Override with solidity-specific options
      options = {
        ...options,
        plugins,
        tabWidth: 4, // Solidity standard is 4 spaces
        singleQuote: false, // Solidity prefers double quotes
        bracketSpacing: false, // Solidity standard
      };
    }
    
    const formatted = await prettier.format(code, options);
    return formatted;
  } catch (error) {
    console.warn('Prettier formatting failed:', error);
    // Fallback to basic formatting or original code
    const lines = code.split('\n');
    const trimmedLines = lines.map(line => line.trimEnd());
    const nonEmptyLines = trimmedLines.filter((line, index, array) => {
      if (index === 0 || index === array.length - 1) return true;
      const prevLine = array[index - 1];
      return !(line.trim() === '' && prevLine.trim() === '');
    });
    return nonEmptyLines.join('\n');
  }
};

const CodeViewer = ({
  code,
  language = 'solidity',
  title,
  showLineNumbers = true,
  className = '',
  maxHeight = '400px',
  customStyle = {},
  wrapLines = false,
}: CodeViewerProps) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isWrapEnabled, setIsWrapEnabled] = useState(wrapLines);
  const [displayHeight, setDisplayHeight] = useState(maxHeight);
  const [formattedCode, setFormattedCode] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);

  // Format code when it changes using Prettier
  useEffect(() => {
    let isMounted = true;
    const format = async () => {
      if (!code) {
        setFormattedCode('');
        return;
      }
      setIsFormatting(true);
      
      // Infer parser based on language prop if possible
      let parser = 'babel'; // Default parser name
      if (language === 'solidity') {
        parser = 'solidity-parse';
        console.log('Using solidity-parse parser with prettier-plugin-solidity');
      } else if (language === 'json') {
        parser = 'json';
      } else if (language === 'javascript' || language === 'typescript' || language === 'jsx' || language === 'tsx') {
        parser = 'babel';
      }

      try {
        const prettyCode = await formatCodeWithPrettier(code, parser);
        if (isMounted) {
          setFormattedCode(prettyCode);
        }
      } catch (err) { // Catch potential errors from formatCodeWithPrettier fallback too
        console.error("Error during formatting sequence:", err);
        if (isMounted) {
          setFormattedCode(code); // Fallback to original code on any error
        }
      }
      if (isMounted) {
        setIsFormatting(false);
      }
    };

    format();

    return () => {
      isMounted = false;
    };
  }, [code, language]);

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
    navigator.clipboard.writeText(formattedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setDisplayHeight(isExpanded ? maxHeight : 'auto');
  };

  // Function to truncate code if it's too large
  const displayCode =
    isExpanded || fullscreenOpen
      ? formattedCode
      : formattedCode.length > 5000 && !isExpanded
        ? `${formattedCode.slice(0, 5000)}...\n\n/* Código truncado. Haga clic en "Expandir" para ver todo el contenido */`
        : formattedCode;

  return (
    <>
      {/* Add style element to the DOM */}
      <style dangerouslySetInnerHTML={{ __html: wrapStyle }} />

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
                title={isExpanded ? 'Colapsar' : 'Expandir'}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-gray-400 hover:text-white"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ver en pantalla completa</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Code className="h-4 w-4 mr-2" />
                      {title || 'Código'}
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
                          onCheckedChange={(checked) =>
                            setIsWrapEnabled(!!checked)
                          }
                        />
                        <Label htmlFor="wrap-code">Ajustar texto</Label>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="h-8 px-3"
                      >
                        {copied ? 'Copiado' : 'Copiar'}
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
                      wrapLines={isWrapEnabled || wrapLines}
                      className="syntax-highlighter"
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.875rem',
                        background: 'transparent',
                        height: '100%',
                        ...customStyle,
                      }}
                    >
                      {isFormatting ? 'Formatting...' : displayCode}
                    </SyntaxHighlighter>
                  </div>
                </DialogContent>
              </Dialog>

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
          className={`overflow-auto transition-all duration-300 ${isWrapEnabled || wrapLines ? 'code-wrap-enabled' : ''}`}
          style={{ maxHeight: displayHeight }}
        >
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            showLineNumbers={showLineNumbers}
            wrapLines={isWrapEnabled || wrapLines}
            className="syntax-highlighter"
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
              background: 'transparent',
              ...customStyle,
            }}
          >
            {isFormatting ? 'Formatting...' : displayCode}
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
    </>
  );
};

export default CodeViewer;
