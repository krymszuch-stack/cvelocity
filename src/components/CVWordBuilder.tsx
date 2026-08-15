import React from 'react';
import { CVWordBuilder as WordBuilder, CVWordBuilderProps } from '../features/matcher/CVWordBuilder';

export const CVWordBuilder: React.FC<CVWordBuilderProps> = (props) => {
  return <WordBuilder {...props} />;
};

export { CVWordBuilder as WordBuilder } from '../features/matcher/CVWordBuilder';
