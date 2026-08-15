import React from 'react';
import { MasterVaultEditor as VaultEditor, MasterVaultEditorProps } from '../features/vault/MasterVaultEditor';

export const MasterVaultEditor: React.FC<MasterVaultEditorProps> = (props) => {
  return <VaultEditor {...props} />;
};

export { MasterVaultEditor as VaultEditor } from '../features/vault/MasterVaultEditor';
export { PersonalSection } from '../features/vault/PersonalSection';
export { EducationSection } from '../features/vault/EducationSection';
export { PreferencesSection } from '../features/vault/PreferencesSection';
export { StepIndicator } from '../features/vault/StepIndicator';
