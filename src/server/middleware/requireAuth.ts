import { NextFunction, Request, Response } from 'express';
import { loadConfig } from '../config';
import { getSupabase } from '../supabase';

/**
 * Weryfikacja tokenu sesji Supabase.
 *
 * Token przychodzi w nagłówku `Authorization: Bearer <jwt>` i jest sprawdzany
 * u dostawcy, a nie tylko dekodowany. Samo odczytanie ładunku JWT bez weryfikacji
 * podpisu przyjęłoby dowolny token wymyślony przez klienta — łącznie z takim,
 * w którym `sub` wskazuje na cudze konto.
 *
 * `req.user.id` ustawione tutaj jest **jedynym** dopuszczalnym źródłem
 * identyfikatora użytkownika w trasach. Klient `service_role` omija RLS, więc
 * `user_id` wzięty z ciała żądania byłby zaproszeniem do odczytu cudzych danych.
 */

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

function unauthorized(res: Response, message: string): void {
  res.status(401).json({ success: false, error: message });
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const config = loadConfig();

  if (!config.backendEnabled) {
    // Trasy kont istnieją tylko wtedy, gdy jest gdzie trzymać konta. 501 mówi
    // wprost "ta instalacja tego nie robi", zamiast udawać, że użytkownik podał
    // zły token.
    res.status(501).json({
      success: false,
      error: 'Konta użytkowników nie są uruchomione w tej instalacji.',
    });
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    unauthorized(res, 'Wymagane zalogowanie.');
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    unauthorized(res, 'Wymagane zalogowanie.');
    return;
  }

  try {
    const { data, error } = await getSupabase().auth.getUser(token);

    if (error || !data.user) {
      unauthorized(res, 'Sesja wygasła. Zaloguj się ponownie.');
      return;
    }

    req.user = { id: data.user.id, email: data.user.email ?? undefined };
    next();
  } catch (err) {
    // Niedostępny dostawca tożsamości to awaria po naszej stronie, nie błąd
    // użytkownika — 401 kazałoby mu bezskutecznie logować się od nowa.
    next(err);
  }
}
