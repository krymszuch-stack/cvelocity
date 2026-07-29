/**
 * Predefined dictionaries for Autocomplete / Suggestions in Master Vault and Job Matcher.
 * Provides Polish cities, job titles, hard skills, soft skills, and tools.
 */

export const SUGGESTED_LOCATIONS = [
  'Warszawa',
  'Kraków',
  'Wrocław',
  'Gdańsk',
  'Poznań',
  'Katowice',
  'Łódź',
  'Szczecin',
  'Lublin',
  'Gdynia',
  'Rzeszów',
  'Bydgoszcz',
  'Białystok',
  'Toruń',
  'Olsztyn',
  'Bielsko-Biała',
  'Opole',
  'Zielona Góra',
  'Gliwice',
  'Częstochowa',
  'Sosnowiec',
  'Radom',
  'Rybnik',
  'Tychy',
  'Koszalin',
  'Kalisz',
  'Legnica',
  'Piaseczno',
  'Pruszków',
  'Zdalnie / Remote',
  'Hybrydowo (Warszawa)',
  'Hybrydowo (Kraków)',
  'Hybrydowo (Wrocław)',
  'Hybrydowo (Gdańsk)',
  'Hybrydowo (Poznań)',
  'Hybrydowo (Katowice)',
  'Zagranica / Relokacja',
  'Londyn (UK)',
  'Berlin (Niemcy)',
  'Amsterdam (Holandia)',
  'Zurich (Szwajcaria)',
];

export const SUGGESTED_JOB_TITLES = [
  // IT, Technology & Data
  'Senior Full-Stack Engineer',
  'Full-Stack Developer',
  'Senior Frontend Developer',
  'Frontend Developer (React / TypeScript)',
  'Backend Developer (Node.js / Python / Java)',
  'DevOps Engineer & Cloud Architect',
  'Cloud Systems Architect (AWS / GCP / Azure)',
  'Software Engineer',
  'Tech Lead / Team Lead',
  'Engineering Manager',
  'System Architect',
  'Data Engineer',
  'Data Scientist / AI Specialist',
  'Business Intelligence (BI) Developer',
  'QA Automation Engineer / Tester Software',
  'System Administrator (Linux / Windows)',
  'Cybersecurity Specialist',
  'Mobile Developer (iOS / Android / React Native)',
  'Embedded Systems Engineer',

  // Management, Product & Analytics
  'Product Manager',
  'Technical Project Manager',
  'Scrum Master / Agile Coach',
  'Business Analyst',
  'Analityk Biznesowy / Systemowy',
  'Project Manager',
  'Dyrektor Operacyjny (COO)',
  'Kierownik Projektu',
  'Management Consultant',
  'Strategy Manager',

  // Marketing, E-commerce & Content
  'Digital Marketing Manager',
  'Specjalista ds. Marketingu Cyfrowego',
  'Performance Marketing Specialist (PPC / Meta / Google Ads)',
  'SEO / SEM Specialist',
  'Content Marketing Manager / Copywriter',
  'Social Media Specialist',
  'E-commerce Manager',
  'Growth Hacker / Growth Marketer',
  'PR & Brand Communication Manager',

  // Sales, Account Management & Business Development
  'Account Executive / Key Account Manager',
  'Business Development Manager (BDM)',
  'Specjalista ds. Sprzedaży / Przedstawiciel Handlowy',
  'Sales Development Representative (SDR)',
  'Dyrektor Handlowy / Head of Sales',
  'Customer Success Manager (CSM)',
  'Inside Sales Specialist',

  // Finance, Accounting & Controlling
  'Analityk Finansowy (Financial Analyst)',
  'Główny Księgowy / Chief Accountant',
  'Specjalista ds. Księgowości / Samodzielny Księgowy',
  'Financial Controller / Kontroler Finansowy',
  'Audytor Wewnętrzny / Zewnętrzny',
  'Dyrektor Finansowy (CFO)',
  'Specjalista ds. Analiz Danych i Controlingu',
  'Risk Analyst / Analityk Ryzyka',

  // HR, Talent Acquisition & Administration
  'HR Business Partner (HRBP)',
  'Talent Acquisition Specialist / Rekruter',
  'HR Generalist / Specjalista ds. HR',
  'Payroll & Benefits Specialist (Kadry i Płace)',
  'Office Manager / Kierownik Biura',
  'Specjalista ds. Administracji',
  'Employer Branding Specialist',

  // Logistics, Supply Chain & Purchasing
  'Supply Chain Manager / Kierownik Łańcucha Dostaw',
  'Logistyk / Specjalista ds. Logistyki',
  'Specjalista ds. Zakupów / Buyer / Procurement Specialist',
  'Kierownik Magazynu / Warehouse Manager',
  'Specjalista ds. Importu i Eksportu',

  // Engineering, Production & Quality Assurance
  'Inżynier Budownictwa / Kierownik Budowy',
  'Inżynier Konstruktor / CAD Designer',
  'Inżynier Jakości (Quality Engineer / QA)',
  'Inżynier Automatyk / Robotyki',
  'Kierownik Produkcji / Production Manager',
  'Inżynier Serwisu / Field Service Engineer',

  // Design, UX/UI & Creative
  'UI/UX Designer',
  'Product Designer',
  'Grafik Komputerowy / Graphic Designer',
  'Motion Designer / Video Editor',
  'Art Director',

  // Customer Service & Operations
  'Specjalista ds. Obsługi Klienta (Customer Support)',
  'Call Center Team Leader',
  'Operations Specialist',
  'Specjalista ds. Reklamacji i Jakości Obsługi',

  // Healthcare, Pharma & Biotech
  'Przedstawiciel Medyczny / Farmaceutyczny',
  'Monitork Badań Klinicznych (CRA)',
  'Specjalista ds. Rejestracji Leków (Regulatory Affairs)',
  'Lekarz / Pielęgniarka / Ratownik Medyczny',

  // Legal & Compliance
  'Prawnik / Radca Prawny / Associate',
  'Compliance Officer / Specjalista ds. Zgodności',
  'Inspektor Ochrony Danych (RODO / DPO)',
];

export const SUGGESTED_HARD_SKILLS = [
  // Technical & IT
  'TypeScript',
  'JavaScript (ES6+)',
  'React.js',
  'Next.js',
  'Node.js',
  'Python',
  'SQL',
  'PostgreSQL',
  'Docker',
  'Kubernetes',
  'AWS',
  'Google Cloud (GCP)',
  'Java / Spring Boot',
  'C# / .NET',
  'PHP / Laravel',
  'REST API / GraphQL',
  'CI/CD Pipelines',

  // Analytics, Finance & Accounting
  'Excel Zaawansowany (VBA / Power Query)',
  'Power BI / Tableau',
  'Modelowanie Finansowe',
  'Analiza Wskaźnikowa i RFi',
  'Księgowość Pełna (UoR / MSSF)',
  'Rozliczenia Podatkowe (PIT / CIT / VAT)',
  'Standardy IFRS / US GAAP',
  'Analiza Statystyczna & SPSS',

  // Marketing, E-commerce & Content
  'Google Analytics 4 (GA4)',
  'Google Ads / Meta Ads Manager',
  'SEO / Optymalizacja On-Page & Off-Page',
  'Copywriting i Storytelling',
  'E-mail Marketing & Automation (Klaviyo / Mailchimp)',
  'A/B Testing & Konwersja CRO',
  'Content Strategy',

  // Sales & Management
  'B2B Sales & Lead Generation',
  'Zarządzanie Lejkiem Sprzedażowym',
  'Negocjacje Handlowe',
  'Key Account Management',
  'Metodyki Projektowe (Agile / Scrum / Prince2 / PMP)',
  'Zarządzanie Budżetem i P&L',
  'Budowanie Relacji z Klientem',

  // HR, Operations & Legal
  'Prawo Pracy i BHP',
  'Rozliczenia Płacowe (Kadry i Płace)',
  'Direct Search / Headhunting',
  'Zarządzanie Łańcuchem Dostaw (SCM)',
  'Zgodność RODO / GDPR',
  'ISO 9001 / IATF 16949 / Lean Manufacturing',
];

export const SUGGESTED_SOFT_SKILLS = [
  'Komunikatywność i Jasność Przekazu',
  'Praca w Zespole i Kolaboracja',
  'Zarządzanie Czasem i Priorytetyzacja Tasków',
  'Analityczne i Myślenie Systemowe',
  'Leadership i Przywództwo',
  'Mentoring i Rozwój Zespołu',
  'Rozwiązywanie Problemów (Problem Solving)',
  'Krytyczne Myślenie',
  'Negocjacje i Wywieranie Wpływu',
  'Adaptacyjność i Elastyczność w Zmiennym Otoczeniu',
  'Samodzielność i Inicjatywa',
  'Odpowiedzialność Biznesowa',
  'Zarządzanie Projektami i Zadaniami',
  'Prowadzenie Prezentacji i Public Speaking',
  'Orientacja na Cele Biznesowe (KPI / OKR)',
  'Empatia i Inteligencja Emocjonalna',
];

export const SUGGESTED_TOOLS_AND_TECH = [
  // IT & Dev
  'Git / GitHub / GitLab',
  'Jira / Confluence',
  'VS Code / JetBrains',
  'Postman / Insomnia',
  'Docker / Podman',
  'Kubernetes / Helm',

  // Business, Office & ERP
  'Microsoft Excel / Word / PowerPoint',
  'SAP ERP / SAP S/4HANA',
  'Salesforce CRM',
  'HubSpot CRM',
  'Enova365 / Optima / Symfonia',
  'ASANA / Trello / Monday.com',
  'Notion / Coda',
  'Microsoft Teams / Slack',

  // Analytics & BI
  'Microsoft Power BI',
  'Tableau',
  'Google Looker Studio',
  'Google Tag Manager (GTM)',

  // Design & Media
  'Figma',
  'Adobe Photoshop / Illustrator',
  'Adobe Premiere Pro / After Effects',
  'Canva Pro',

  // HR & Recruitment
  'eRecruiter / Traffit',
  'LinkedIn Recruiter',
  'Płatnik / Comarch HRM',
];
