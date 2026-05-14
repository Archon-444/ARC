// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StakingRewards
 * @notice USDC staking with tiered membership and fee discounts
 * @dev Full implementation for v0.2+
 */
contract StakingRewards is ReentrancyGuard, Ownable {
    IERC20 public immutable USDC;

    struct Tier {
        uint256 threshold; // Minimum staked amount in USDC (6 decimals)
        uint16 feeDiscountBps; // Fee discount in basis points
        string name;
    }

    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 rewardDebt;
        uint256 rewards;
    }

    // Tier definitions
    Tier[] public tiers;

    // Reward rate: rewards per second per USDC staked
    uint256 public rewardRate = 1; // 1 wei per second per USDC (adjustable)
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    // Total staked amount
    uint256 public totalStaked;

    // Reward pool
    uint256 public rewardPool;

    // User stakes
    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public stakedBalance;

    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);
    event RewardPoolFunded(uint256 amount);
    event TierAdded(uint256 indexed index, uint256 threshold, uint16 feeDiscountBps, string name);
    event TierUpdated(uint256 indexed index, uint256 threshold, uint16 feeDiscountBps);

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        USDC = IERC20(_usdc);
        lastUpdateTime = block.timestamp;

        // Initialize default tiers
        // Bronze: 100 USDC, 10% discount
        tiers.push(Tier({
            threshold: 100 * 10**6,
            feeDiscountBps: 1000,
            name: "Bronze"
        }));

        // Silver: 500 USDC, 20% discount
        tiers.push(Tier({
            threshold: 500 * 10**6,
            feeDiscountBps: 2000,
            name: "Silver"
        }));

        // Gold: 2000 USDC, 35% discount
        tiers.push(Tier({
            threshold: 2000 * 10**6,
            feeDiscountBps: 3500,
            name: "Gold"
        }));

        // Platinum: 10000 USDC, 50% discount
        tiers.push(Tier({
            threshold: 10000 * 10**6,
            feeDiscountBps: 5000,
            name: "Platinum"
        }));
    }

    /**
     * @dev Update reward variables
     */
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (account != address(0)) {
            stakes[account].rewards = earned(account);
            stakes[account].rewardDebt = rewardPerTokenStored;
        }
        _;
    }

    /**
     * @notice Stake USDC tokens
     * @param amount Amount to stake
     */
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");

        StakeInfo storage userStake = stakes[msg.sender];

        // Transfer USDC from user
        USDC.transferFrom(msg.sender, address(this), amount);

        // Update stake info
        userStake.amount += amount;
        userStake.stakedAt = block.timestamp;
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Unstake USDC tokens
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot unstake 0");
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked balance");

        // Update stake info
        userStake.amount -= amount;
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        // Transfer USDC back to user
        USDC.transfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Claim accumulated rewards
     */
    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = stakes[msg.sender].rewards;
        require(reward > 0, "No rewards to claim");
        require(rewardPool >= reward, "Insufficient reward pool");

        stakes[msg.sender].rewards = 0;
        rewardPool -= reward;

        USDC.transfer(msg.sender, reward);

        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @notice Calculate reward per token
     */
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }

        return rewardPerTokenStored + (
            ((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked
        );
    }

    /**
     * @notice Calculate earned rewards for a user
     * @param account User address
     */
    function earned(address account) public view returns (uint256) {
        StakeInfo storage userStake = stakes[account];
        return (
            (userStake.amount * (rewardPerToken() - userStake.rewardDebt)) / 1e18
        ) + userStake.rewards;
    }

    /**
     * @notice Get user's tier based on staked balance
     * @param user User address
     * @return tier User's tier
     */
    function getUserTier(address user) external view returns (Tier memory tier) {
        uint256 balance = stakedBalance[user];

        // Find highest tier user qualifies for
        for (uint256 i = tiers.length; i > 0; i--) {
            if (balance >= tiers[i - 1].threshold) {
                return tiers[i - 1];
            }
        }

        // Return default tier if no match
        return Tier({threshold: 0, feeDiscountBps: 0, name: "None"});
    }

    /**
     * @notice Get fee discount for a user based on their tier
     * @param user User address
     * @return discountBps Fee discount in basis points
     */
    function getFeeDiscount(address user) external view returns (uint16 discountBps) {
        uint256 balance = stakedBalance[user];

        // Find highest tier user qualifies for
        for (uint256 i = tiers.length; i > 0; i--) {
            if (balance >= tiers[i - 1].threshold) {
                return tiers[i - 1].feeDiscountBps;
            }
        }

        return 0;
    }

    /**
     * @notice Get stake info for a user
     * @param user User address
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 stakedAt,
        uint256 rewards,
        Tier memory tier
    ) {
        StakeInfo storage userStake = stakes[user];
        amount = userStake.amount;
        stakedAt = userStake.stakedAt;
        rewards = earned(user);
        tier = this.getUserTier(user);
    }

    /**
     * @notice Get total tiers count
     * @return count Number of tiers
     */
    function getTiersCount() external view returns (uint256) {
        return tiers.length;
    }

    /**
     * @notice Get all tiers
     */
    function getAllTiers() external view returns (Tier[] memory) {
        return tiers;
    }

    // ==================== Admin Functions ====================

    /**
     * @notice Add a new tier
     * @param threshold Minimum staked amount
     * @param feeDiscountBps Fee discount in basis points
     * @param name Tier name
     */
    function addTier(
        uint256 threshold,
        uint16 feeDiscountBps,
        string calldata name
    ) external onlyOwner {
        require(feeDiscountBps <= 10000, "Invalid fee discount");

        tiers.push(Tier({
            threshold: threshold,
            feeDiscountBps: feeDiscountBps,
            name: name
        }));

        emit TierAdded(tiers.length - 1, threshold, feeDiscountBps, name);
    }

    /**
     * @notice Update an existing tier
     * @param index Tier index
     * @param threshold New threshold
     * @param feeDiscountBps New fee discount
     */
    function updateTier(
        uint256 index,
        uint256 threshold,
        uint16 feeDiscountBps
    ) external onlyOwner {
        require(index < tiers.length, "Invalid tier index");
        require(feeDiscountBps <= 10000, "Invalid fee discount");

        tiers[index].threshold = threshold;
        tiers[index].feeDiscountBps = feeDiscountBps;

        emit TierUpdated(index, threshold, feeDiscountBps);
    }

    /**
     * @notice Update reward rate
     * @param newRate New reward rate per second per USDC
     */
    function setRewardRate(uint256 newRate) external onlyOwner updateReward(address(0)) {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }

    /**
     * @notice Fund reward pool
     * @param amount Amount of USDC to add to reward pool
     */
    function fundRewardPool(uint256 amount) external onlyOwner {
        require(amount > 0, "Cannot fund 0");
        USDC.transferFrom(msg.sender, address(this), amount);
        rewardPool += amount;
        emit RewardPoolFunded(amount);
    }

    /**
     * @notice Emergency withdraw (owner only)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= USDC.balanceOf(address(this)) - totalStaked, "Cannot withdraw staked funds");
        USDC.transfer(owner(), amount);
    }
}
