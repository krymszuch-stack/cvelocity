import React from 'react';
import { DocumentRenderer as DocRenderer, DocumentRendererProps } from '../features/matcher/DocumentRenderer';

export const DocumentRenderer: React.FC<DocumentRendererProps> = (props) => {
  return <DocRenderer {...props} />;
};

export { DocumentRenderer as DocRenderer } from '../features/matcher/DocumentRenderer';
