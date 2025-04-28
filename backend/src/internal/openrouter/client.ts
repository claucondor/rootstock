import axios from 'axios';
import { OpenRouterOptions, ModelMessage, ModelCallOptions } from './types';

/**
 * Cliente para interactuar con la API de OpenRouter
 */
export class OpenRouterClient {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly defaultModel: string;
  private readonly defaultMaxTokens: number;
  private readonly defaultTemperature: number;

  /**
   * Constructor del cliente OpenRouter
   * @param options Opciones de configuración opcionales
   */
  constructor(options?: OpenRouterOptions) {
    this.apiKey = options?.apiKey || process.env.OPENROUTER_API_KEY || '';
    this.apiUrl = options?.apiUrl || 'https://openrouter.ai/api/v1/chat/completions';
    this.defaultModel = options?.defaultModel || 'deepseek/deepseek-chat-v3-0324';
    this.defaultMaxTokens = options?.defaultMaxTokens || 2048;
    this.defaultTemperature = options?.defaultTemperature || 0.2;
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
    const response = await axios.post(
      this.apiUrl,
      {
        model: options?.model || this.defaultModel,
        messages,
        max_tokens: options?.maxTokens || this.defaultMaxTokens,
        temperature: options?.temperature !== undefined ? options.temperature : this.defaultTemperature,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.choices[0].message.content;
  }
}