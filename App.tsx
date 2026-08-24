import React from 'react';
import { ActiveFastProvider } from './contexts/ActiveFastContext';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <ActiveFastProvider>
      <RootNavigator />
    </ActiveFastProvider>
  );
}
