import React from 'react';
import { AuthModal as AuthModalFeature, AuthModalProps } from '../features/auth/AuthModal';

export const AuthModal: React.FC<AuthModalProps> = (props) => {
  return <AuthModalFeature {...props} />;
};

export { AuthModal as AuthDialog } from '../features/auth/AuthModal';
