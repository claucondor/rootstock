import { SolidityCompilerService } from '../internal/solidity-compiler';

async function testCompiler() {
  console.log('Testing SolidityCompilerService...');
  
  const compiler = new SolidityCompilerService();
  
  // ERC20 contract with OpenZeppelin dependencies
  const source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("SimpleToken", "STK") {
        _mint(msg.sender, initialSupply);
    }
}
  `;
  
  try {
    console.log('Compiling contract...');
    // Pasamos explícitamente el nombre del contrato
    const result = await compiler.compileSolidity(source, 'SimpleToken');
    
    if (result.errors && result.errors.length > 0) {
      console.error('Compilation errors:');
      result.errors.forEach(error => {
        console.error(`- ${error.message}`);
      });
    } else {
      console.log('Compilation successful!');
      
      if (result.abi && result.abi.length > 0) {
        console.log('ABI:', JSON.stringify(result.abi, null, 2).substring(0, 100) + '...');
      } else {
        console.log('ABI is empty or undefined');
      }
      
      console.log('Bytecode length:', result.bytecode ? result.bytecode.length : 0);
      
      if (result.warnings && result.warnings.length > 0) {
        console.log('Warnings:');
        result.warnings.forEach(warning => {
          console.log(`- ${warning.message}`);
        });
      }
      
      // Print the full source code for debugging
      console.log('\nContract source code:');
      console.log(source);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testCompiler().catch(console.error);