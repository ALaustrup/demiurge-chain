export { artistService } from './artist-service';
export { releaseService } from './release-service';
export { 
  validateArtistName, 
  requiresVerification, 
  getReservedNames,
  RESERVED_ARTIST_NAMES 
} from './artist-validation';

export type { ArtistRegistrationData, ArtistRegistrationResult } from './artist-service';
export type { TrackUploadData, ReleaseCreationData, ReleaseCreationResult } from './release-service';
export type { NameValidationResult } from './artist-validation';
