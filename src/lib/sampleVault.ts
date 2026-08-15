import { MasterVault } from '../types';

export const createEmptyVault = (fullName: string = '', email: string = ''): MasterVault => ({
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  profiler: {
    flags: [],
    experienceLevel: 'MID',
    location: {
      city: '',
      radiusKm: 0,
      willingnessToTravel: false,
      hybridWork: false,
      remoteOnly: false,
    },
    languages: [],
  },
  personalInfo: {
    fullName: fullName,
    email: email,
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
    photoUrl: '',
    title: '',
    summary: '',
  },
  skillsMatrix: {
    hardSkills: [],
    softSkills: [],
    toolsAndTech: [],
    certifications: [],
  },
  history: [],
  education: [],
  projects: [],
});

