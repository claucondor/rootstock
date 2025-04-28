// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20WithMint is ERC20, Ownable {
    constructor() ERC20("MintableToken", "MTK") Ownable() {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}