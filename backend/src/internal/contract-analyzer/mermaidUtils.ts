import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import pino from 'pino';

const logger = pino();

// Path to the mermaid CLI executable - adjust if necessary based on your project structure
// This assumes node_modules is in the workspace root
const mmdcPath = path.resolve(
  process.cwd(),
  'node_modules',
  '.bin',
  'mmdc'
);

/**
 * Checks if the Mermaid CLI executable exists.
 * @returns {Promise<boolean>} True if the executable exists, false otherwise.
 */
async function checkMmdcExists(): Promise<boolean> {
  try {
    await fs.access(mmdcPath, fs.constants.X_OK); // Check execute permission
    logger.info(`Mermaid CLI found at: ${mmdcPath}`);
    return true;
  } catch (error) {
    logger.error(
      `Mermaid CLI (mmdc) not found or not executable at ${mmdcPath}. Please ensure @mermaid-js/mermaid-cli is installed correctly.`
    );
    return false;
  }
}

let mmdcExistsChecked = false;
let mmdcAvailable = false;

/**
 * Validates Mermaid code syntax by attempting to compile it using the Mermaid CLI.
 * This is a basic check; it confirms syntax but not necessarily semantic correctness
 * or adherence to specific diagram types like "activity diagram".
 *
 * @param mermaidCode The Mermaid code string to validate.
 * @returns {Promise<{ valid: boolean; error?: string }>} An object indicating if the code is valid.
 *          If invalid, the 'error' property contains the stderr output from mmdc.
 */
export async function isValidMermaid(mermaidCode: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  // Check for mmdc only once
  if (!mmdcExistsChecked) {
    mmdcAvailable = await checkMmdcExists();
    mmdcExistsChecked = true;
  }

  if (!mmdcAvailable) {
    logger.warn(
      'Skipping Mermaid validation because mmdc is not available.'
    );
    // Treat as valid if CLI is missing, maybe add a warning elsewhere?
    // Or decide based on requirements if this should be a hard failure.
    return { valid: true }; // Or { valid: false, error: 'mmdc not available' }
  }

  let tempFilePath = '';
  try {
    // Create a temporary file to hold the mermaid code
    // Using os.tmpdir() for platform-independent temporary directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mermaid-val-'));
    tempFilePath = path.join(tempDir, 'tempDiagram.mmd');
    await fs.writeFile(tempFilePath, mermaidCode);
    logger.debug(`Temporary Mermaid file created at: ${tempFilePath}`);

    // Execute the mermaid CLI (mmdc) to validate syntax
    // We generate a dummy SVG; the process will error if syntax is invalid.
    // Using --output /dev/null doesn't work well on all platforms (esp. Windows)
    // so we output to a temp file and delete it.
    const tempOutputFile = path.join(tempDir, 'output.svg');

    return new Promise((resolve) => {
      const command = `"${mmdcPath}" -i "${tempFilePath}" -o "${tempOutputFile}"`;
      logger.debug(`Executing Mermaid validation command: ${command}`);

      exec(command, (error, stdout, stderr) => {
        // Clean up the temporary directory regardless of outcome
        fs.rm(tempDir, { recursive: true, force: true })
          .catch((rmErr) => logger.warn(`Failed to remove temp dir: ${rmErr}`))
          .finally(() => {
            if (error) {
              // If exec returns an error, it usually means syntax is invalid
              logger.warn({ error: stderr }, 'Mermaid validation failed');
              resolve({ valid: false, error: stderr || error.message });
            } else {
              // If no error, syntax is likely valid
              logger.debug('Mermaid validation successful');
              resolve({ valid: true });
            }
          });
      });
    });
  } catch (err) {
    logger.error({ error: err }, 'Error during Mermaid validation process');
    // Clean up if temp file path was created but exec failed before cleanup
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
} 