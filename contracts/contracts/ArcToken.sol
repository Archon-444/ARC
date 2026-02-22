// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ArcToken
 * @dev Minimal ERC20 token deployed by ArcTokenFactory via CREATE2.
 * Kept lightweight (no OpenZeppelin base) to minimize deployment gas
 * since each token creation costs the user a $25 USDC fee.
 *
 * Safety: Zero-address checks on transfer/transferFrom.
 * All supply minted to factory on construction.
 */
contract ArcToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public factory;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        address _factory
    ) {
        require(_factory != address(0), "Invalid factory");
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        factory = _factory;
        balanceOf[_factory] = _totalSupply;
        emit Transfer(address(0), _factory, _totalSupply);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        if (to == address(0)) revert ZeroAddress();
        if (balanceOf[msg.sender] < value) revert InsufficientBalance();

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        if (from == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        if (allowance[from][msg.sender] < value) revert InsufficientAllowance();
        if (balanceOf[from] < value) revert InsufficientBalance();

        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}
