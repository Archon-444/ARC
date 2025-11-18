// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ProfileRegistry
 * @notice Minimal on-chain registry of user profile metadata
 * @dev Users can set their profile metadata URI (IPFS/Arweave/HTTPS)
 */
contract ProfileRegistry {
    struct Profile {
        string metadataURI; // IPFS/HTTPS with avatar, displayName, bio, socials
    }

    // user address => Profile
    mapping(address => Profile) public profiles;

    // Events
    event ProfileUpdated(address indexed user, string metadataURI);

    /**
     * @notice Set profile metadata URI for caller
     * @param metadataURI URI pointing to profile JSON metadata
     */
    function setProfile(string calldata metadataURI) external {
        profiles[msg.sender].metadataURI = metadataURI;
        emit ProfileUpdated(msg.sender, metadataURI);
    }

    /**
     * @notice Get profile for a user
     * @param user User address
     * @return Profile struct
     */
    function getProfile(address user) external view returns (Profile memory) {
        return profiles[user];
    }

    /**
     * @notice Get profile metadata URI for a user
     * @param user User address
     * @return metadataURI string
     */
    function getProfileURI(address user) external view returns (string memory) {
        return profiles[user].metadataURI;
    }
}
