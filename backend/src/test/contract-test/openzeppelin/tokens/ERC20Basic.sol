// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Basic is ERC20 {
    constructor() ERC20("BasicToken", "BTK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}