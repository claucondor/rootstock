// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AccessControlDemo is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    uint256 public importantValue;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function updateValue(uint256 newValue) public onlyRole(UPDATER_ROLE) {
        importantValue = newValue;
    }

    function addUpdater(address account) public onlyRole(ADMIN_ROLE) {
        grantRole(UPDATER_ROLE, account);
    }
}