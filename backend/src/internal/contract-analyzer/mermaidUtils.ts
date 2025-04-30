import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import pino from 'pino';

const logger = pino();

// Path to the mermaid CLI executable - REMOVED as validation is skipped
// const mmdcPath = path.resolve(...);

/**
 * Checks if the Mermaid CLI executable exists.
 * REMOVED as validation is skipped
 */
// async function checkMmdcExists(): Promise<boolean> { ... } // Removed

// REMOVED State variables for checking mmdc
// let mmdcExistsChecked = false;
// let mmdcAvailable = false;

/**
 * Validates Mermaid code syntax by attempting to compile it using the Mermaid CLI.
 * THIS FUNCTION IS NOW A NO-OP as validation is skipped.
 * It always returns valid: true.
 *
 * @param mermaidCode The Mermaid code string (ignored).
 * @returns {Promise<{ valid: boolean; error?: string }>} Always returns { valid: true }.
 */
export async function isValidMermaid(mermaidCode: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  // Skip validation entirely
  logger.info('Mermaid validation skipped as per new requirements.');
  return { valid: true };

  /* 
  // --- Start of Removed Validation Logic ---
  // Check for mmdc only once
  if (!mmdcExistsChecked) {
    mmdcAvailable = await checkMmdcExists();
    mmdcExistsChecked = true;
  }

  if (!mmdcAvailable) {
    logger.warn(
      'Skipping Mermaid validation because mmdc is not available.'
    );
    return { valid: true }; 
  }

  let tempFilePath = '';
  try {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mermaid-val-'));
    tempFilePath = path.join(tempDir, 'tempDiagram.mmd');
    await fs.writeFile(tempFilePath, mermaidCode);
    logger.debug(`Temporary Mermaid file created at: ${tempFilePath}`);

    const tempOutputFile = path.join(tempDir, 'output.svg');

    return new Promise((resolve) => {
      const command = `"${mmdcPath}" -i "${tempFilePath}" -o "${tempOutputFile}" --puppeteer-config='{"args": ["--no-sandbox", "--disable-setuid-sandbox"]}'`;
      logger.debug(`Executing Mermaid validation command: ${command}`);

      exec(command, (error, stdout, stderr) => {
        fs.rm(tempDir, { recursive: true, force: true })
          .catch((rmErr) => logger.warn(`Failed to remove temp dir: ${rmErr}`))
          .finally(() => {
            if (error) {
              logger.warn({ error: stderr }, 'Mermaid validation failed');
              resolve({ valid: false, error: stderr || error.message });
            } else {
              logger.debug('Mermaid validation successful');
              resolve({ valid: true });
            }
          });
      });
    });
  } catch (err) {
    logger.error({ error: err }, 'Error during Mermaid validation process');
    if (tempFilePath) {
      const tempDir = path.dirname(tempFilePath);
      await fs.rm(tempDir, { recursive: true, force: true }).catch((rmErr) =>
        logger.warn(`Failed to remove temp dir on error: ${rmErr}`)
      );
    }
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Unknown validation error',
    };
  }
  // --- End of Removed Validation Logic ---
  */
} 