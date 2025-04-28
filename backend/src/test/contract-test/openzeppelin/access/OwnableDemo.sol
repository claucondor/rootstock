// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OwnableDemo is Ownable {
    string public importantData;

    constructor() Ownable() {}

    function updateData(string memory newData) public onlyOwner {
        importantData = newData;
    }

    function renounceOwnership() public override onlyOwner {
        revert("Ownership cannot be renounced");
    }
}