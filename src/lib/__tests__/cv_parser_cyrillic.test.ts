import { describe, it, expect } from 'vitest';
import { parseTextToMasterVault, detectCyrillicScript } from '../cvUniversalParser';

describe('Cyrillic Script Detection & Latin-Only Parser Guard', () => {
  it('1. Wykrywa 100% cyrylicy w CV ukraińskim/białoruskim i oznacza hasCyrillicScript oraz warning', () => {
    const ukrainianCv = `
    Олександр Коваленко
    oleksandr.kovalenko@email.ua | +380 67 123 4567 | Київ / Варшава
    Посада: Будівельник / Монтажник металоконструкцій

    ПРО СЕБЕ:
    Досвідчений монтажник з 5-річним стажем роботи на будівельних об'єктах.

    ДОСВІД РОБОТИ:
    Буд-Сервіс Київ | Монтажник
    01.2020 – 12.2023
    - Монтаж металоконструкцій та сендвіч-панелей
    - Зварювальні роботи на висоті

    НАВИЧКИ:
    Монтаж металоконструкцій, Зварювання, Читання креслень, Робота на висоті

    ОСВІТА:
    Київський будівельний коледж (2015 - 2019)
    `;

    const cyrillicCheck = detectCyrillicScript(ukrainianCv);
    expect(cyrillicCheck.hasCyrillic).toBe(true);
    expect(cyrillicCheck.count).toBeGreaterThan(50);
    expect(cyrillicCheck.message).toContain('alfabet cyrylicki');

    const parsed = parseTextToMasterVault(ukrainianCv, 'TXT');
    expect(parsed.hasCyrillicScript).toBe(true);
    expect(parsed.warnings).toBeDefined();
    expect(parsed.warnings?.[0]).toContain('Wykryto alfabet cyrylicki');
    expect(parsed.personalInfo.fullName).toBe('Олександр Коваленко');
    expect(parsed.personalInfo.email).toBe('oleksandr.kovalenko@email.ua');
  });

  it('2. Wykrywa mieszane CV: łacińskie imię i nazwisko + treść w cyrylicy', () => {
    const mixedCv = `
    Mykola Shevchenko
    mykola.shevchenko@gmail.com | +48 500 123 456 | Kraków
    Stanowisko: Spawacz TIG / Зварювальник

    ПРОФЕСІЙНИЙ ДОСВІД:
    Пром-Монтаж | Зварювальник TIG
    05.2021 - obecnie
    - Зварювання нержавіючих труб під тиском
    - Робота з аргоновим пальником

    НАВИЧКИ:
    Spawanie TIG, TIG 141, Зварювання аргоном, Читання креслень
    `;

    const cyrillicCheck = detectCyrillicScript(mixedCv);
    expect(cyrillicCheck.hasCyrillic).toBe(true);

    const parsed = parseTextToMasterVault(mixedCv, 'TXT');
    expect(parsed.hasCyrillicScript).toBe(true);
    expect(parsed.personalInfo.fullName).toBe('Mykola Shevchenko');
    expect(parsed.personalInfo.email).toBe('mykola.shevchenko@gmail.com');
    expect(parsed.warnings?.[0]).toContain('Wykryto alfabet cyrylicki');
  });

  it('3. Nie oznacza hasCyrillicScript dla typowego polskiego CV z pojedynczym obcym wyrazem', () => {
    const polishCv = `
    Jan Kowalski
    jan.kowalski@poczta.pl | 600 700 800 | Warszawa
    Stanowisko: Programista React

    DOŚWIADCZENIE ZAWODOWE:
    Software House Sp. z o.o. | Frontend Developer
    01.2021 - obecnie
    - Tworzenie aplikacji webowych w React i TypeScript

    UMIEJĘTNOŚCI:
    React, TypeScript, Node.js, SQL, Git
    `;

    const cyrillicCheck = detectCyrillicScript(polishCv);
    expect(cyrillicCheck.hasCyrillic).toBe(false);

    const parsed = parseTextToMasterVault(polishCv, 'TXT');
    expect(parsed.hasCyrillicScript).toBe(false);
    expect(parsed.warnings).toBeUndefined();
  });

  it('4. Wykrywa białoruskie CV w cyrylicy', () => {
    const belarusianCv = `
    Дзмітрый Кавалёў
    dzmitry.kavalyou@mail.by | +375 29 111 2233 | Мінск
    Пасада: Інжынер-электрык

    ВОПЫТ ПРАЦЫ:
    МінскЭнерга | Электрык
    2019 - 2023
    - Абслугоўванне электраўстановак і трансфарматараў

    НАВЫКІ:
    Электрамантаж, Вымярэнні, Схемы
    `;

    const cyrillicCheck = detectCyrillicScript(belarusianCv);
    expect(cyrillicCheck.hasCyrillic).toBe(true);

    const parsed = parseTextToMasterVault(belarusianCv, 'TXT');
    expect(parsed.hasCyrillicScript).toBe(true);
    expect(parsed.personalInfo.fullName).toBe('Дзмітрый Кавалёў');
  });
});
