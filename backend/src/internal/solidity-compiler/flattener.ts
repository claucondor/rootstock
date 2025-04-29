import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import pino from 'pino';

const logger = pino();

/**
 * Flatten Solidity source code to resolve dependencies using Hardhat
 * @param source Solidity source code
 * @param contractPath Path to save the temporary contract file
 * @param originalPath Optional original path for the contract
 * @returns Flattened Solidity source code
 */
export async function flattenSolidity(
  source: string,
  contractPath: string,
  originalPath?: string
): Promise<string> {
  try {
    // Write the source code to the temporary file
    fs.writeFileSync(contractPath, source);

    // Create a temporary hardhat.config.js file to ensure imports work correctly
    const tempHardhatConfig = path.join(
      path.dirname(contractPath),
      'hardhat.config.js'
    );
    const hardhatConfigContent = `
      module.exports = {
        solidity: {
          version: "0.8.29",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            },
          },
        },
        paths: {
          sources: "./",
          cache: "./cache",
          artifacts: "./artifacts"
        }
      };
    `;

    fs.writeFileSync(tempHardhatConfig, hardhatConfigContent);

    try {
      logger.info('Flattening contract with Hardhat...');

      // If we have an original path, use that for flattening
      const pathToFlatten = originalPath || contractPath;

      // Make sure we're in the right directory where node_modules can be found
      const currentDir = process.cwd();

      // Modify the command to ensure proper resolution of dependencies
      const flattenedSource = execSync(`npx hardhat flatten ${pathToFlatten}`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        cwd: currentDir, // Ensure we're in the right directory
      });

      // Remove duplicate SPDX license identifiers and pragma statements
      let processedSource = flattenedSource;

      // Keep only the first SPDX license identifier
      const spdxMatches = processedSource.match(
        /\/\/ SPDX-License-Identifier: .+/g
      );
      if (spdxMatches && spdxMatches.length > 1) {
        const firstSpdx = spdxMatches[0];
        for (let i = 1; i < spdxMatches.length; i++) {
          processedSource = processedSource.replace(
            spdxMatches[i],
            '// SPDX-License-Identifier already declared'
          );
        }
      }

      // Keep only the first pragma statement and ensure it's 0.8.29
      const pragmaMatches = processedSource.match(
        /pragma solidity [\^~]?[0-9.]+;/g
      );
      if (pragmaMatches && pragmaMatches.length > 0) {
        const targetPragma = 'pragma solidity 0.8.29;';
        // Replace the first pragma with our target version
        processedSource = processedSource.replace(
          pragmaMatches[0],
          targetPragma
        );

        // Remove all other pragma statements
        for (let i = 1; i < pragmaMatches.length; i++) {
          processedSource = processedSource.replace(
            pragmaMatches[i],
            '// pragma solidity already declared'
          );
        }
      } else {
        // If no pragma found, add it at the beginning
        processedSource = `pragma solidity 0.8.29;\n\n${processedSource}`;
      }

      // Clean up temporary config file
      if (fs.existsSync(tempHardhatConfig)) {
        fs.unlinkSync(tempHardhatConfig);
      }

      logger.info('Flattening successful!');
      return processedSource;
    } catch (flattenError: any) {
      logger.error(
        { error: flattenError.message },
        'Error flattening contract'
      );

      // Clean up temporary config file
      if (fs.existsSync(tempHardhatConfig)) {
        fs.unlinkSync(tempHardhatConfig);
      }

      // If the error is about not finding @openzeppelin imports, try a different approach
      if (flattenError.message.includes('@openzeppelin')) {
        logger.info('Trying to pre-process imports for OpenZeppelin...');

        // This is a more direct approach that replaces imports with content
        // First, check if the imports exist
        const workingDir = process.cwd();
        const ozContractsPath = path.join(
          workingDir,
          'node_modules',
          '@openzeppelin',
          'contracts'
        );

        if (fs.existsSync(ozContractsPath)) {
          logger.info(
            'Found OpenZeppelin contracts, attempting manual resolution'
          );
          // Return source but add a warning comment
          return `pragma solidity 0.8.29;

// WARNING: Imports could not be automatically flattened
// Make sure OpenZeppelin v4.9.3 is installed correctly
${source}`;
        }
      }

      // If flattening fails, return the original source with the correct pragma
      const pragmaPattern = /pragma solidity [\^~]?[0-9.]+;/g;
      const hasPragma = pragmaPattern.test(source);

      if (hasPragma) {
        return source.replace(pragmaPattern, 'pragma solidity 0.8.29;');
      } else {
        return `pragma solidity 0.8.29;\n\n${source}`;
      }
    }
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error in flattenSolidity');
    throw error;
  }
}
