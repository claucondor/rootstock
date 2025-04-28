// SPDX-License: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PausableDemo is Pausable, Ownable {
    constructor() {
        _pause();
    }

    function togglePause() public onlyOwner {
        if (paused()) {
            _unpause();
        } else {
            _pause();
        }
    }

    function doSomething() public whenNotPaused {
        // Functionality when not paused
    }
}