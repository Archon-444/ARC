import { gql } from 'graphql-request';

export const GET_LISTINGS = gql`
  query GetListings(
    $first: Int!
    $skip: Int!
    $orderBy: Listing_orderBy
    $orderDirection: OrderDirection
    $where: Listing_filter
  ) {
    listings(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      collection
      tokenId
      seller
      price
      status
      createdAt
      updatedAt
      nft {
        id
        name
        image
        tokenURI
        collection {
          id
          name
          symbol
          floorPrice
          totalVolume
        }
      }
    }
  }
`;

export const GET_AUCTIONS = gql`
  query GetAuctions(
    $first: Int!
    $skip: Int!
    $where: Auction_filter
  ) {
    auctions(
      first: $first
      skip: $skip
      orderBy: endTime
      orderDirection: asc
      where: $where
    ) {
      id
      collection
      tokenId
      seller
      reservePrice
      highestBid
      highestBidder
      startTime
      endTime
      status
      nft {
        id
        name
        image
        collection {
          name
        }
      }
      bids(orderBy: amount, orderDirection: desc, first: 5) {
        id
        bidder
        amount
        timestamp
      }
    }
  }
`;

export const GET_COLLECTION = gql`
  query GetCollection($id: ID!) {
    collection(id: $id) {
      id
      address
      name
      symbol
      totalVolume
      totalSales
      floorPrice
      listedCount
      ownerCount
      nfts(first: 1000) {
        id
        tokenId
        name
        image
        owner
        listing {
          price
          status
        }
      }
    }
  }
`;

export const GET_NFT_DETAILS = gql`
  query GetNFTDetails($id: String!) {
    nft(id: $id) {
      id
      tokenId
      name
      description
      image
      tokenURI
      owner
      creator
      collection {
        id
        name
        floorPrice
      }
      listing {
        id
        price
        seller
        createdAt
      }
      auction {
        id
        reservePrice
        highestBid
        highestBidder
        endTime
        status
      }
      sales(orderBy: timestamp, orderDirection: desc, first: 10) {
        id
        price
        buyer
        seller
        timestamp
      }
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUserProfile($address: String!) {
    user(id: $address) {
      id
      ownedNFTs(first: 100) {
        id
        tokenId
        name
        image
        collection {
          name
        }
      }
      listings(first: 100, where: { status: ACTIVE }) {
        id
        nft {
          id
          name
          image
        }
        price
      }
      sales(first: 100, orderBy: timestamp, orderDirection: desc) {
        id
        nft {
          name
          image
        }
        price
        timestamp
      }
    }
  }
`;

export const GET_MARKETPLACE_STATS = gql`
  query GetMarketplaceStats {
    marketplaceDailySnapshot(id: "latest") {
      totalVolume
      dailyVolume
      totalSales
      dailySales
      activeListings
      activeAuctions
      uniqueBuyers
      uniqueSellers
    }
    collections(
      first: 10
      orderBy: totalVolume
      orderDirection: desc
    ) {
      id
      name
      totalVolume
      floorPrice
      totalSales
    }
  }
`;
