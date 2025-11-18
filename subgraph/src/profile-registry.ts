import { log } from "@graphprotocol/graph-ts";
import { ProfileUpdated } from "../generated/ProfileRegistry/ProfileRegistry";
import { Profile } from "../generated/schema";
import { getOrCreateUser } from "./helpers";

export function handleProfileUpdated(event: ProfileUpdated): void {
  let user = getOrCreateUser(event.params.user);

  // Get or create profile
  let profile = Profile.load(user.id);

  if (profile == null) {
    profile = new Profile(user.id);
    profile.user = user.id;
    profile.createdAt = event.block.timestamp;
  }

  profile.metadataURI = event.params.metadataURI;
  profile.updatedAt = event.block.timestamp;
  profile.save();

  // Link profile to user
  user.profile = profile.id;
  user.updatedAt = event.block.timestamp;
  user.save();

  log.info("Profile updated for user {} with URI {}", [
    user.id,
    event.params.metadataURI,
  ]);
}
