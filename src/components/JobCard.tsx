import React from 'react';
import { JobCard as FeatureJobCard, JobCardProps as FeatureJobCardProps } from '../features/matcher/JobCard';
import { JobOffer } from '../types';

export type { JobOffer } from '../types';
export type JobCardProps = FeatureJobCardProps;

export const JobCard: React.FC<JobCardProps> = (props) => {
  return <FeatureJobCard {...props} />;
};

export { FeatureJobCard as Card };
