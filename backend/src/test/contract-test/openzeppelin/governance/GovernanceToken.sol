// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20Votes {
    constructor() ERC20("GovernanceToken", "GTK") ERC20Permit("GovernanceToken") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }
}