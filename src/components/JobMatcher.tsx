import React from 'react';
import { JobMatcher as MatcherFeature, JobMatcherProps } from '../features/matcher/JobMatcher';

export const JobMatcher: React.FC<JobMatcherProps> = (props) => {
  return <MatcherFeature {...props} />;
};

export { JobMatcher as MatcherView } from '../features/matcher/JobMatcher';
export { JDInputModes } from '../features/matcher/JDInputModes';
export { JobBoard } from '../features/matcher/JobBoard';
export { JobCard } from '../features/matcher/JobCard';
