/**
 * Opciones para el servicio de generación de contratos
 */
export interface ContractGeneratorOptions {
  openRouterOptions?: {
    apiKey?: string;
    apiUrl?: string;
    defaultModel?: string;
    defaultMaxTokens?: number;
    defaultTemperature?: number;
  };
}

/**
 * Resultado de la generación de un contrato
 */
export interface GeneratedContract {
  /**
   * Código fuente del contrato
   */
  source: string;
  
  /**
   * ABI del contrato (Application Binary Interface)
   */
  abi?: any;
  
  /**
   * Bytecode del contrato compilado
   */
  bytecode?: string;
  
  /**
   * Errores de compilación si los hay
   */
  errors?: any[];
  
  /**
   * Advertencias de compilación si las hay
   */
  warnings?: any[];
  
  /**
   * Número de intentos realizados para generar un contrato válido
   * Si es 1, significa que se generó correctamente en el primer intento
   * Si es mayor a 1, significa que se necesitaron varios intentos para corregir errores
   */
  attempts?: number;
}