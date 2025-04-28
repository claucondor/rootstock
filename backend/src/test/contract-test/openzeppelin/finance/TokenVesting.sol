// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/finance/VestingWallet.sol";

contract TokenVesting is VestingWallet {
    constructor(address beneficiary, uint64 start, uint64 duration)
        VestingWallet(beneficiary, start, duration)
    {}

    function release(address token) public override {
        super.release(token);
    }

    function releaseNative() public {
        super.release(address(0));
    }
}