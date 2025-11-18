// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title StakingRewards (STUB for v0.1)
 * @notice Basic structure and events defined, implementation deferred to v0.2+
 * @dev This is a stub contract - functions revert with "Not implemented"
 */
contract StakingRewards {
    struct Tier {
        uint256 threshold; // e.g. min staked or volume
        uint16 feeDiscountBps;
    }

    mapping(address => uint256) public stakedBalance;
    Tier[] public tiers;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event TierUpdated(uint256 indexed index, uint256 threshold, uint16 feeDiscountBps);

    /**
     * @notice Stake tokens (NOT IMPLEMENTED in v0.1)
     * @param amount Amount to stake
     */
    function stake(uint256 amount) external {
        revert("Not implemented");
    }

    /**
     * @notice Unstake tokens (NOT IMPLEMENTED in v0.1)
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external {
        revert("Not implemented");
    }

    /**
     * @notice Get user's tier based on staked balance
     * @param user User address
     * @return tier User's tier
     */
    function getUserTier(address user) external view returns (Tier memory tier) {
        uint256 balance = stakedBalance[user];

        // Basic read-only logic
        for (uint256 i = tiers.length; i > 0; i--) {
            if (balance >= tiers[i - 1].threshold) {
                return tiers[i - 1];
            }
        }

        // Return default tier if no match
        return Tier({threshold: 0, feeDiscountBps: 0});
    }

    /**
     * @notice Get total tiers count
     * @return count Number of tiers
     */
    function getTiersCount() external view returns (uint256) {
        return tiers.length;
    }
}
