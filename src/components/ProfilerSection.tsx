import React from 'react';
import { ProfilerSection as ProfilerModule, ProfilerSectionProps } from '../features/profiler/ProfilerSection';

export const ProfilerSection: React.FC<ProfilerSectionProps> = (props) => {
  return <ProfilerModule {...props} />;
};

export { ProfilerSection as ProfilerView } from '../features/profiler/ProfilerSection';
export { LicenseGrid } from '../features/profiler/LicenseGrid';
export { CommuteMap } from '../features/profiler/CommuteMap';
