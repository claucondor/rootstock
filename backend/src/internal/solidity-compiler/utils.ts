import * as fs from 'fs';

/**
 * Clean up temporary files created during compilation
 * @param contractPath Path to the temporary contract file
 */
export function cleanup(contractPath: string): void {
  try {
    if (fs.existsSync(contractPath)) {
      fs.unlinkSync(contractPath);
    }

    // Also clean up the flattened file if it exists
    const flattenedPath = contractPath.replace('.sol', '.flattened.sol');
    if (fs.existsSync(flattenedPath)) {
      fs.unlinkSync(flattenedPath);
    }
  } catch (error) {
    console.error('Failed to clean up temporary files:', error);
  }
}
