import React from 'react';
import { CoverLetterView as CoverLetterModule, CoverLetterViewProps } from '../features/matcher/CoverLetterView';

export const CoverLetterView: React.FC<CoverLetterViewProps> = (props) => {
  return <CoverLetterModule {...props} />;
};

export { CoverLetterView as CoverLetterDoc } from '../features/matcher/CoverLetterView';
