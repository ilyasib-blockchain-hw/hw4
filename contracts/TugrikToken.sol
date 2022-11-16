//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TugrikToken is ERC20 {
  constructor() ERC20("TugrikToken", "MNT") {
    _mint(msg.sender, 1 ether);
  }
}