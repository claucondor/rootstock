import pino from 'pino';
import { OpenRouterClient } from '../openrouter/client';
import { ModelMessage } from '../openrouter/types';

const logger = pino();

/**
 * Sanitizes a JSON string by removing or replacing problematic control characters
 * that can cause parsing errors.
 * @param jsonString The potentially problematic JSON string
 * @returns A sanitized JSON string ready for parsing
 */
function sanitizeJsonString(jsonString: string): string {
  if (!jsonString) return '';
  
  // Replace problematic control characters with spaces or appropriate escapes
  let sanitized = jsonString
    // Replace ASCII control characters (0-31) except allowed ones in JSON (\n, \r, \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    // Double escape already escaped characters to prevent parse errors
    .replace(/\\"/g, '\\\\"')
    // Properly escape any unescaped quotes within string literals (complex, only use if necessary)
    // .replace(/(?<!\\)"(?=(.*?".*?"))/g, '\\"') // This requires ES2018+ with lookbehind
    // Handle common invalid syntax in string literals
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
    
  // Attempt to fix common issues with unescaped newlines in string literals
  // Look for patterns like: "description": "text with
  // newline", and fix them
  sanitized = sanitized.replace(/"([^"]*?)[\n\r]+(.*?)"/g, (match, p1, p2) => {
    return `"${p1}\\n${p2}"`;
  });

  return sanitized;
}

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
  // Keep the original raw response for better error logging if needed
  const rawResponse = response;
  const trimmedResponse = response.trim();

  // 1. Try direct parsing first (ideal case)
  try {
    logger.debug(`Attempting direct JSON parse for ${context}...`);
    return JSON.parse(trimmedResponse) as T;
  } catch (directError) {
    logger.warn(
      {
        error: directError instanceof Error ? directError.message : String(directError),
        // Log a larger snippet on failure
        responseSnippet: trimmedResponse.substring(0, 200),
      },
      `Direct JSON parsing failed for ${context}, attempting markdown extraction.`
    );
  }

  // 2. Try extracting from ```json ... ``` or ``` ... ```
  // Updated regex to be more flexible with whitespace and backticks
  logger.debug(`Attempting markdown JSON extraction for ${context}...`);
  // Improved regex to handle various markdown code block formats
  const jsonMatch = trimmedResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      // Ensure the captured group content is trimmed properly before parsing
      const extracted = jsonMatch[1].trim();
      logger.debug(`Found markdown block for ${context}, attempting parse...`);
      if (extracted) { // Make sure extracted content is not empty after trim
        // First try parsing the raw extracted content
        try {
          return JSON.parse(extracted) as T;
        } catch (initialExtractError) {
          // If that fails, try sanitizing the JSON before parsing
          logger.debug(`Initial parse of markdown block failed for ${context}, attempting sanitization...`);
          const sanitized = sanitizeJsonString(extracted);
          return JSON.parse(sanitized) as T;
        }
      } else {
         logger.warn(`Markdown block extracted but was empty after trimming for ${context}.`);
      }
    } catch (markdownError) {
      logger.warn(
        {
          error: markdownError instanceof Error ? markdownError.message : String(markdownError),
          // Log the exact extracted snippet that failed to parse
          extractedContent: jsonMatch[1], // Log the raw extracted content before trim
          fullResponseSnippet: trimmedResponse.substring(0, 200),
        },
        `Parsing failed for ${context} after extracting from markdown \`\`\` block.`
      );
    }
  } else {
     logger.debug(`No markdown block found for ${context}.`);
  }

  // 3. Try handling alternative markdown formats (just in case)
  logger.debug(`Attempting to extract JSON from alternative markdown formats for ${context}...`);
  // Look for patterns like ` [` and `]` ` or `[ ... ]` (with proper JSON array inside)
  const altJsonRegex = /(?:^|\n)\s*(\[(?:\s*{[\s\S]*?}\s*,?)*\s*\])\s*(?:\n|$)/;
  const altJsonMatch = trimmedResponse.match(altJsonRegex);
  if (altJsonMatch && altJsonMatch[1]) {
    try {
      const extracted = altJsonMatch[1].trim();
      logger.debug(`Found potential JSON array in text for ${context}, attempting parse...`);
      if (extracted) {
        try {
          return JSON.parse(extracted) as T;
        } catch (initialAltError) {
          // If that fails, try sanitizing the JSON before parsing
          logger.debug(`Initial parse of alternative JSON format failed for ${context}, attempting sanitization...`);
          const sanitized = sanitizeJsonString(extracted);
          return JSON.parse(sanitized) as T;
        }
      }
    } catch (altJsonError) {
      logger.warn(
        {
          error: altJsonError instanceof Error ? altJsonError.message : String(altJsonError),
          extractedContent: altJsonMatch[1].substring(0, 200),
        },
        `Parsing failed for ${context} after extracting potential JSON array from text.`
      );
    }
  }

  // 4. Fallback: Try to find the first '{' and last '}' or first '[' and last ']'
  logger.warn(`Attempting potentially unreliable brace-based JSON extraction as fallback for ${context}...`);
  // First try array brackets in case we're expecting an array
  let firstChar = trimmedResponse.indexOf('[');
  let lastChar = trimmedResponse.lastIndexOf(']');
  
  // If not found, try object braces
  if (firstChar === -1 || lastChar <= firstChar) {
    firstChar = trimmedResponse.indexOf('{');
    lastChar = trimmedResponse.lastIndexOf('}');
  }
  
  if (firstChar !== -1 && lastChar > firstChar) {
    try {
      const potentialJson = trimmedResponse.substring(firstChar, lastChar + 1);
      logger.debug(
        `Found JSON delimiters for ${context}, attempting parse of substring...`
      );
      try {
        return JSON.parse(potentialJson) as T;
      } catch (initialBraceError) {
        // If that fails, try sanitizing the JSON before parsing
        logger.debug(`Initial parse of extracted JSON delimiters failed for ${context}, attempting sanitization...`);
        const sanitized = sanitizeJsonString(potentialJson);
        return JSON.parse(sanitized) as T;
      }
    } catch (braceError) {
      logger.warn(
        {
          error: braceError instanceof Error ? braceError.message : String(braceError),
          braceSnippet: trimmedResponse.substring(firstChar, Math.min(firstChar + 150, lastChar + 1)),
          fullResponseSnippet: trimmedResponse.substring(0, 200),
        },
        `Parsing failed for ${context} after extracting content between delimiters.`
      );
    }
  }

  // 5. Last resort: Try sanitizing the entire response
  logger.warn(`Attempting to sanitize and parse the entire response for ${context}...`);
  try {
    const sanitized = sanitizeJsonString(trimmedResponse);
    return JSON.parse(sanitized) as T;
  } catch (sanitizeError) {
    logger.error(
      `All attempts to parse JSON from ${context} failed, even after sanitization. Raw response snippet: ${rawResponse.substring(0, 300)}...`
    );
    return null;
  }
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

/**
 * Attempts to extract a JSON string potentially wrapped in markdown code fences (```json ... ```)
 * or other leading/trailing non-JSON text.
 * Also handles simple trimming.
 * @param rawResponse The raw string response from the LLM.
 * @returns The cleaned string, potentially ready for JSON.parse().
 */
function cleanPotentiallyWrappedJson(rawResponse: string): string {
  if (!rawResponse) {
    return '';
  }

  // Trim whitespace first
  let cleaned = rawResponse.trim();

  // Regex to find content within ```json ... ``` or ``` ... ```
  const markdownRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
  const match = cleaned.match(markdownRegex);

  if (match && match[1]) {
    // If found, use the captured group (the content inside)
    cleaned = match[1].trim();
    logger.debug('JSON extracted from markdown code fence.');
  } else {
    // If no markdown fence, check if it already looks like JSON
    // (starts with { or [ and ends with } or ])
    // This is a basic check and might need refinement
    const startsWithBracket = cleaned.startsWith('{') || cleaned.startsWith('[');
    const endsWithBracket = cleaned.endsWith('}') || cleaned.endsWith(']');
    if (!startsWithBracket || !endsWithBracket) {
      logger.warn(
        'LLM response does not appear to be wrapped in markdown nor start/end with JSON brackets. Returning as is, parsing might fail.',
        { responseSnippet: cleaned.substring(0, 100) }
      );
      // Potentially add logic here to find the first '{' or '[' and last '}' or ']'
      // as a more aggressive fallback, but be cautious.
    }
  }

  return cleaned;
}

/**
 * Parses a potentially wrapped JSON string from the LLM response.
 * First cleans the response, then attempts JSON.parse().
 * @param rawResponse The raw string response from the LLM.
 * @param context Optional context for logging errors.
 * @returns The parsed JSON object/array, or null if parsing fails.
 */
export function parseLlmJsonResponse<T>(
  rawResponse: string,
  context: string = 'LLM JSON Response'
): T | null {
  const cleanedResponse = cleanPotentiallyWrappedJson(rawResponse);

  if (!cleanedResponse) {
    logger.error(
      `[${context}] Cleaned LLM response is empty. Raw response snippet: ${rawResponse?.substring(0, 100)}`
    );
    return null;
  }

  try {
    // First attempt standard parsing
    try {
      const parsedJson = JSON.parse(cleanedResponse);
      logger.debug(`[${context}] Successfully parsed cleaned JSON response.`);
      return parsedJson as T;
    } catch (initialError) {
      // If standard parsing fails, try sanitizing the JSON string first
      logger.debug(`[${context}] Initial JSON parsing failed, attempting with sanitization...`);
      const sanitized = sanitizeJsonString(cleanedResponse);
      const parsedJson = JSON.parse(sanitized);
      logger.debug(`[${context}] Successfully parsed sanitized JSON response.`);
      return parsedJson as T;
    }
  } catch (error: any) {
    logger.error(
      `[${context}] Failed to parse cleaned JSON, even after sanitization. Error: ${error.message}`,
      {
        cleanedSnippet: cleanedResponse.substring(0, 500), // Log more snippet
        rawSnippet: rawResponse?.substring(0, 100),
      }
    );
    // Optionally, implement the retry logic here or throw the error
    // to be handled by the caller (depends on desired flow).
    return null; // Or throw error
  }
}

// Example of how to use it (replace existing JSON.parse calls):
/*
async function someFunctionCallingLlm() {
  const rawResponse = await callMyLlm(...); // Assume this returns the raw string
  const parsedData = parseLlmJsonResponse<ExpectedResponseType>(rawResponse, 'Function Analysis Batch X');

  if (parsedData) {
    // Use parsedData
  } else {
    // Handle error - parsing failed
    logger.error('Failed to get valid JSON data from LLM for Function Analysis Batch X');
    // Maybe throw an error or return an empty result
  }
}
*/ 