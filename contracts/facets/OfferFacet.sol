// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { LibMarketplace } from "../libraries/LibMarketplace.sol";
import { LibDiamond } from "../libraries/LibDiamond.sol";

contract OfferFacet is EIP712 {
    bytes32 private constant OFFER_TYPEHASH = keccak256("Offer(address maker,address nftContract,uint256 tokenId,uint256 price,uint256 expiration,uint256 nonce)");

    // Mapping to track used nonces to prevent replay attacks
    // maker => nonce => used
    mapping(address => mapping(uint256 => bool)) private _cancelledOrFilled;

    event OfferAccepted(address indexed maker, address indexed taker, address nftContract, uint256 tokenId, uint256 price);
    event OfferCancelled(address indexed maker, uint256 nonce);

    constructor() EIP712("ArcMarketplace", "1") {}

    modifier nonReentrant() {
        LibMarketplace.MarketplaceStorage storage ms = LibMarketplace.marketplaceStorage();
        require(ms._status != 2, "ReentrancyGuard: reentrant call");
        ms._status = 2;
        _;
        ms._status = 1;
    }

    function acceptOffer(
        address maker,
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 expiration,
        uint256 nonce,
        bytes calldata signature
    ) external nonReentrant {
        require(block.timestamp < expiration, "Offer expired");
        require(!_cancelledOrFilled[maker][nonce], "Offer already used/cancelled");

        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            OFFER_TYPEHASH,
            maker,
            nftContract,
            tokenId,
            price,
            expiration,
            nonce
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        require(signer == maker, "Invalid signature");

        // Mark as used
        _cancelledOrFilled[maker][nonce] = true;

        // Execute Trade
        LibMarketplace.MarketplaceStorage storage ms = LibMarketplace.marketplaceStorage();
        
        // Transfer NFT from Taker (Seller) to Maker (Buyer)
        IERC721(nftContract).transferFrom(msg.sender, maker, tokenId);

        // Distribute Payment (Maker pays Taker)
        // Calculate fees
        uint256 fee = (price * ms.platformFee) / 10000;
        // Simple royalty lookup (can be shared with MarketplaceFacet via internal lib function if refactored)
        // For now, simplified:
        uint256 sellerAmount = price - fee;
        
        // Transfer USDC from Maker
        require(ms.usdc.transferFrom(maker, msg.sender, sellerAmount), "Payment to seller failed");
        if (fee > 0) {
            require(ms.usdc.transferFrom(maker, ms.feeRecipient, fee), "Fee payment failed");
        }

        emit OfferAccepted(maker, msg.sender, nftContract, tokenId, price);
    }

    function cancelOffer(uint256 nonce) external {
        _cancelledOrFilled[msg.sender][nonce] = true;
        emit OfferCancelled(msg.sender, nonce);
    }
    
    function isNonceUsed(address maker, uint256 nonce) external view returns (bool) {
        return _cancelledOrFilled[maker][nonce];
    }
}
