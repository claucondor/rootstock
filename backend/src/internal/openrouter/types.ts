/**
 * Opciones de configuración para el servicio OpenRouter
 */
export interface OpenRouterOptions {
  apiKey?: string;
  apiUrl?: string;
  defaultModel?: string;
  defaultMaxTokens?: number;
  defaultTemperature?: number;
}

/**
 * Opciones para la llamada al modelo
 */
export interface ModelCallOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Mensaje para enviar al modelo
 */
export interface ModelMessage {
  role: string;
  content: string;
}