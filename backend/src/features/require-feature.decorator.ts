import { SetMetadata } from '@nestjs/common';

export const REQUIRED_FEATURE_KEY = 'requiredFeature';

// Attach the required feature code so FeatureGuard can enforce access per endpoint.
export const RequireFeature = (featureCode: string) =>
  SetMetadata(REQUIRED_FEATURE_KEY, featureCode);
