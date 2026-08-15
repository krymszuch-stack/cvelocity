import React from 'react';
import { GeminiAdvisorModal as AdvisorFeature, GeminiAdvisorModalProps } from '../features/advisor/GeminiAdvisorModal';

export const GeminiAdvisorModal: React.FC<GeminiAdvisorModalProps> = (props) => {
  return <AdvisorFeature {...props} />;
};

export { GeminiAdvisorModal as AdvisorModal } from '../features/advisor/GeminiAdvisorModal';
