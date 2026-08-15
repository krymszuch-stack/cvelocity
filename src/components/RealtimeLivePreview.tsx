import React from 'react';
import { RealtimeLivePreview as LivePreview, RealtimeLivePreviewProps } from '../features/matcher/RealtimeLivePreview';

export const RealtimeLivePreview: React.FC<RealtimeLivePreviewProps> = (props) => {
  return <LivePreview {...props} />;
};

export { RealtimeLivePreview as LivePreview } from '../features/matcher/RealtimeLivePreview';
