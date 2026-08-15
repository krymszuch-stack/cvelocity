import React from 'react';
import { AtsSimulatorView as AtsView, AtsSimulatorViewProps } from '../features/matcher/AtsSimulatorView';

export const AtsSimulatorView: React.FC<AtsSimulatorViewProps> = (props) => {
  return <AtsView {...props} />;
};

export { AtsSimulatorView as AtsView } from '../features/matcher/AtsSimulatorView';
export { ScoreRing } from '../features/matcher/ScoreRing';
export { GapAnalysis } from '../features/matcher/GapAnalysis';
export { DealbreakerList } from '../features/matcher/DealbreakerList';
