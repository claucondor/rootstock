import { OpenRouterClient } from './client';
import { OpenRouterOptions, ModelMessage, ModelCallOptions } from './types';

// Re-exportar tipos para uso externo
export * from './types';

/**
 * Servicio para interactuar con la API de OpenRouter
 */
export class OpenRouterService {
  private readonly client: OpenRouterClient;

  /**
   * Constructor del servicio OpenRouter
   * @param options Opciones de configuración opcionales
   */
  constructor(options?: OpenRouterOptions) {
    this.client = new OpenRouterClient(options);
  }

  /**
   * Llama al modelo de OpenRouter con los mensajes proporcionados
   * @param messages Array de mensajes para enviar al modelo
   * @param options Opciones adicionales para la llamada
   * @returns Contenido de la respuesta del modelo
   */
  async callModel(
    messages: ModelMessage[],
    options?: ModelCallOptions
  ): Promise<string> {
    return this.client.callModel(messages, options);
  }
}
