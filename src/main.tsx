import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { migrateLegacyKeys } from './lib/storage.ts';
import './index.css';

// Musi pójść przed pierwszym renderem: komponenty czytają swój stan
// z localStorage w leniwych inicjalizatorach `useState`, więc przeniesienie
// kluczy po zamontowaniu drzewa przyszłoby o jeden render za późno i
// użytkownik zobaczyłby pusty profil, zanim dane wróciłyby na swoje miejsce.
migrateLegacyKeys();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
