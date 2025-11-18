// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ArcMarketNFT
 * @dev NFT contract with built-in royalty support (EIP-2981)
 * Supports multi-creator revenue splits and verified creator badges
 */
contract ArcMarketNFT is ERC721, ERC721URIStorage, ERC721Royalty, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // Mapping from token ID to creator address
    mapping(uint256 => address) public tokenCreator;

    // Mapping from creator to verified status
    mapping(address => bool) public verifiedCreators;

    // Mapping from token ID to multiple creators and their splits
    mapping(uint256 => Creator[]) public tokenCreators;

    struct Creator {
        address creator;
        uint96 share; // Basis points (10000 = 100%)
    }

    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed creator, string tokenURI);
    event CreatorVerified(address indexed creator);
    event CreatorUnverified(address indexed creator);
    event RoyaltySplit(uint256 indexed tokenId, Creator[] creators);

    constructor() ERC721("ArcMarket NFT", "ARCNFT") Ownable(msg.sender) {}

    /**
     * @dev Mint a new NFT with royalty information
     * @param to Address to mint the NFT to
     * @param uri Token URI (metadata)
     * @param royaltyReceiver Address to receive royalties
     * @param royaltyFeeNumerator Royalty fee in basis points (e.g., 500 = 5%)
     */
    function mint(
        address to,
        string memory uri,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _setTokenRoyalty(tokenId, royaltyReceiver, royaltyFeeNumerator);

        tokenCreator[tokenId] = msg.sender;

        emit NFTMinted(tokenId, msg.sender, uri);

        return tokenId;
    }

    /**
     * @dev Mint NFT with multiple creators and revenue split
     * @param to Address to mint the NFT to
     * @param uri Token URI (metadata)
     * @param creators Array of creators with their revenue shares
     */
    function mintWithSplit(
        address to,
        string memory uri,
        Creator[] memory creators
    ) public returns (uint256) {
        require(creators.length > 0, "At least one creator required");

        uint96 totalShare = 0;
        for (uint256 i = 0; i < creators.length; i++) {
            totalShare += creators[i].share;
            tokenCreators[_tokenIdCounter.current()].push(creators[i]);
        }
        require(totalShare == 10000, "Total shares must equal 10000 (100%)");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        // Set royalty to first creator (marketplace will handle splits)
        _setTokenRoyalty(tokenId, creators[0].creator, 500); // Default 5% royalty

        tokenCreator[tokenId] = msg.sender;

        emit NFTMinted(tokenId, msg.sender, uri);
        emit RoyaltySplit(tokenId, creators);

        return tokenId;
    }

    /**
     * @dev Batch mint multiple NFTs
     * @param to Address to mint the NFTs to
     * @param uris Array of token URIs
     * @param royaltyReceiver Address to receive royalties
     * @param royaltyFeeNumerator Royalty fee in basis points
     */
    function batchMint(
        address to,
        string[] memory uris,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) public returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](uris.length);

        for (uint256 i = 0; i < uris.length; i++) {
            tokenIds[i] = mint(to, uris[i], royaltyReceiver, royaltyFeeNumerator);
        }

        return tokenIds;
    }

    /**
     * @dev Verify a creator (only owner)
     * @param creator Address to verify
     */
    function verifyCreator(address creator) public onlyOwner {
        verifiedCreators[creator] = true;
        emit CreatorVerified(creator);
    }

    /**
     * @dev Unverify a creator (only owner)
     * @param creator Address to unverify
     */
    function unverifyCreator(address creator) public onlyOwner {
        verifiedCreators[creator] = false;
        emit CreatorUnverified(creator);
    }

    /**
     * @dev Check if a creator is verified
     * @param creator Address to check
     */
    function isVerifiedCreator(address creator) public view returns (bool) {
        return verifiedCreators[creator];
    }

    /**
     * @dev Get all creators and their shares for a token
     * @param tokenId Token ID to query
     */
    function getTokenCreators(uint256 tokenId) public view returns (Creator[] memory) {
        return tokenCreators[tokenId];
    }

    /**
     * @dev Get total supply of NFTs
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage, ERC721Royalty) {
        super._burn(tokenId);
    }
}
