import pino from 'pino';
import { OpenRouterClient } from '../openrouter/client';
import { ModelMessage } from '../openrouter/types';

const logger = pino();

/**
 * Safely extracts and parses JSON from LLM string responses.
 * Tries direct parsing, then markdown block extraction (json or generic),
 * and finally brace-based extraction as a fallback.
 * @param response The raw string response from the LLM.
 * @param context Optional description for logging purposes.
 * @returns Parsed JSON object of type T, or null if all attempts fail.
 */
export function extractAndParseJson<T>(
  response: string,
  context: string = 'LLM response'
): T | null {
  if (!response) {
    logger.warn(`Cannot parse empty or null response for ${context}.`);
    return null;
  }
  const trimmedResponse = response.trim();

  // 1. Try direct parsing first (ideal case)
  try {
    logger.debug(`Attempting direct JSON parse for ${context}...`);
    return JSON.parse(trimmedResponse) as T;
  } catch (directError) {
    logger.warn(
      {
        error: directError instanceof Error ? directError.message : String(directError),
      },
      `Direct JSON parsing failed for ${context}, attempting markdown extraction.`
    );
  }

  // 2. Try extracting from ```json ... ``` or ``` ... ```
  // Combined regex to catch both ```json\n<content>\n``` and ```\n<content>\n```
  logger.debug(`Attempting markdown JSON extraction for ${context}...`);
  const jsonMatch = trimmedResponse.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const extracted = jsonMatch[1].trim();
      logger.debug(`Found markdown block for ${context}, attempting parse...`);
      return JSON.parse(extracted) as T;
    } catch (markdownError) {
      logger.warn(
        {
          error: markdownError instanceof Error ? markdownError.message : String(markdownError),
          extractedSnippet: jsonMatch[1].substring(0, 100),
        },
        `Parsing failed for ${context} after extracting from markdown \`\`\` block.`
      );
    }
  }

  // 3. Fallback: Try to find the first '{' and last '}' assuming it's the main object
  logger.debug(`Attempting brace-based JSON extraction for ${context}...`);
  const firstBrace = trimmedResponse.indexOf('{');
  const lastBrace = trimmedResponse.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const potentialJson = trimmedResponse.substring(firstBrace, lastBrace + 1);
      logger.debug(
        `Found braces for ${context}, attempting parse of substring...`
      );
      return JSON.parse(potentialJson) as T;
    } catch (braceError) {
      logger.warn(
        {
          error: braceError instanceof Error ? braceError.message : String(braceError),
          braceSnippet: trimmedResponse.substring(firstBrace, Math.min(firstBrace + 100, lastBrace + 1)),
        },
        `Parsing failed for ${context} after extracting content between first/last braces.`
      );
    }
  }

  // If all attempts fail
  logger.error(
    `All attempts to parse JSON from ${context} failed. Raw response: ${trimmedResponse.substring(0, 200)}...`
  );
  return null;
}

/**
 * Calls the LLM model via OpenRouter with structured error handling and logging.
 * @param openRouterClient Instance of OpenRouterClient.
 * @param messages The array of messages for the prompt.
 * @param context Description of the call for logging.
 * @returns The string content from the LLM response, or null on error.
 */
export async function callLlm(
  openRouterClient: OpenRouterClient,
  messages: ModelMessage[],
  context: string
): Promise<string | null> {
  logger.info(`Calling LLM for ${context}...`);
  // logger.debug({ messages, context }, 'LLM Request Messages');

  try {
    // *** Reverted: callModel likely returns string directly ***
    const response = await openRouterClient.callModel(messages);

    // Log the raw response string for debugging
    logger.debug({ rawResponse: response, context }, 'Raw LLM Response String');

    // Check if the response string is empty or null
    if (!response) {
      logger.warn(`LLM returned empty or null response string for ${context}.`);
      return null;
    }

    // Optional: Add checks here if the response string indicates an error
    // e.g., if (response.startsWith('Error:')) { ... }

    logger.info(`LLM call successful for ${context}.`);
    logger.debug(
      `LLM response string snippet for ${context}: ${response.substring(0, 100)}...`
    );
    return response; // Return the string directly

  } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          context,
        },
        `Error during or after LLM call for ${context}`
      );
       // Specific check for the TypeError observed in logs
       if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading '0')")) {
           logger.error(`Caught specific TypeError in callLlm for ${context}, likely from OpenRouterClient handling an API error response internally. Returning null.`);
           // This error likely happens inside callModel, so returning null is appropriate
           return null;
       }
       if (error instanceof Error && error.message.includes('rate limit')) {
            logger.warn(`Rate limit likely hit during call for ${context}. Returning null.`);
            return null;
       }
      // For other types of errors, returning null to prevent cascading failures
      logger.error(`Unhandled error during LLM call for ${context}. Returning null.`);
      return null;
  }
} 