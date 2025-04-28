// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract UUPSUpgradeableDemo is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 public value;

    function initialize() initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        value = 100;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setValue(uint256 newValue) public onlyOwner {
        value = newValue;
    }
}