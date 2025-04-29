import { OpenRouterService } from '../openrouter';
import { ContractGenerator } from './generator';
import { ContractGeneratorOptions, GeneratedContract } from './types';

// Re-exportar tipos para uso externo
export * from './types';

/**
 * Servicio para la generación de contratos inteligentes
 */
export class ContractGeneratorService {
  private readonly generator: ContractGenerator;

  /**
   * Constructor del servicio de generación de contratos
   * @param options Opciones para el servicio
   */
  constructor(options?: ContractGeneratorOptions) {
    const openRouter = new OpenRouterService(options?.openRouterOptions);
    this.generator = new ContractGenerator(openRouter);
  }

  /**
   * Genera un contrato inteligente basado en el prompt proporcionado
   * @param prompt Descripción del contrato a generar
   * @returns Objeto con el código del contrato generado, ABI y bytecode
   */
  async generateContract(prompt: string): Promise<GeneratedContract> {
    return this.generator.generateContract(prompt);
  }

  /**
   * Refina un contrato existente basado en las instrucciones del usuario
   * @param sourceCode Código fuente del contrato existente
   * @param prompt Instrucciones para modificar el contrato
   * @returns Objeto con el código del contrato refinado, ABI y bytecode
   */
  async refineContract(
    sourceCode: string,
    prompt: string
  ): Promise<GeneratedContract> {
    return this.generator.refineContract(sourceCode, prompt);
  }
}
