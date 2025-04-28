import * as fs from 'fs';
import { execSync } from 'child_process';

/**
 * Flatten Solidity source code to resolve dependencies using Hardhat
 * @param source Solidity source code
 * @param contractPath Path to save the temporary contract file
 * @param originalPath Optional original path for the contract
 * @returns Flattened Solidity source code
 */
export async function flattenSolidity(source: string, contractPath: string, originalPath?: string): Promise<string> {
  try {
    // Write the source code to the temporary file
    fs.writeFileSync(contractPath, source);
    
    try {
      // Run Hardhat flatten
      if (process.env.NODE_ENV !== 'production') {
        console.log('Flattening contract with Hardhat...');
      }
      
      // Si tenemos una ruta original, usamos esa para aplanar
      const pathToFlatten = originalPath || contractPath;
      
      const flattenedSource = execSync(`npx hardhat flatten ${pathToFlatten}`, {
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      
      // Remove duplicate SPDX license identifiers and pragma statements
      let processedSource = flattenedSource;
      
      // Keep only the first SPDX license identifier
      const spdxMatches = processedSource.match(/\/\/ SPDX-License-Identifier: .+/g);
      if (spdxMatches && spdxMatches.length > 1) {
        const firstSpdx = spdxMatches[0];
        for (let i = 1; i < spdxMatches.length; i++) {
          processedSource = processedSource.replace(spdxMatches[i], '// SPDX-License-Identifier already declared');
        }
      }
      
      // Keep only the first pragma statement and ensure it's 0.8.29
      const pragmaMatches = processedSource.match(/pragma solidity [\^~]?[0-9.]+;/g);
      if (pragmaMatches && pragmaMatches.length > 0) {
        const targetPragma = 'pragma solidity 0.8.29;';
        // Replace the first pragma with our target version
        processedSource = processedSource.replace(pragmaMatches[0], targetPragma);
        
        // Remove all other pragma statements
        for (let i = 1; i < pragmaMatches.length; i++) {
          processedSource = processedSource.replace(pragmaMatches[i], '// pragma solidity already declared');
        }
      } else {
        // If no pragma found, add it at the beginning
        processedSource = `pragma solidity 0.8.29;\n\n${processedSource}`;
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Flattening successful!');
      }
      return processedSource;
    } catch (flattenError: any) {
      console.error('Error flattening contract:', flattenError.message);
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
    console.error('Error in flattenSolidity:', error.message);
    throw error;
  }
}