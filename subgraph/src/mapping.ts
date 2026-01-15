import { BigInt } from "@graphprotocol/graph-ts"
import {
  ListingCreated,
  ListingSold,
  ListingCancelled,
  AuctionCreated,
  BidPlaced,
  AuctionEnded,
  AuctionCancelled
} from "../generated/MarketplaceFacet/MarketplaceFacet"
import {
  OfferAccepted,
  OfferCancelled
} from "../generated/OfferFacet/OfferFacet"
import { Listing, Auction, Bid, Offer, User, Collection, Token } from "../generated/schema"

export function handleListingCreated(event: ListingCreated): void {
  let listing = new Listing(event.params.listingId.toString())
  listing.seller = event.params.seller.toHexString()
  listing.token = event.params.nftContract.toHexString() + "-" + event.params.tokenId.toString()
  listing.price = event.params.price
  listing.createdAtTimestamp = event.block.timestamp
  listing.status = "ACTIVE"
  listing.save()

  // Update Token
  let token = Token.load(listing.token)
  if (token) {
    token.activeListing = listing.id
    token.save()
  }
}

export function handleListingSold(event: ListingSold): void {
  let listing = Listing.load(event.params.listingId.toString())
  if (listing) {
    listing.status = "SOLD"
    listing.soldAtTimestamp = event.block.timestamp
    listing.buyer = event.params.buyer.toHexString()
    listing.save()
    
    // Clear active listing on token
    let token = Token.load(listing.token)
    if (token) {
      token.activeListing = null
      token.save()
    }
  }
}

export function handleListingCancelled(event: ListingCancelled): void {
  let listing = Listing.load(event.params.listingId.toString())
  if (listing) {
    listing.status = "CANCELLED"
    listing.save()

    let token = Token.load(listing.token)
    if (token) {
      token.activeListing = null
      token.save()
    }
  }
}

export function handleAuctionCreated(event: AuctionCreated): void {
  let auction = new Auction(event.params.auctionId.toString())
  auction.seller = event.params.seller.toHexString()
  auction.token = event.params.nftContract.toHexString() + "-" + event.params.tokenId.toString()
  auction.startingPrice = event.params.startingPrice
  auction.duration = event.params.endTime.minus(event.block.timestamp)
  auction.endTime = event.params.endTime
  auction.status = "ACTIVE"
  auction.save()

  let token = Token.load(auction.token)
  if (token) {
    token.activeAuction = auction.id
    token.save()
  }
}

export function handleBidPlaced(event: BidPlaced): void {
  let bidId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let bid = new Bid(bidId)
  bid.auction = event.params.auctionId.toString()
  bid.bidder = event.params.bidder.toHexString()
  bid.amount = event.params.amount
  bid.timestamp = event.block.timestamp
  bid.save()

  let auction = Auction.load(event.params.auctionId.toString())
  if (auction) {
    auction.highestBid = event.params.amount
    auction.highestBidder = event.params.bidder.toHexString()
    auction.save()
  }
}

export function handleAuctionEnded(event: AuctionEnded): void {
  let auction = Auction.load(event.params.auctionId.toString())
  if (auction) {
    auction.status = "ENDED"
    auction.save()

    let token = Token.load(auction.token)
    if (token) {
      token.activeAuction = null
      token.save()
    }
  }
}

export function handleOfferAccepted(event: OfferAccepted): void {
  let offerId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let offer = new Offer(offerId)
  offer.maker = event.params.maker.toHexString()
  offer.taker = event.params.taker.toHexString()
  offer.token = event.params.nftContract.toHexString() + "-" + event.params.tokenId.toString()
  offer.collection = event.params.nftContract.toHexString()
  offer.price = event.params.price
  offer.status = "ACCEPTED"
  offer.save()
}
