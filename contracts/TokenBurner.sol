// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TokenBurner
 * @notice Helper contract for facilitating and logging burns of supported ERC-20 tokens.
 * @dev A generic helper contract cannot force an arbitrary token to destroy its supply.
 * Token compatibility must be checked.
 */

interface IERC20Burnable {
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
}

contract TokenBurner {
    // Standard dead address where tokens are permanently locked if native burn is absent
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    event TokensBurned(
        address indexed burner,
        address indexed token,
        uint256 amount,
        string burnType,
        uint256 timestamp
    );

    /**
     * @notice Checks whether a token supports standard burn methods via staticcall simulation
     * @param token Address of the token contract
     * @return hasBurn True if token implements burn(uint256)
     * @return hasBurnFrom True if token implements burnFrom(address, uint256)
     */
    function checkBurnable(address token) external view returns (bool hasBurn, bool hasBurnFrom) {
        bytes memory burnData = abi.encodeWithSelector(IERC20Burnable.burn.selector, 0);
        (bool successBurn, ) = token.staticcall(burnData);
        hasBurn = successBurn;

        bytes memory burnFromData = abi.encodeWithSelector(IERC20Burnable.burnFrom.selector, address(this), 0);
        (bool successBurnFrom, ) = token.staticcall(burnFromData);
        hasBurnFrom = successBurnFrom;
    }

    /**
     * @notice Burns tokens through the TokenBurner helper contract.
     * @dev User approves TokenBurner for the amount, then calls this function.
     * @param token Address of the ERC-20 token
     * @param amount Amount of tokens to burn
     */
    function burn(address token, uint256 amount) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");

        // 1. First attempt burnFrom directly if supported by token
        (bool burnFromSuccess, ) = token.call(
            abi.encodeWithSelector(IERC20Burnable.burnFrom.selector, msg.sender, amount)
        );
        if (burnFromSuccess) {
            emit TokensBurned(msg.sender, token, amount, "burnFrom", block.timestamp);
            return;
        }

        // 2. Transfer tokens from sender into this helper contract
        (bool transferSuccess, bytes memory transferData) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount)
        );
        require(
            transferSuccess && (transferData.length == 0 || abi.decode(transferData, (bool))),
            "Transfer to burner contract failed: check balance and allowance"
        );

        // 3. Attempt native burn(uint256) on the received tokens
        (bool burnSuccess, ) = token.call(abi.encodeWithSelector(IERC20Burnable.burn.selector, amount));

        if (burnSuccess) {
            emit TokensBurned(msg.sender, token, amount, "burn", block.timestamp);
        } else {
            // 4. Compatible fallback: transfer to dead address (permanently destroying circulating access)
            (bool deadSuccess, bytes memory deadData) = token.call(
                abi.encodeWithSignature("transfer(address,uint256)", DEAD_ADDRESS, amount)
            );
            require(
                deadSuccess && (deadData.length == 0 || abi.decode(deadData, (bool))),
                "Transfer to dead address failed"
            );
            emit TokensBurned(msg.sender, token, amount, "dead_address", block.timestamp);
        }
    }
}
