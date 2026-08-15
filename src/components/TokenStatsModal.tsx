import React from 'react';
import { TokenStatsModal as TokenStatsFeature, TokenStatsModalProps } from '../features/stats/TokenStatsModal';

export const TokenStatsModal: React.FC<TokenStatsModalProps> = (props) => {
  return <TokenStatsFeature {...props} />;
};

export { TokenStatsModal as StatsModal } from '../features/stats/TokenStatsModal';
