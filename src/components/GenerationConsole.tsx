import { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';

// Array of humorous loading messages specifically ordered by contract generation phases
const GENERATION_MESSAGES = [
  "Analizando tu solicitud de contrato...",
  "Diseñando la estructura del contrato inteligente...",
  "Generando código Solidity con OpenZeppelin...",
  "Compilando el contrato generado...",
  "Verificando errores de compilación...",
  "Corrigiendo problemas de sintaxis...",
  "Optimizando el contrato para menor consumo de gas...",
  "Validando compatibilidad con EVM...",
  "Generando ABI para interactuar con el contrato...",
  "Preparando bytecode para despliegue...",
  "Creando descripciones de funciones...",
  "Generando datos para visualización...",
  "¡Casi listo! Finalizando el análisis...",
  "Completando la documentación del contrato...",
  "Puliendo los últimos detalles..."
];

const RANDOM_MESSAGES = [
  "Convenciendo a la blockchain de que esto es una buena idea...",
  "Enseñando a los contratos inteligentes a ser más inteligentes...",
  "Negociando con el compilador de solidity...",
  "Consultando la sabiduría de Vitalik...",
  "Reticulando splines de contrato inteligente...",
  "Minando bloques de imaginación...",
  "Buscando punto y comas perdidos...",
  "Generando aleatoriedad aleatoriamente...",
  "Calculando tarifas de gas en lágrimas de unicornio...",
  "Consultando la bola de cristal crypto...",
  "Actualizando el firmware de la blockchain..."
];

interface GenerationConsoleProps {
  isGenerating: boolean;
  progress?: number; // 0-100
  className?: string;
}

const GenerationConsole = ({ isGenerating, progress = 0, className = '' }: GenerationConsoleProps) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showRandomMessages, setShowRandomMessages] = useState(false);

  // Reset and start generating messages when isGenerating changes
  useEffect(() => {
    if (isGenerating) {
      // Iniciar con el primer mensaje de fase
      setMessages([GENERATION_MESSAGES[0]]);
      setCurrentPhase(0);
      setShowRandomMessages(false);
      
      // Avanzar por las fases del proceso de generación basado en porcentaje
      const phaseInterval = setInterval(() => {
        setCurrentPhase(prevPhase => {
          if (prevPhase < GENERATION_MESSAGES.length - 1) {
            // Añadir el siguiente mensaje de fase
            setMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length >= 5) {
                newMessages.shift(); // Mantener máximo 5 mensajes
              }
              newMessages.push(GENERATION_MESSAGES[prevPhase + 1]);
              return newMessages;
            });
            return prevPhase + 1;
          }
          
          // Si ya mostramos todas las fases, empezar a mostrar mensajes aleatorios
          if (!showRandomMessages) {
            setShowRandomMessages(true);
          }
          return prevPhase;
        });
      }, 5500); // Mostrar un nuevo mensaje de fase cada 5.5 segundos (aprox. 80 segundos / 15 fases)
      
      // Intervalo para mensajes aleatorios después de mostrar todas las fases
      const randomInterval = setInterval(() => {
        if (showRandomMessages) {
          const randomMsg = RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)];
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length >= 5) {
              newMessages.shift();
            }
            newMessages.push(randomMsg);
            return newMessages;
          });
        }
      }, 3000); // Mostrar mensaje aleatorio cada 3 segundos después de completar las fases
      
      return () => {
        clearInterval(phaseInterval);
        clearInterval(randomInterval);
      };
    }
  }, [isGenerating, showRandomMessages]);

  // Render nothing if not generating
  if (!isGenerating && messages.length === 0) {
    return null;
  }

  return (
    <div className={`font-mono text-sm rounded-md bg-gray-950 border border-gray-800 ${className}`}>
      <div className="flex items-center p-2 border-b border-gray-800 bg-gray-900">
        <Terminal className="w-4 h-4 mr-2 text-green-500" />
        <span className="text-green-500 font-semibold">Consola de Generación</span>
        {progress > 0 && (
          <div className="ml-auto text-xs text-gray-400">{Math.min(99, Math.round(progress))}% completado</div>
        )}
      </div>
      <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className="flex">
            <span className="text-green-500 mr-2">$</span>
            <span className="text-gray-300">
              {message}
              {index === messages.length - 1 && (
                <span className="inline-block w-2 h-4 ml-1 bg-green-500 animate-pulse"></span>
              )}
            </span>
          </div>
        ))}
        
        {isGenerating && progress > 0 && (
          <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5">
            <div 
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${Math.min(99, progress)}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationConsole; 