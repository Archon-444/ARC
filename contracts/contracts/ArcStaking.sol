// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArcStaking
 * @dev USDC staking contract with tiered membership and rewards
 * Stakers earn platform rewards and get reduced marketplace fees
 */
contract ArcStaking is ReentrancyGuard, Ownable {
    IERC20 public usdc;

    // Membership tiers
    enum Tier {
        None,
        Bronze,   // 100 USDC
        Silver,   // 500 USDC
        Gold,     // 2000 USDC
        Platinum  // 10000 USDC
    }

    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 rewardDebt;
        Tier tier;
    }

    // Tier requirements (in USDC with 6 decimals)
    uint256 public constant BRONZE_THRESHOLD = 100 * 10**6;
    uint256 public constant SILVER_THRESHOLD = 500 * 10**6;
    uint256 public constant GOLD_THRESHOLD = 2000 * 10**6;
    uint256 public constant PLATINUM_THRESHOLD = 10000 * 10**6;

    // Fee discounts (in basis points)
    uint256 public constant BRONZE_DISCOUNT = 1000;   // 10%
    uint256 public constant SILVER_DISCOUNT = 2000;   // 20%
    uint256 public constant GOLD_DISCOUNT = 3500;     // 35%
    uint256 public constant PLATINUM_DISCOUNT = 5000; // 50%

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

    // Leaderboard (top stakers)
    address[] public topStakers;
    uint256 public constant LEADERBOARD_SIZE = 100;

    // Events
    event Staked(address indexed user, uint256 amount, Tier tier);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);
    event RewardPoolFunded(uint256 amount);
    event TierUpgraded(address indexed user, Tier oldTier, Tier newTier);

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
        lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Update reward variables
     */
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (account != address(0)) {
            stakes[account].rewardDebt = earned(account);
        }
        _;
    }

    /**
     * @dev Stake USDC
     */
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");

        StakeInfo storage userStake = stakes[msg.sender];
        Tier oldTier = userStake.tier;

        // Transfer USDC from user
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Update stake
        userStake.amount += amount;
        userStake.stakedAt = block.timestamp;
        totalStaked += amount;

        // Update tier
        Tier newTier = getTier(userStake.amount);
        userStake.tier = newTier;

        // Update leaderboard
        _updateLeaderboard(msg.sender);

        emit Staked(msg.sender, amount, newTier);

        if (newTier != oldTier) {
            emit TierUpgraded(msg.sender, oldTier, newTier);
        }
    }

    /**
     * @dev Unstake USDC
     */
    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient stake");
        require(amount > 0, "Cannot unstake 0");

        Tier oldTier = userStake.tier;

        // Update stake
        userStake.amount -= amount;
        totalStaked -= amount;

        // Update tier
        Tier newTier = getTier(userStake.amount);
        userStake.tier = newTier;

        // Transfer USDC back to user
        require(usdc.transfer(msg.sender, amount), "Transfer failed");

        // Update leaderboard
        _updateLeaderboard(msg.sender);

        emit Unstaked(msg.sender, amount);

        if (newTier != oldTier) {
            emit TierUpgraded(msg.sender, oldTier, newTier);
        }
    }

    /**
     * @dev Claim rewards
     */
    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = stakes[msg.sender].rewardDebt;
        require(reward > 0, "No rewards");
        require(rewardPool >= reward, "Insufficient reward pool");

        stakes[msg.sender].rewardDebt = 0;
        rewardPool -= reward;

        require(usdc.transfer(msg.sender, reward), "Transfer failed");

        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @dev Get user's tier based on staked amount
     */
    function getTier(uint256 amount) public pure returns (Tier) {
        if (amount >= PLATINUM_THRESHOLD) return Tier.Platinum;
        if (amount >= GOLD_THRESHOLD) return Tier.Gold;
        if (amount >= SILVER_THRESHOLD) return Tier.Silver;
        if (amount >= BRONZE_THRESHOLD) return Tier.Bronze;
        return Tier.None;
    }

    /**
     * @dev Get user's fee discount based on tier
     */
    function getFeeDiscount(address user) external view returns (uint256) {
        Tier tier = stakes[user].tier;

        if (tier == Tier.Platinum) return PLATINUM_DISCOUNT;
        if (tier == Tier.Gold) return GOLD_DISCOUNT;
        if (tier == Tier.Silver) return SILVER_DISCOUNT;
        if (tier == Tier.Bronze) return BRONZE_DISCOUNT;
        return 0;
    }

    /**
     * @dev Calculate reward per token
     */
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }

        return rewardPerTokenStored +
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked);
    }

    /**
     * @dev Calculate earned rewards for a user
     */
    function earned(address account) public view returns (uint256) {
        StakeInfo memory userStake = stakes[account];
        return ((userStake.amount * (rewardPerToken() - rewardPerTokenStored)) / 1e18) +
               userStake.rewardDebt;
    }

    /**
     * @dev Get user stake info
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 stakedAt,
        uint256 rewards,
        Tier tier,
        uint256 feeDiscount
    ) {
        StakeInfo memory userStake = stakes[user];
        return (
            userStake.amount,
            userStake.stakedAt,
            earned(user),
            userStake.tier,
            this.getFeeDiscount(user)
        );
    }

    /**
     * @dev Update leaderboard
     */
    function _updateLeaderboard(address user) internal {
        // Remove user from leaderboard if exists
        for (uint256 i = 0; i < topStakers.length; i++) {
            if (topStakers[i] == user) {
                topStakers[i] = topStakers[topStakers.length - 1];
                topStakers.pop();
                break;
            }
        }

        // Add user back if they have stakes
        if (stakes[user].amount > 0) {
            if (topStakers.length < LEADERBOARD_SIZE) {
                topStakers.push(user);
            } else {
                // Find the lowest staker
                uint256 lowestIndex = 0;
                uint256 lowestAmount = stakes[topStakers[0]].amount;

                for (uint256 i = 1; i < topStakers.length; i++) {
                    if (stakes[topStakers[i]].amount < lowestAmount) {
                        lowestIndex = i;
                        lowestAmount = stakes[topStakers[i]].amount;
                    }
                }

                // Replace if user has more staked
                if (stakes[user].amount > lowestAmount) {
                    topStakers[lowestIndex] = user;
                }
            }
        }
    }

    /**
     * @dev Get top stakers (leaderboard)
     */
    function getTopStakers(uint256 count) external view returns (
        address[] memory stakers,
        uint256[] memory amounts,
        Tier[] memory tiers
    ) {
        uint256 length = count > topStakers.length ? topStakers.length : count;

        stakers = new address[](length);
        amounts = new uint256[](length);
        tiers = new Tier[](length);

        // Create a sorted copy
        address[] memory sortedStakers = new address[](topStakers.length);
        for (uint256 i = 0; i < topStakers.length; i++) {
            sortedStakers[i] = topStakers[i];
        }

        // Simple bubble sort (good enough for small arrays)
        for (uint256 i = 0; i < sortedStakers.length; i++) {
            for (uint256 j = i + 1; j < sortedStakers.length; j++) {
                if (stakes[sortedStakers[i]].amount < stakes[sortedStakers[j]].amount) {
                    address temp = sortedStakers[i];
                    sortedStakers[i] = sortedStakers[j];
                    sortedStakers[j] = temp;
                }
            }
        }

        for (uint256 i = 0; i < length; i++) {
            stakers[i] = sortedStakers[i];
            amounts[i] = stakes[sortedStakers[i]].amount;
            tiers[i] = stakes[sortedStakers[i]].tier;
        }

        return (stakers, amounts, tiers);
    }

    /**
     * @dev Get total stakers count
     */
    function getTotalStakersCount() external view returns (uint256) {
        return topStakers.length;
    }

    /**
     * @dev Update reward rate (only owner)
     */
    function setRewardRate(uint256 _rewardRate) external onlyOwner updateReward(address(0)) {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }

    /**
     * @dev Fund reward pool (anyone can fund)
     */
    function fundRewardPool(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot fund 0");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        rewardPool += amount;
        emit RewardPoolFunded(amount);
    }

    /**
     * @dev Get statistics
     */
    function getStatistics() external view returns (
        uint256 _totalStaked,
        uint256 _rewardPool,
        uint256 _rewardRate,
        uint256 _totalStakers
    ) {
        return (
            totalStaked,
            rewardPool,
            rewardRate,
            topStakers.length
        );
    }
}
