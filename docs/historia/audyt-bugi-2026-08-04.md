# Raport z testów — 10 agentów (audyt SkillVault)

> **Dokument archiwalny — stan na 2026-08-04, sprzed przebudowy projektu.**
>
> Nie jest to lista bieżących błędów. Większość opisanych tu usterek została
> naprawiona, a wnioski z nich przeszły do „Dziewięciu reguł"
> w [`AGENTS.md`](../../AGENTS.md), gdzie każda reguła powołuje się na konkretny
> incydent stąd. Zapis zostaje, bo reguła bez historii, która ją wymusiła, po
> roku wygląda na arbitralną — a wtedy pierwszy człowiek, któremu zawadzi,
> ją usunie.
>
> Projekt nazywał się wtedy SkillVault. Ścieżki plików pochodzą sprzed podziału
> na `src/features/`, więc odnoszą się do układu, którego już nie ma.

---

Data: 2026-08-04. Branch: `fix/types-node26-webcrypto`.

**Zakres:** 10 niezależnych agentów, każdy w rozłącznym obszarze. Razem **34 zgłoszeń**: 4 krytycznych, 14 wysokich, 8 średnich, 8 niskich.

## ⚠️ Ograniczenie metodologiczne — przeczytaj przed użyciem

Serwer deweloperski padł w trakcie przebiegu. Tylko obszary **powloka-nawigacja**, **baza-cv**, **ats-ranking**, **edytor-cv** i **backend-api** (pierwsza tura) miały działający runtime. Pozostałe pięć — **motywy, podglad-eksport, auth-2fa, obsluga-bledow, dostepnosc-rwd** — oparto **wyłącznie na analizie kodu**. Ich ustalenia są prawdopodobne, ale niezweryfikowane w działaniu: potwierdź je ręcznie przed naprawą.

Zweryfikowane osobiście (odczyt kodu po przebiegu): pętla renderowania w App.tsx, bug pustego CV w atsSimulator.ts:36, obejście logowania w AuthModal.tsx:458-462, bypass SSRF.

---


## KRYTYCZNY

### Nieskończona pętla setState w App.tsx — 387 zapisów do localStorage w 3 s

- **Obszar:** powloka-nawigacja
- **Plik:** src/App.tsx:61-96 (efekt mirror userVault->vault oraz efekt auto-zapisu)
- **Odtworzenie:** 1. Otwórz http://localhost:3000 jako ZALOGOWANY użytkownik (w topbarze widoczny awatar, nie przycisk 'Zaloguj'). 2. Otwórz konsolę / read_console_messages — natychmiast po załadowaniu, bez żadnej interakcji, sypią się błędy. 3. Pętla trwa też przy bezczynności i na każdej z 4 sekcji (Dopasuj Ofertę / Baza CV / Wczytaj Plik / Profiler).
- **Obserwacja:** Konsola zalewana błędem: "Maximum update depth exceeded. This can happen when a component calls setState inside useEffect...". Stack wskazuje dispatchSetState wywołany z commitHookEffectListMount w http://localhost:3000/src/App.tsx:54 (efekt w MainApp). Pomiar: podmiana localStorage.setItem policzyła 387 zapisów w 3 sekundy przy całkowitej bezczynności użytkownika (każdy zapis to szyfrowanie vaulta). Licznik błędów rósł też w stanie idle: 2 błędy/1,5 s na zakładce matcher, 4 błędy/1,5 s na Profilerze.
- **Oczekiwane:** Po ustabilizowaniu się stanu aplikacja nie powinna renderować się w pętli ani zapisywać vaulta do localStorage; zero błędów React w konsoli przy bezczynności.
- **Dowód:** javascript_tool: {"writesIn3s":387,"errsTotal":10} ; stack: "at dispatchSetState (react-dom_client.js) at http://localhost:3000/src/App.tsx:54:7 at commitHookEffectListMount" ; read_console_messages zwraca 60/60 wpisów "Maximum update depth exceeded". Komentarz w App.tsx:80-86 opisuje dokładnie ten ping-pong (guard `if (vault === userVault) return;`) — guard najwyraźniej nie łapie przypadku, gdy saveUserVault tworzy nowy obiekt.

### Puste CV dostaje 82% ATS i "100% wymagań spełnionych" — wszystkie słowa kluczowe fałszywie dopasowane

- **Obszar:** ats-ranking
- **Plik:** src/lib/atsSimulator.ts:36 (isLemmatizedMatch)
- **Odtworzenie:** Uruchomić simulateAtsCheck z całkowicie pustym MasterVault i pustym TailoredResume oraz ogłoszeniem 'Wymagania: React, TypeScript, Docker, Kubernetes, AWS, GraphQL, Python, Excel, SAP.' (odpowiada nowemu użytkownikowi bez wypełnionego Vaulta, gdy wkleja ogłoszenie w widoku Symulatora ATS).
- **Obserwacja:** overallScore=82, layer2Nlp.hardSkillsCoverage=100, matchedKeywords=['typescript','react','python','graphql','docker','kubernetes','aws','excel','sap'], missingHardSkills=[], gapAnalysis=['100% kluczowych wymagań technicznych i formalnych z ogłoszenia znajduje się w Twoim profilu!']
- **Oczekiwane:** Puste CV powinno mieć pokrycie 0%, wszystkie frazy z ogłoszenia na liście brakujących i bardzo niski wynik ogólny.
- **Dowód:** node + jiti na realnym module: `EMPTY CV: 82 hardCov 100 matched [...9 fraz...] missing [] gap ['100% kluczowych wymagań...']`. Przyczyna widoczna wprost: isLemmatizedMatch zwraca true, bo `normA.includes(normB)` przy normB='' (fullCvText pustego vaulta) jest zawsze prawdą — `isLemmatizedMatch('react','') === true`, `isLemmatizedMatch('kubernetes','') === true`.

### Eksport TXT nie zawiera ŻADNYCH punktów doświadczenia

- **Obszar:** podglad-eksport
- **Plik:** src/components/DocumentRenderer.tsx:639 + src/lib/layeredVaultEngine.ts:127-134
- **Odtworzenie:** Podgląd CV -> Opcje Eksportu -> "Czysty Tekst (TXT Korpo)" -> otwórz pobrany plik CV_*.txt
- **Obserwacja:** W sekcji DOŚWIADCZENIE ZAWODOWE są tylko nagłówki stanowisk, bez ani jednego myślnika z osiągnięciem. DocumentRenderer wywołuje generatePlainTextCvExport(..., [], ...) — pusta tablica layeredFacts. W generatePlainTextCvExport pętla to: const expFacts = layeredFacts.filter(...); expFacts.forEach(...) — filtr pustej tablicy zawsze daje 0 elementów, a funkcja NIE ma gałęzi else sięgającej do exp.highlights ani do resume.selectedHighlights.
- **Oczekiwane:** Plik TXT powinien zawierać te same punkty, które widać na kartce A4 (getDeduplicatedExpHighlights / resume.selectedHighlights, z fallbackiem na exp.highlights).
- **Dowód:** DocumentRenderer.tsx:639 `generatePlainTextCvExport({ ...vault, history: getOrderedHistory(vault, resume) }, [], resume.targetJobTitle, resume.companyName)`; layeredVaultEngine.ts:129-132 `const expFacts = layeredFacts.filter(f => f.experienceId === exp.id); expFacts.forEach(...)` — brak else.

### Fallback logowania Google (prompt) daje dostęp do dowolnego konta bez hasła

- **Obszar:** auth-2fa
- **Plik:** src/components/AuthModal.tsx:452-468 (catch), src/lib/auth.ts:214-248 (loginWithOAuthAccount), src/lib/firebaseClient.ts:22-41
- **Odtworzenie:** 1. Konto A rejestruje się e-mailem a@a.pl i wypełnia Master Vault. 2. Wylogowanie / inna osoba przy tej samej przeglądarce. 3. Klik "Kontynuuj z Google". 4. Bez VITE_FIREBASE_API_KEY signInWithGooglePopup() rzuca (auth/invalid-api-key), więc blok catch w AuthModal.tsx:459 pokazuje prompt('Wprowadź swój adres e-mail Google:'). 5. Wpisujemy a@a.pl i dowolne imię.
- **Obserwacja:** loginWithOAuthAccount() (auth.ts:214) znajduje istniejące konto po samym adresie e-mail, nie weryfikuje niczego, uruchamia sesję (saveActiveSession) i ładuje vault przez loadUserVault(foundUser.id) — auth.ts:246. loadUserVault (auth.ts:292-304) czyta niezaszyfrowaną kopię z klucza skillvault_vault_active_<id>, więc hasło ani klucz szyfrujący nie są w ogóle potrzebne. Wynik: pełny dostęp do cudzego konta i CV po wpisaniu samego adresu e-mail w okienku prompt.
- **Oczekiwane:** Gdy Firebase nie jest skonfigurowany, przycisk Google powinien pokazać czytelny komunikat o niedostępności logowania Google, a nie awaryjnie logować użytkownika na podstawie wpisanego ręcznie adresu e-mail. Ścieżka OAuth nigdy nie powinna dawać dostępu do istniejącego konta bez potwierdzenia tożsamości przez dostawcę.
- **Dowód:** AuthModal.tsx:459 `const googleEmail = prompt('Wprowadź swój adres e-mail Google:', ...)` -> :462 `const vault = loginOAuth(googleEmail, googleName || 'Użytkownik Google', 'google');`; auth.ts:217 `let foundUser = users.find((u) => u.email === normalizedEmail);` i :244 `saveActiveSession(foundUser);` bez żadnej weryfikacji poświadczeń. firebaseClient.ts:6 apiKey domyślnie "", co powoduje rzucenie wyjątku i wejście w blok catch.


## WYSOKI

### Dodany certyfikat jest nieedytowalny — zostaje na stałe placeholderem

- **Obszar:** baza-cv
- **Plik:** src/components/MasterVaultEditor.tsx:461-487, 2689-2702
- **Odtworzenie:** Baza CV -> zakładka Edukacja -> kliknij 'Dodaj Certyfikat' -> spróbuj zmienić nazwę/wystawcę/datę nowej karty.
- **Obserwacja:** addCertification() tworzy rekord ze stałymi wartościami name:'Nowy Certyfikat Zawodowy', issuer:'Instytucja / Organizacja'. Renderer w liniach 2698-2699 wypisuje je jako zwykły tekst (<div>{cert.name}</div>, <div>{cert.issuer} ({cert.date})</div>) — nie ma żadnego <input>. W całym pliku nie istnieje funkcja updateCertification (grep 'const update\w*' zwraca updatePersonalInfo, updateExperience, updateHighlight, updateEducation — brak certyfikatu). Jedyna akcja to removeCertification.
- **Oczekiwane:** Pola certyfikatu (nazwa, wystawca, data) powinny być edytowalnymi inputami, tak jak w sekcjach doświadczenia i edukacji.
- **Dowód:** MasterVaultEditor.tsx:464 name: 'Nowy Certyfikat Zawodowy'; :2698 <div className="font-bold text-xs text-slate-900 pr-6">{cert.name}</div>; brak updateCertification w pliku.

### Niezapisane zmiany w Bazie CV przepadają bez ostrzeżenia po zmianie zakładki

- **Obszar:** baza-cv
- **Plik:** src/App.tsx:204-206 + src/components/MasterVaultEditor.tsx:118,341-344
- **Odtworzenie:** Baza CV -> zmień np. nazwę firmy w doświadczeniu (przycisk 'Zapisz Zmiany w Profilu' zaczyna pulsować) -> przejdź na zakładkę Matcher/Profiler i wróć do Bazy CV.
- **Obserwacja:** MasterVaultEditor jest renderowany warunkowo ({activeTab === 'vault' && <MasterVaultEditor .../>}), więc zmiana zakładki go odmontowuje. Cały stan roboczy trzymany jest wyłącznie lokalnie w draftVault (useState(vault), linia 118) i nigdy nie jest podnoszony do rodzica przed kliknięciem Zapisz (onChange wywoływany tylko w handleSaveChanges, linia 358). Po powrocie useEffect na [vault] (linie 341-344) odtwarza draft ze starego propa. Nie ma żadnego guarda: brak beforeunload, brak confirm, brak blokady przełączenia zakładki (isDirty użyty tylko do wyglądu przycisku i banera — linie 825, 872, 2776).
- **Oczekiwane:** Albo ostrzeżenie/potwierdzenie przy opuszczaniu sekcji z niezapisanymi zmianami, albo zachowanie draftu po powrocie.
- **Dowód:** App.tsx:204 `{activeTab === 'vault' && (` ; MasterVaultEditor.tsx:341-344 `useEffect(() => { setDraftVault(vault); setIsDirty(false); }, [vault]);`

### Fałszywe dopasowania słów kluczowych po fragmencie wyrazu (aws w "jaws", sap w "sapieha", cit w "citroen")

- **Obszar:** ats-ranking
- **Plik:** src/lib/atsSimulator.ts:36-45 (isLemmatizedMatch)
- **Odtworzenie:** Wywołać isLemmatizedMatch dla par: ('aws','lawson jaws'), ('sap','wsparcie sapieha'), ('cit','citroen') — czyli sytuacja, gdy w CV występuje nazwa firmy/nazwisko zawierające ciąg znaków będący skrótem technologii z ogłoszenia.
- **Obserwacja:** Wszystkie zwracają true; taka fraza trafia do matchedKeywords i podbija hardSkillsCoverage oraz overallScore.
- **Oczekiwane:** Dopasowanie powinno być na granicy wyrazu / po rdzeniu, a nie po dowolnym podciągu — 'AWS' nie jest spełnione przez firmę 'Jaws Ltd.', 'CIT' przez 'Citroen'.
- **Dowód:** Wyjście skryptu: `match('aws','lawson jaws') true`, `match('sap','wsparcie sapieha') true`, `match('cit','citroen') true`.

### "Zaakceptuj Wszystkie" oznacza odrzucone propozycje jako zaakceptowane, ale ich nie stosuje

- **Obszar:** edytor-cv
- **Plik:** src/components/CVWordBuilder.tsx:361-404 (pomijanie w 365, oznaczanie w 401-403)
- **Odtworzenie:** 1. Otwórz zakładkę Edytor CV z ofertą generującą >=2 propozycje. 2. Kliknij "Odrzuć" na jednej z nich. 3. Kliknij "Zaakceptuj Wszystkie". 4. Porównaj licznik "Zaakceptowane" z faktyczną treścią arkusza. Odtworzenie logiki w Node: subs=[{odrzucona Docker},{oczekująca Kafka}] -> hardSkills=['SQL','Kafka'], licznik Zaakceptowane=2.
- **Obserwacja:** forEach pomija target.accepted===false (nie stosuje podmiany), ale zaraz potem setSubstitutions ustawia accepted:true DLA WSZYSTKICH, łącznie z odrzuconymi. Licznik "Zaakceptowane" pokazuje 2 przy jednej faktycznie zastosowanej podmianie; propozycja odrzucona znika z listy jako rzekomo wprowadzona, choć CV jej nie zawiera. Odrzucenia nie da się już odróżnić ani ponowić.
- **Oczekiwane:** Odrzucone propozycje powinny pozostać accepted:false, a licznik "Zaakceptowane" liczyć wyłącznie faktycznie zastosowane podmiany.
- **Dowód:** node repro: 'po Zaakceptuj Wszystkie: hardSkills= [ SQL, Kafka ] | licznik Zaakceptowane= 2'. Kod: linia 365 `if (target.accepted === false) return;` vs linie 401-403 `prev.map((s) => ({ ...s, accepted: true }))`.

### Akceptacja jednej propozycji podmienia frazę we wszystkich punktach danego doświadczenia

- **Obszar:** edytor-cv
- **Plik:** src/components/CVWordBuilder.tsx:319-335 (oraz analogicznie 375-391)
- **Odtworzenie:** 1. W doświadczeniu o tym samym id umieść dwa punkty zawierające tę samą frazę ze słownika, np. 'praca w zespole'. 2. Generator utworzy dwie propozycje (sub_exp_<id>_0_r i sub_exp_<id>_1_r). 3. Zaakceptuj tylko pierwszą.
- **Obserwacja:** handleAcceptSingle mapuje po WSZYSTKICH highlightach danego exp (nie używa indeksu z id propozycji) i podmienia frazę wszędzie. Drugi punkt zostaje już zmieniony, ale jego propozycja nadal ma accepted===null, więc licznik "Oczekujące podmiany" pokazuje 1 i na arkuszu wisi karta propozycji dla tekstu, którego już nie ma. Ponowna akceptacja niczego nie zmienia, ale zwiększa licznik "Zaakceptowane".
- **Oczekiwane:** Podmiana powinna dotyczyć wyłącznie punktu (hIndex), dla którego propozycję wygenerowano; pozostałe propozycje pozostają aktualne wobec swojego tekstu.
- **Dowód:** node repro: po akceptacji 1 propozycji highlights = ['ZASTAPIONE nad projektem','ZASTAPIONE i raporty'], pending=1, accepted=1 — czyli oczekująca propozycja odnosi się do już podmienionego tekstu.

### DOCX eksportuje treść nieprzykrojoną do oferty i gubi wykształcenie

- **Obszar:** podglad-eksport
- **Plik:** src/lib/docxExporter.ts:85,132-169 + src/components/DocumentRenderer.tsx:628
- **Odtworzenie:** Dopasuj CV do oferty (podsumowanie i punkty na kartce zmienią się), potem Opcje Eksportu -> "Pobierz DOCX (Natywny Word)" i porównaj plik z podglądem
- **Obserwacja:** DOCX zawiera bazowe vault.personalInfo.summary zamiast resume.summary oraz surowe exp.highlights zamiast zoptymalizowanych resume.selectedHighlights (bo caller przekazuje layeredFacts = [], więc gałąź expFacts jest pusta i zawsze wchodzi fallback na exp.highlights). Dodatkowo dokument nie ma sekcji Wykształcenie ani Języki, które są renderowane na kartce (DocumentRenderer.tsx:838, 989, 1063, 1104).
- **Oczekiwane:** Plik DOCX powinien odzwierciedlać dokument widoczny w podglądzie: przykrojone podsumowanie, przykrojone punkty i sekcję wykształcenia.
- **Dowód:** DocumentRenderer.tsx:628 `downloadNativeDocxCv({ ...vault, history: getOrderedHistory(vault, resume) }, [], resume.targetJobTitle, resume.companyName)`; docxExporter.ts:85 `text: vault.personalInfo.summary || ''`; docxExporter.ts:132-151 `const expFacts = layeredFacts.filter(...); if (expFacts.length > 0) {...} else { exp.highlights.forEach(...) }`; w całym docxExporter.ts brak odwołania do education/profiler.

### Przycisk Drukuj drukuje cały interfejs — brak reguł @media print

- **Obszar:** podglad-eksport
- **Plik:** src/components/DocumentRenderer.tsx:270-272, 740; src/index.css
- **Odtworzenie:** Podgląd CV -> przycisk "Drukuj" -> podgląd wydruku systemowego
- **Obserwacja:** handlePrint to samo window.print(). Kartka ma klasę pomocniczą `printable-area`, ale ta klasa nie jest nigdzie zdefiniowana w CSS, a w całym repo nie ma ani jednej reguły `@media print` ani wariantu `print:`. Wydruk obejmuje więc pasek narzędzi, granatowy baner "Auto-Tailor Summary", przyciski i szare tło kanwy, a kartka A4 z paddingiem kontenera nie mieści się w marginesach strony.
- **Oczekiwane:** Wydruk powinien zawierać wyłącznie kartkę A4 (izolacja przez @media print i regułę dla .printable-area).
- **Dowód:** grep -rn "@media print|print:" po .css/.html/.tsx (bez node_modules) => 0 trafień; grep -rn "printable-area" => jedno trafienie, wyłącznie DocumentRenderer.tsx:740 (użycie, brak definicji); index.css ma tylko @media (prefers-reduced-motion) w linii 232.

### Eksport PDF obcina treść wychodzącą poza pierwszą stronę A4

- **Obszar:** podglad-eksport
- **Plik:** src/components/DocumentRenderer.tsx:386-391
- **Odtworzenie:** Wypełnij vault treścią dłuższą niż jedna strona A4 (kilka stanowisk z wieloma punktami), Opcje Eksportu -> "Pobierz PDF (Wektorowy)"
- **Obserwacja:** Kod tworzy jsPDF('p','mm','a4'), liczy pdfHeight = (canvas.height * pdfWidth) / canvas.width i robi JEDNO pdf.addImage(imgData,'PNG',0,0,pdfWidth,pdfHeight). Nie ma pętli stronicującej ani pdf.addPage(), więc gdy pdfHeight > 297 mm wszystko poniżej pierwszej strony jest przycięte i bezpowrotnie tracone w pliku PDF.
- **Oczekiwane:** Wielostronicowe CV powinno wygenerować PDF z wieloma stronami (pętla addPage z przesunięciem obrazu) albo przynajmniej ostrzec użytkownika.
- **Dowód:** DocumentRenderer.tsx:386-391: `const pdf = new jsPDF('p','mm','a4'); ... const pdfHeight = (canvas.height * pdfWidth) / canvas.width; pdf.addImage(imgData,'PNG',0,0,pdfWidth,pdfHeight); pdf.save(...)` — jedno addImage, brak addPage w całym pliku (grep addPage => 0 trafień).

### Logowanie przez Google całkowicie pomija włączone 2FA konta

- **Obszar:** auth-2fa
- **Plik:** src/lib/auth.ts:214-248
- **Odtworzenie:** 1. Zarejestruj konto e-mailem, zaloguj się, włącz 2FA (panel konta -> Włącz, potwierdź kodem). 2. Wyloguj się. 3. Zamiast formularza e-mail/hasło użyj przycisku "Kontynuuj z Google" i podaj ten sam adres e-mail.
- **Obserwacja:** loginWithOAuthAccount nie sprawdza pola twoFactorEnabled i nie rzuca Requires2FAError (w przeciwieństwie do loginUser, auth.ts:168-170). Sesja startuje od razu, ekran wyzwania TOTP nigdy się nie pojawia.
- **Oczekiwane:** Konto z włączonym 2FA powinno wymagać kodu TOTP niezależnie od użytej metody logowania, tak jak robi to loginUser().
- **Dowód:** auth.ts:165-173 loginUser: `if (foundUser.twoFactorEnabled) { throw new Requires2FAError(foundUser); }`. Brak analogicznego sprawdzenia w loginWithOAuthAccount (auth.ts:242-247), która przechodzi prosto do saveActiveSession + loadUserVault.

### Po wylogowaniu dane vaulta poprzedniego użytkownika zostają na ekranie i trafiają do wspólnego magazynu

- **Obszar:** auth-2fa
- **Plik:** src/App.tsx:80-96, src/context/AuthContext.tsx:118-122
- **Odtworzenie:** 1. Zaloguj się jako użytkownik A i wprowadź dane w Master Vault. 2. Otwórz modal konta i kliknij "Wyloguj się". 3. Obejrzyj zakładkę Master Vault (bez logowania) i przeładuj stronę.
- **Obserwacja:** logout() (AuthContext.tsx:118) czyści tylko user/userVault w kontekście; stan `vault` w App.tsx nie jest resetowany, więc dane A nadal są renderowane. Dodatkowo efekt auto-zapisu w App.tsx:86-92 wykrywa `vault !== userVault` (userVault jest już null) i przy !isAuthenticated wykonuje saveVaultToLocalStorage(vault), zapisując dane A pod globalnym kluczem skillvault_master_vault_enc_v2. Po przeładowaniu App.tsx:46-48 wczytuje ten globalny vault dla niezalogowanego użytkownika, więc dane A widzi każda kolejna osoba korzystająca z tej przeglądarki.
- **Oczekiwane:** Wylogowanie powinno wyczyścić widoczny vault do pustego i nie kopiować danych zalogowanego użytkownika do wspólnego, niezwiązanego z kontem magazynu.
- **Dowód:** App.tsx:88-91 `if (!isAuthenticated) { saveVaultToLocalStorage(vault); return; }`; vaultCrypto.ts:177-180 saveVaultToLocalStorage -> encryptVault, a encryptVault (vaultCrypto.ts:152-154) zwraca `JSON.stringify({ v: 1, raw: JSON.stringify(vault) })`, czyli zapis jest jawnym tekstem mimo nazwy klucza "_enc_v2".

### "Usuń konto i wszystkie dane" nie usuwa globalnej kopii vaulta (zły klucz localStorage)

- **Obszar:** auth-2fa
- **Plik:** src/lib/auth.ts:319-332
- **Odtworzenie:** 1. Zaloguj się, wypełnij Master Vault (dane trafiają też do globalnego klucza przez App.tsx:94). 2. Modal konta -> "Usuń konto i wszystkie dane" -> "Tak, usuń konto". 3. Przeładuj stronę bez logowania i otwórz Master Vault.
- **Obserwacja:** deleteUserAccount usuwa klucz 'skillvault_master_vault_enc', podczas gdy realnie używany klucz to 'skillvault_master_vault_enc_v2' (vaultCrypto.ts:9). Globalna, jawnie zapisana kopia CV usuniętego konta zostaje w localStorage i jest wczytywana po przeładowaniu przez loadVaultFromLocalStorage (App.tsx:46), mimo komunikatu w UI, że dane zostaną trwale usunięte.
- **Oczekiwane:** Usunięcie konta powinno skasować wszystkie kopie danych, w tym klucz skillvault_master_vault_enc_v2, i po przeładowaniu pokazać pusty vault.
- **Dowód:** auth.ts:331 `localStorage.removeItem('skillvault_master_vault_enc');` vs vaultCrypto.ts:9 `const STORAGE_KEY = 'skillvault_master_vault_enc_v2';`. UI obiecuje inaczej — AuthModal.tsx:283: "Twoje konto, dane vault i historia zostaną trwale usunięte z Firebase i localStorage."

### Modale AuthModal/JDParserModal/GeminiAdvisorModal nie zamykają się Escape i nie mają role=dialog

- **Obszar:** dostepnosc-rwd
- **Plik:** src/components/AuthModal.tsx:116, src/components/JDParserModal.tsx:150, src/components/GeminiAdvisorModal.tsx:106
- **Odtworzenie:** Otwórz jeden z tych modali i naciśnij Escape. (Weryfikacja statyczna: grep 'Escape' w src zwraca wyłącznie src/components/ui/Modal.tsx:47 i AutocompleteInput.tsx:75; grep 'keydown|onKeyDown|role=' w tych trzech plikach nie zwraca żadnego handlera klawiatury ani atrybutu role.)
- **Obserwacja:** Te trzy modale to ręcznie pisane nakładki <div className="fixed inset-0 z-50 ..."> bez nasłuchu Escape, bez role="dialog"/aria-modal, bez przeniesienia focusu do panelu i bez blokady przewijania tła. Focus pozostaje na elemencie pod nakładką, a czytnik ekranu nie ogłasza dialogu.
- **Oczekiwane:** Powinny korzystać ze wspólnego src/components/ui/Modal.tsx, który ma Escape (linia 47), role="dialog" + aria-modal (68-69), przeniesienie focusu (59-61) i blokadę body scroll (51).
- **Dowód:** src/components/ui/Modal.tsx:47 `if (e.key === 'Escape' && dismissable) onClose();` — jedyny taki handler w repo; w AuthModal/JDParserModal/GeminiAdvisorModal grep na 'keydown|role=' zwraca tylko GeminiAdvisorModal.tsx:192 (Enter w polu input).

### SSRF: walidacja URL przepuszcza adresy IPv4-mapped IPv6 (np. http://[::ffff:127.0.0.1]/)

- **Obszar:** backend-api
- **Plik:** C:/Users/Adrian/Documents/GitHub/skillvault/server.ts:167-200
- **Odtworzenie:** POST /api/fetch-jd-url z body {"url":"http://[::ffff:127.0.0.1]:3000/api/health"} (lub [::ffff:169.254.169.254] dla metadanych chmury). Odtworzone lokalnie: node -e z 1:1 skopiowaną funkcją validateOutboundUrl + realny fetch.
- **Obserwacja:** validateOutboundUrl zwraca null (ALLOWED). URL.hostname dla http://[::ffff:127.0.0.1]/ to '::ffff:7f00:1' po zdjęciu nawiasów — nie pasuje do żadnego z wzorców (/^127./, /^169.254./, '::1', /^fe80:/ itd.). Realny fetch Node ('http://[::ffff:127.0.0.1]:3215/') zwrócił 'status 404' od lokalnej usługi nasłuchującej na 127.0.0.1:3215 — czyli żądanie faktycznie trafiło na loopback. Podobnie '[::]' przechodzi walidację (fetch: ECONNREFUSED, czyli kierowany lokalnie). Wersje dziesiętne/ósemkowe/hex (2130706433, 0177.0.0.1, 0x7f000001) są poprawnie blokowane, bo Node normalizuje je do 127.0.0.1.
- **Oczekiwane:** Adresy mapowane IPv4-w-IPv6 (::ffff:x.x.x.x), '::' oraz ogólnie każdy adres rozwiązujący się do loopback/prywatnych zakresów powinny być odrzucane z HTTP 400; walidacja powinna działać na znormalizowanej postaci IP, a nie na wzorcach tekstowych.
- **Dowód:** node -e (odtworzenie validateOutboundUrl): 'http://[::ffff:127.0.0.1]/  ALLOWED -> ::ffff:7f00:1', 'http://[::ffff:169.254.169.254]/  ALLOWED -> ::ffff:a9fe:a9fe', 'http://[::]/  ALLOWED -> ::'. Realny fetch: 'http://[::ffff:127.0.0.1]:3215/ status 404'.

### SSRF: brak kontroli przekierowań w /api/fetch-jd-url (fetch follow domyślnie)

- **Obszar:** backend-api
- **Plik:** C:/Users/Adrian/Documents/GitHub/skillvault/server.ts:302-320
- **Odtworzenie:** Podać w /api/fetch-jd-url URL do zewnętrznego hosta, który odpowiada 302 Location: http://169.254.169.254/latest/meta-data/ (nie wykonywałem realnego ataku na obcy host zgodnie z instrukcją).
- **Obserwacja:** validateOutboundUrl sprawdza wyłącznie adres podany przez użytkownika. Wywołanie fetch(url, {signal, headers}) nie ustawia redirect:'manual' ani nie waliduje adresu docelowego po przekierowaniu, więc Node podąża za Location bez ponownej kontroli (dotyczy też Tier 2/3/4 przez zewnętrzne proxy). Analogicznie żaden host DNS wskazujący na adres prywatny (np. wewnętrzna domena firmowa) nie jest blokowany, bo walidacja działa tylko na literałach IP.
- **Oczekiwane:** redirect:'manual' z rewalidacją każdego kolejnego URL (lub walidacja po rozwiązaniu DNS na poziomie gniazda), żeby przekierowanie/DNS nie omijało blokady sieci prywatnych.
- **Dowód:** server.ts:302 — fetch(url, { signal: AbortSignal.timeout(OUTBOUND_TIMEOUT_MS), headers: {...} }) bez opcji redirect; brak jakiejkolwiek walidacji response.url w dalszej części handlera (linie 322-424).


## ŚREDNI

### Sekcja Projekty jest tylko do odczytu — nie da się dodać, edytować ani usunąć projektu

- **Obszar:** baza-cv
- **Plik:** src/components/MasterVaultEditor.tsx:2705-2721
- **Odtworzenie:** Baza CV -> zakładka Edukacja -> sekcja 'Kluczowe Projekty Poboczne'.
- **Obserwacja:** Sekcja renderuje licznik draftVault.projects.length i mapuje projekty na statyczne <div>/<span> (name, role, description, metrics). Nie ma przycisku 'Dodaj', ikony Trash2 ani żadnego inputa; w pliku nie istnieją funkcje addProject/updateProject/removeProject. Przy pustym vaultcie (createEmptyVault ustawia projects: [], sampleVault.ts:38) sekcja jest trwale pusta i nie da się jej wypełnić z UI — projekty mogą trafić do vaultu wyłącznie przez import CV/LinkedIn.
- **Oczekiwane:** Analogicznie do doświadczenia/edukacji/certyfikatów: możliwość ręcznego dodania i usunięcia projektu.
- **Dowód:** MasterVaultEditor.tsx:2706-2710 nagłówek sekcji bez przycisku dodawania; :2711 `{draftVault.projects.map((proj) => (` — w środku wyłącznie elementy prezentacyjne.

### Odznaczenie terminu na mapie kompetencji nie działa przy innej wielkości liter

- **Obszar:** baza-cv
- **Plik:** src/components/MasterVaultEditor.tsx:103-115, 449-458, 1760-1768
- **Odtworzenie:** Baza CV -> Umiejętności: dodaj ręcznie umiejętność małymi literami, np. 'sql'. Następnie wejdź w mapę specjalizacji (Domena -> Rola) i kliknij kafelek terminu zapisanego w słowniku jako 'SQL'.
- **Obserwacja:** Kafelek jest już zaznaczony na zielono, bo isSkillAdded (linia 1762) porównuje przez toLowerCase(). Kliknięcie wywołuje toggleProfessionalTerm, gdzie `exists` też liczone jest case-insensitive (linia 108), więc wchodzi gałąź removeSkill(targetField, term) z oryginalną pisownią 'SQL'. removeSkill filtruje jednak dokładnym porównaniem `s !== skillToRemove` (linia 454), więc 'sql' nie zostaje usunięte. Kafelek pozostaje zielony, klikanie go nic nie zmienia. Analogicznie kafelek typu 'brands_tools' zaznaczony jako dodany na podstawie hardSkills+toolsAndTech (linia 1760-1761), a toggle sprawdza tylko toolsAndTech (linia 107) — umiejętność wpisana do hardSkills powoduje ponowne dodanie duplikatu do toolsAndTech zamiast usunięcia.
- **Oczekiwane:** Toggle powinien usuwać/ dodawać dokładnie ten wpis, który uznał za istniejący — porównanie w removeSkill powinno być spójne (case-insensitive) i obejmować to samo pole, które sprawdza isSkillAdded.
- **Dowód:** MasterVaultEditor.tsx:108 `const exists = existingList.some((s) => s.toLowerCase() === term.toLowerCase());` vs :454 `[type]: draftVault.skillsMatrix[type].filter((s) => s !== skillToRemove),`

### Lista brakujących słów kluczowych zawiera ucięte i sklejone śmieci ("ksi", "prywatn", "excel. wykszta", "aws.")

- **Obszar:** ats-ranking
- **Plik:** src/lib/atsSimulator.ts:211 (regex capitalizedMatches)
- **Odtworzenie:** extractDynamicJdPhrases('Szukamy Księgowej. Wymagania: pełna księgowość, SAP, VAT, CIT, Excel. Wykształcenie wyższe.') oraz dla ogłoszenia z jd1; wyniki trafiają wprost do result.missingHardSkills renderowanego w AtsSimulatorView.tsx:233.
- **Obserwacja:** missingHardSkills = ['pełna księgowość','excel','sap','vat','cit','ksi','excel. wykszta']; dla innego ogłoszenia ['graphql','kubernetes','aws','aws.'] (duplikat 'aws' i 'aws.'); ekstrakcja z tekstu HR daje ['zespo','warszawie. oferujemy umow','prac','prywatn','opiek','medyczn'].
- **Oczekiwane:** Brakujące słowa kluczowe powinny być poprawnymi frazami; klasa znaków regexa [A-Za-z0-9#+.-] ucina polskie znaki diakrytyczne (Księgowej -> 'Ksi', Prywatną -> 'Prywatn') i wchłania kropkę kończącą zdanie, sklejając wyrazy z dwóch zdań.
- **Dowód:** Wyjście skryptu: `jd2 score 41 missingHard ['pełna księgowość','excel','sap','vat','cit','ksi','excel. wykszta']` oraz `extract boilerplate: ["zespo","warszawie. oferujemy umow","prac","prywatn","opiek","medyczn"]` i `extract jd1: [...,"frontend developera.","aws."]`.

### Puste ogłoszenie daje wynik ATS 91% i komunikat o 100% spełnionych wymagań

- **Obszar:** ats-ranking
- **Plik:** src/lib/atsSimulator.ts:419-420, 497
- **Odtworzenie:** simulateAtsCheck(resume, wypełniony vault, '') — odpowiada wejściu na zakładkę Symulator ATS przed wklejeniem treści ogłoszenia (RealtimeLivePreview.tsx:82 liczy wynik od razu).
- **Obserwacja:** overallScore=91, hardSkillsCoverage=100, extractedJdPhrasesCount=0, gapAnalysis=['100% kluczowych wymagań technicznych i formalnych z ogłoszenia znajduje się w Twoim profilu!']
- **Oczekiwane:** Bez treści ogłoszenia nie ma czego porównywać — UI powinno pokazać stan neutralny/prośbę o wklejenie ogłoszenia, a nie wysoki wynik i fałszywą deklarację pełnego pokrycia.
- **Dowód:** Wyjście skryptu: `emptyJD score 91 cov 100 extracted 0 gap ['100% kluczowych wymagań...']`.

### handleAcceptAll mutuje obiekt vault z propsów (personalInfo, hardSkills)

- **Obszar:** edytor-cv
- **Plik:** src/components/CVWordBuilder.tsx:362-397 (368, 371, 394)
- **Odtworzenie:** Kliknij "Zaakceptuj Wszystkie" przy propozycjach typu title/summary/skills.
- **Obserwacja:** `let updatedVault = { ...vault }` to płytka kopia; następnie `updatedVault.personalInfo.title = ...`, `updatedVault.personalInfo.summary = ...` i `updatedVault.skillsMatrix.hardSkills.push(...)` zapisują wprost do obiektów należących do propsa vault. Referencje personalInfo i skillsMatrix pozostają identyczne, więc stan rodzica zostaje zmodyfikowany poza setState, a porównania referencyjne (memo/useMemo/porównanie snapshotów) nie wykryją zmiany. handleAcceptSingle w tych samych miejscach robi to poprawnie (tworzy nowe obiekty), co potwierdza niezamierzoność mutacji.
- **Oczekiwane:** Jak w handleAcceptSingle: tworzenie nowych obiektów personalInfo/skillsMatrix zamiast mutacji propsa.
- **Dowód:** node repro: 'czy mutowano oryginalny vault.skillsMatrix? SQL,Kafka | ta sama referencja: true' — oryginalny obiekt vault został zmieniony przez handleAcceptAll.

### Zmiana oferty/tytułu kasuje decyzje Track Changes i zeruje liczniki

- **Obszar:** edytor-cv
- **Plik:** src/components/CVWordBuilder.tsx:292-294
- **Odtworzenie:** 1. Zaakceptuj/odrzuć kilka propozycji. 2. Zmień treść oferty pracy lub tytuł stanowiska (props jobDescription/jobTitle).
- **Obserwacja:** useEffect bezwarunkowo woła generateSubstitutions(), które robi setSubstitutions(list) z accepted:null dla wszystkich. Wszystkie wcześniejsze akceptacje i odrzucenia znikają, liczniki "Zaakceptowane" i "Oczekujące" resetują się, a odrzucone wcześniej propozycje wracają jako oczekujące, mimo że część zmian jest już trwale zapisana w vault.
- **Oczekiwane:** Decyzje użytkownika (accepted true/false) powinny być zachowane dla propozycji o tych samych id albo użytkownik powinien być ostrzeżony o utracie decyzji.
- **Dowód:** Kod: `React.useEffect(() => { generateSubstitutions(); }, [jobDescription, jobTitle]);` oraz `setSubstitutions(list)` w linii 287, gdzie każdy element ma `accepted: null`.

### Przyciski ikonowe zamykania modali bez aria-label/title

- **Obszar:** dostepnosc-rwd
- **Plik:** src/components/AuthModal.tsx:119-124, src/components/JDParserModal.tsx:152-157, src/components/GeminiAdvisorModal.tsx:126-131
- **Odtworzenie:** Przejdź Tabem do przycisku zamknięcia w tych modalach z włączonym czytnikiem ekranu.
- **Obserwacja:** <button onClick={onClose} className="absolute top-4 right-4 ..."><X className="w-5 h-5" /></button> — brak aria-label, brak title, brak tekstu; przycisk nie ma dostępnej nazwy.
- **Oczekiwane:** Jak w ui/Modal.tsx:97, gdzie użyto <IconButton icon={X} title="Zamknij" ...>.
- **Dowód:** sed z plików: AuthModal.tsx:119-124 i JDParserModal.tsx:152-157 zawierają identyczny przycisk bez jakiegokolwiek atrybutu etykietującego.

### Rate limit liczony po req.ip bez 'trust proxy' — za reverse proxy wszyscy dzielą jeden licznik

- **Obszar:** backend-api
- **Plik:** C:/Users/Adrian/Documents/GitHub/skillvault/server.ts:228-237
- **Odtworzenie:** Wdrożenie na Render (render.yaml) — aplikacja stoi za reverse proxy; 20 żądań z jednego dowolnego klienta wyczerpuje limit dla wszystkich użytkowników na 15 minut.
- **Obserwacja:** Middleware używa req.ip || req.socket.remoteAddress jako klucza, a w projekcie nigdzie nie ustawiono app.set('trust proxy') (grep po całym repo: 0 trafień). Bez tego Express zwraca adres gniazda, czyli IP proxy, identyczny dla wszystkich klientów.
- **Oczekiwane:** app.set('trust proxy', 1) (lub jawne czytanie X-Forwarded-For z zaufanego proxy), aby limit był naliczany per rzeczywisty klient, a nie globalnie.
- **Dowód:** grep -rn "trust proxy" --include=*.ts --include=*.json (bez node_modules/dist) → brak wyników; server.ts:230 'const ip = req.ip || req.socket.remoteAddress || "unknown";'


## NISKI

### Wpisany link do oferty znika po przełączeniu sekcji i powrocie

- **Obszar:** powloka-nawigacja
- **Plik:** src/App.tsx:193 (`<main key={activeTab}>` — remount przy każdej zmianie zakładki)
- **Odtworzenie:** 1. Sekcja 'Dopasuj Ofertę'. 2. Wpisz w pole 'Wklej link do oferty pracy' wartość https://example.com/job/123. 3. Kliknij 'Profiler'. 4. Wróć na 'Dopasuj Ofertę'.
- **Obserwacja:** Pole linku jest puste — wpisana treść przepadła (main jest remountowany przez key={activeTab}). Dane vaulta i wcześniej przeanalizowana oferta zostają zachowane, ginie tylko niezapisany input.
- **Oczekiwane:** Niezapisana treść wpisana przez użytkownika powinna przetrwać przełączenie sekcji lub użytkownik powinien być ostrzeżony.
- **Dowód:** javascript_tool: {"before":"https://example.com/job/123","after":""}

### Ikona słońca w ThemeToggle ma kontrast 2,15:1 w motywie jasnym

- **Obszar:** motywy
- **Plik:** C:\Users\Adrian\Documents\GitHub\skillvault\src\components\ui\ThemeToggle.tsx:26
- **Odtworzenie:** 1. Otwórz aplikację w motywie jasnym (data-theme="light"). 2. Spójrz na przełącznik motywu w topbarze — widoczna jest ikona Sun (opacity 1 gdy isDark=false). Kontrast wyliczono z tokenów CSS: kolor ikony text-warning-500 = #f59e0b, tło gałki span to bg-surface = --sv-surface = #ffffff (src/index.css:81). Wzór WCAG: L(#f59e0b)=0.5093, L(#fff)=1.0 -> (1.05)/(0.5593) = 2,15:1.
- **Obserwacja:** Ikona wskazująca aktualny stan przełącznika ma kontrast 2,15:1 wobec swojego tła — poniżej wymaganych przez WCAG 1.4.11 (non-text contrast) 3:1. W jasnym motywie żółte słońce na czysto białej gałce jest słabo rozróżnialne.
- **Oczekiwane:** Element graficzny niosący informację o stanie kontrolki powinien mieć kontrast >= 3:1 wobec tła (np. użycie --color-warning-600 #d97706 daje 3,05:1, a warning-fg #b45309 -> 5,02:1).
- **Dowód:** ThemeToggle.tsx:20 -> span ma klasę `bg-surface`; ThemeToggle.tsx:26 -> `<Sun className="w-3.5 h-3.5 text-warning-500 ...">`. index.css:52 `--color-warning-500: #f59e0b`; index.css:81 `--sv-surface: #ffffff` (blok :root,[data-theme='light']). Wyliczenie relative luminance wg WCAG 2.x w Node: cr('#f59e0b','#ffffff') = 2.15.

### text-subtle na bg-sunken w motywie jasnym: kontrast 2,85:1

- **Obszar:** motywy
- **Plik:** C:\Users\Adrian\Documents\GitHub\skillvault\src\components\shell\Sidebar.tsx:154
- **Odtworzenie:** 1. Motyw jasny. 2. Najedź kursorem na pozycję nawigacji w sidebarze, która nie jest aktywna — element ma klasy `text-subtle hover:text-ink hover:bg-sunken`. W trakcie przejścia hover (transition-colors 0.18s, index.css:165) tło zmienia się na --sv-sunken zanim kolor tekstu dojdzie do --sv-ink, dając parę text-subtle/bg-sunken.
- **Obserwacja:** Para tokenów --sv-subtle (#8a90a2) na --sv-sunken (#f1f2f6) daje 2,85:1 — poniżej 3:1. Ten sam token text-subtle jest w jasnym motywie ogólnie bardzo słaby: 3,00:1 na canvas i 3,19:1 na surface, a bywa stosowany do tekstu 10–11 px (Sidebar.tsx:69,84; Topbar.tsx:42,59; Feedback.tsx:120,152), gdzie WCAG wymaga 4,5:1.
- **Oczekiwane:** Tekst pomocniczy powinien osiągać co najmniej 4,5:1 (mały tekst); minimalnie nie powinien schodzić poniżej 3:1 w żadnej kombinacji tła. Przyciemnienie --sv-subtle w motywie jasnym (np. do ok. #6b7185) rozwiązuje wszystkie te przypadki naraz.
- **Dowód:** index.css:91 `--sv-subtle: #8a90a2`, index.css:83 `--sv-sunken: #f1f2f6`, index.css:80 `--sv-canvas: #f7f8fa`, index.css:81 `--sv-surface: #ffffff`. Wyliczenia WCAG (Node): subtle/sunken = 2.85, subtle/canvas = 3.00, subtle/surface = 3.19. Dla porównania motyw ciemny jest OK: subtle/canvas = 4.23, subtle/surface = 3.99. Grep `text-subtle` w src: 16 wystąpień, w tym rozmiary text-[10px] i text-[11px].

### Inline Track Changes na arkuszu to martwy kod — renderTrackedText nigdy nie jest wywoływane

- **Obszar:** edytor-cv
- **Plik:** src/components/CVWordBuilder.tsx:407-485
- **Odtworzenie:** Przeszukaj komponent pod kątem użycia renderTrackedText.
- **Obserwacja:** Funkcja renderująca podmiany bezpośrednio w tekście (przekreślenie + strzałka + przyciski Tak/X w treści) jest zdefiniowana, ale nie ma ani jednego wywołania — grep w pliku zwraca wyłącznie definicję w linii 407. Treść na arkuszu renderuje się bez inline diffów; działają tylko oddzielne karty propozycji nad sekcjami. Analogicznie import eliminateSlogans i useMemo są nieużywane.
- **Oczekiwane:** Albo funkcja jest podpięta do renderowania podsumowania/punktów doświadczenia, albo usunięta wraz z nieużywanymi importami.
- **Dowód:** Grep 'renderTrackedText|eliminateSlogans|useMemo' w pliku: trafienia tylko w liniach 1 (import useMemo), 29 (import eliminateSlogans) i 407 (definicja) — zero wywołań.

### Kopiowanie do schowka raportuje sukces bez sprawdzenia wyniku

- **Obszar:** podglad-eksport
- **Plik:** src/components/DocumentRenderer.tsx:265-267, 660-661
- **Odtworzenie:** Kliknij "Kopiuj Tekst" lub "Format LinkedIn-Ready" w kontekście, w którym navigator.clipboard.writeText odrzuca obietnicę (brak uprawnień / dokument bez fokusu)
- **Obserwacja:** navigator.clipboard.writeText(...) jest wywoływane bez await, .then/.catch. Zaraz potem bezwarunkowo ustawiany jest stan `copied` (ikona Check) albo pokazywany alert 'Format LinkedIn skopiowany do schowka!'. Odrzucenie obietnicy staje się nieobsłużonym unhandled rejection, a użytkownik widzi fałszywe potwierdzenie i traci treść.
- **Oczekiwane:** Obietnica powinna być obsłużona (catch), a potwierdzenie sukcesu pokazywane dopiero po jej spełnieniu; przy błędzie komunikat o niepowodzeniu.
- **Dowód:** DocumentRenderer.tsx:265-267 `navigator.clipboard.writeText(raw); setCopied(true); setTimeout(...)`; DocumentRenderer.tsx:660-661 `navigator.clipboard.writeText(...); alert('Format LinkedIn skopiowany do schowka! ...')`.

### Komunikaty o włączeniu/wyłączeniu 2FA nigdy się nie wyświetlają

- **Obszar:** auth-2fa
- **Plik:** src/components/AuthModal.tsx:112, 168, 427-432
- **Odtworzenie:** 1. Zaloguj się. 2. W panelu konta włącz 2FA (Włącz -> zeskanuj -> wpisz kod -> "Potwierdź i włącz") albo wyłącz 2FA.
- **Obserwacja:** confirmTwoFactorSetup ustawia setSuccessMsg('Weryfikacja dwuetapowa (2FA) została włączona.'), ale blok renderujący successMsg (AuthModal.tsx:427-432) znajduje się wyłącznie w gałęzi formularza logowania/rejestracji, która nie jest renderowana gdy isAuthenticated && user. Użytkownik nie dostaje potwierdzenia operacji (zmienia się tylko etykieta w wierszu 2FA).
- **Oczekiwane:** Potwierdzenie operacji powinno być widoczne również w widoku zalogowanego konta.
- **Dowód:** AuthModal.tsx:126 `{isAuthenticated && user ? (/* Logged In View */ ...` — blok successMsg z linii 427 leży w gałęzi `: (` od linii 371, więc jest nieosiągalny dla zalogowanego użytkownika.

### generateCoverLetterWithAI nie waliduje data.coverLetter przy odpowiedzi 200

- **Obszar:** obsluga-bledow
- **Plik:** src/lib/coverLetterEngine.ts:126
- **Odtworzenie:** Backend zwraca HTTP 200 z JSON bez pola coverLetter (np. {"success":false}) na /api/generate-cover-letter; użytkownik klika generowanie listu w trybie Gemini Flash (CoverLetterView.tsx:108).
- **Obserwacja:** Kod robi `const data = await response.json(); return data.coverLetter;` bez sprawdzenia — undefined trafia do setLetter() w CoverLetterView.tsx:115, poza blokiem catch nie ma żadnej walidacji.
- **Oczekiwane:** Brak pola coverLetter powinien rzucić błąd z komunikatem, tak jak gałąź !response.ok (linie 121-123), zamiast wstawiać undefined do stanu widoku.
- **Dowód:** src/lib/coverLetterEngine.ts:121-127 — gałąź !response.ok ma pełną obsługę, natomiast ścieżka sukcesu zwraca `data.coverLetter` bez żadnego guardu; CoverLetterView.tsx:114-118 przypisuje wynik prosto do setLetter/onUpdateCoverLetter. UWAGA: nie udało się tego potwierdzić runtime — serwer dev nie działał (Get-NetTCPConnection nie pokazuje portu 3000, curl http://localhost:3000 => exit 7).

### Brak middleware obsługi błędów — 413/400 z express.json wracają jako HTML, nie JSON

- **Obszar:** backend-api
- **Plik:** C:/Users/Adrian/Documents/GitHub/skillvault/server.ts:225,529-549
- **Odtworzenie:** POST /api/parse-cv z payloadem >2mb albo z uszkodzonym JSON-em (nie zweryfikowane runtime — serwer nie działał).
- **Obserwacja:** W całym server.ts nie ma handlera błędów (app.use((err,req,res,next)=>...)). Błędy z express.json ('entity.too.large', 'entity.parse.failed') trafiają do domyślnego handlera Express 4.22, który odpowiada stroną HTML — a klient parsuje odpowiedzi jako JSON. Dodatkowo /api/generate-cover-letter (linie 508-517) nie waliduje wejścia w ogóle (żadne pole nie jest wymagane ani typowane).
- **Oczekiwane:** Globalny handler błędów zwracający JSON {error:...} ze statusem 413/400 dla wszystkich ścieżek /api/*, oraz walidacja wejścia w /api/generate-cover-letter analogiczna do pozostałych endpointów.
- **Dowód:** server.ts: 'app.use(express.json({ limit: "2mb" }));' (l. 225) i brak jakiegokolwiek middleware o sygnaturze (err, req, res, next) w pliku (556 linii przeczytanych w całości).

