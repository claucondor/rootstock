// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721Basic is ERC721 {
    constructor() ERC721("BasicNFT", "BNFT") {
        _mint(msg.sender, 1);
    }
}