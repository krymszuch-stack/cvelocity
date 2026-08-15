import React from 'react';
import { ApplicationTracker as TrackerFeature } from '../features/tracker/ApplicationTracker';

export const ApplicationTracker: React.FC = () => {
  return <TrackerFeature />;
};

export default ApplicationTracker;
export { StatusSelect } from '../features/tracker/StatusSelect';
export { TrackerTable } from '../features/tracker/TrackerTable';
export { ApplicationModal } from '../features/tracker/ApplicationModal';
export type { JobApplication } from '../features/tracker/ApplicationModal';
export type { ApplicationStatus } from '../features/tracker/StatusSelect';
