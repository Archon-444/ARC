// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProfileRegistry
 * @dev Minimal on-chain registry for user profile metadata
 * Stores profile metadata URIs (IPFS/HTTPS) with avatar, displayName, bio, socials
 */
contract ProfileRegistry {
    struct Profile {
        string metadataURI; // IPFS/HTTPS URL to JSON metadata
        uint256 updatedAt;
        bool exists;
    }

    // User address => Profile
    mapping(address => Profile) public profiles;

    // Following system (optional for v1)
    mapping(address => mapping(address => bool)) public isFollowing;
    mapping(address => uint256) public followerCount;
    mapping(address => uint256) public followingCount;

    // Events
    event ProfileUpdated(address indexed user, string metadataURI, uint256 timestamp);
    event ProfileDeleted(address indexed user);
    event Followed(address indexed follower, address indexed followed);
    event Unfollowed(address indexed follower, address indexed unfollowed);

    /**
     * @dev Set or update profile metadata
     * @param metadataURI URL to profile metadata JSON
     */
    function setProfile(string calldata metadataURI) external {
        require(bytes(metadataURI).length > 0, "Empty metadata URI");

        profiles[msg.sender] = Profile({
            metadataURI: metadataURI,
            updatedAt: block.timestamp,
            exists: true
        });

        emit ProfileUpdated(msg.sender, metadataURI, block.timestamp);
    }

    /**
     * @dev Delete profile
     */
    function deleteProfile() external {
        require(profiles[msg.sender].exists, "Profile does not exist");

        delete profiles[msg.sender];

        emit ProfileDeleted(msg.sender);
    }

    /**
     * @dev Get profile for a user
     * @param user Address to query
     */
    function getProfile(address user) external view returns (
        string memory metadataURI,
        uint256 updatedAt,
        bool exists
    ) {
        Profile memory profile = profiles[user];
        return (profile.metadataURI, profile.updatedAt, profile.exists);
    }

    /**
     * @dev Check if profile exists
     * @param user Address to check
     */
    function hasProfile(address user) external view returns (bool) {
        return profiles[user].exists;
    }

    /**
     * @dev Follow a user
     * @param user Address to follow
     */
    function follow(address user) external {
        require(user != msg.sender, "Cannot follow yourself");
        require(!isFollowing[msg.sender][user], "Already following");

        isFollowing[msg.sender][user] = true;
        followerCount[user]++;
        followingCount[msg.sender]++;

        emit Followed(msg.sender, user);
    }

    /**
     * @dev Unfollow a user
     * @param user Address to unfollow
     */
    function unfollow(address user) external {
        require(isFollowing[msg.sender][user], "Not following");

        isFollowing[msg.sender][user] = false;
        followerCount[user]--;
        followingCount[msg.sender]--;

        emit Unfollowed(msg.sender, user);
    }

    /**
     * @dev Get social stats for a user
     * @param user Address to query
     */
    function getSocialStats(address user) external view returns (
        uint256 followers,
        uint256 following
    ) {
        return (followerCount[user], followingCount[user]);
    }

    /**
     * @dev Batch get profiles
     * @param users Array of addresses
     */
    function getProfilesBatch(address[] calldata users) external view returns (
        string[] memory metadataURIs,
        uint256[] memory updatedAts,
        bool[] memory existsArray
    ) {
        uint256 length = users.length;
        metadataURIs = new string[](length);
        updatedAts = new uint256[](length);
        existsArray = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            Profile memory profile = profiles[users[i]];
            metadataURIs[i] = profile.metadataURI;
            updatedAts[i] = profile.updatedAt;
            existsArray[i] = profile.exists;
        }

        return (metadataURIs, updatedAts, existsArray);
    }
}
