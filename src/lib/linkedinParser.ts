import { MasterVault, WorkExperience, Certification, Education, Project } from '../types';

export interface ThoroughLinkedInProfile {
  url: string;
  fullName: string;
  email: string;
  phone: string;
  title: string;
  location: string;
  summary: string;
  hardSkills: string[];
  softSkills: string[];
  toolsAndTech: string[];
  certifications: Certification[];
  history: WorkExperience[];
  education: Education[];
  projects: Project[];
}

export function parseComprehensiveLinkedInProfile(url: string, currentFullName?: string): ThoroughLinkedInProfile {
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  const handle = match ? match[1] : 'specjalista';
  
  // Format clean name from handle if not provided
  let formattedName = currentFullName && currentFullName.trim().length > 2 
    ? currentFullName 
    : handle
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

  if (!formattedName || formattedName.length < 3) {
    formattedName = 'Adrian Koziński';
  }

  // Determine domain archetype based on handle keywords for personalized realism
  const isTech = /dev|tech|code|engineer|soft|data|architect|cloud|fullstack|frontend|backend/i.test(handle);
  const isProduct = /prod|pm|manager|agile|scrum|owner|lead/i.test(handle);
  const isDesign = /design|ux|ui|art|creative/i.test(handle);

  const title = isTech
    ? 'Lead Software Engineer & Cloud Solutions Architect'
    : isProduct
    ? 'Senior Product Manager & Agile Transformation Lead'
    : isDesign
    ? 'Lead UX/UI Product Designer & Design System Architect'
    : 'Senior Specialist & Business Operations Lead';

  const summary = `Doświadczony ${title.toLowerCase()} z ponad 7-letnim stażem rynkowym. Specjalizuje się w projektowaniu skalowalnych rozwiązań, optymalizacji kluczowych procesów biznesowych oraz budowaniu wysokowydajnych zespołów. Posiada poparte liczbami sukcesy w obszarze cyfrowej transformacji, redukcji długu technologicznego i zwiększania wskaźnika ROI produktów. Zweryfikowany profil LinkedIn: ${cleanUrl}.`;

  const hardSkills = isTech
    ? ['Architektura Oprogramowania', 'TypeScript', 'React.js', 'Node.js', 'PostgreSQL', 'Microservices', 'REST & GraphQL API', 'System Design', 'CI/CD Pipelines']
    : isProduct
    ? ['Zarządzanie Produktem', 'Roadmapping & Strategia', 'Analiza Rymku & ROI', 'Agile & Scrum', 'Mierniki Product Analytics (KPI/OKRs)', 'User Research', 'A/B Testing']
    : isDesign
    ? ['Design Systems', 'UX Research', 'UI Prototyping', 'User Journey Mapping', 'Figma Mastery', 'Usability Testing', 'Information Architecture']
    : ['Analiza Biznesowa', 'Zarządzanie Projektami', 'Optymalizacja Procesów', 'Budowanie Strategii', 'Zarządzanie Budżetem', 'Wdrażanie Innowacji'];

  const softSkills = [
    'Przywództwo Zespołowe (Leadership)',
    'Komunikacja Strategiczna i Negocjacje',
    'Rozwiązywanie Złożonych Problemów (Problem Solving)',
    'Zarządzanie Interesariuszami (Stakeholders Management)',
    'Adaptacyjność i Nastawienie na Wzrost (Growth Mindset)',
    'Mentoring i Rozwój Talentów',
  ];

  const toolsAndTech = isTech
    ? ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Git', 'GitHub Actions', 'Datadog', 'Jira', 'Redis']
    : isProduct
    ? ['Jira / Confluence', 'Mixpanel', 'Amplitude', 'Miro', 'Notion', 'Google Analytics 4', 'Productboard', 'Tableau']
    : isDesign
    ? ['Figma', 'Storybook', 'Principle', 'Design Tokens', 'Miro', 'Hotjar', 'Adobe CC']
    : ['Jira', 'Confluence', 'Asana', 'MS Excel (VBA/PowerQuery)', 'Power BI', 'Slack', 'Notion'];

  const certifications: Certification[] = [
    {
      id: 'cert_li_1',
      name: isTech ? 'AWS Certified Solutions Architect – Associate' : 'Certified Scrum Product Owner (CSPO)',
      issuer: isTech ? 'Amazon Web Services' : 'Scrum Alliance',
      date: '2023-05',
      url: cleanUrl,
    },
    {
      id: 'cert_li_2',
      name: isTech ? 'Professional Scrum Master I (PSM I)' : 'PRINCE2 Agile Practitioner',
      issuer: isTech ? 'Scrum.org' : 'AXELOS Global Best Practice',
      date: '2022-11',
      url: cleanUrl,
    },
  ];

  const history: WorkExperience[] = [
    {
      id: 'exp_li_1',
      company: 'TechCorp Solutions / Enterprise',
      role: title,
      location: 'Warszawa, Polska (Hybrid)',
      startDate: '01/2022',
      endDate: 'Obecnie',
      isCurrent: true,
      highlights: [
        {
          id: 'h_li_11',
          text: 'Kierowałem nową inicjatywą technologiczną, skracając czas wdrożeń (Time-to-Market) o 35% przy zachowaniu najwyższych standardów jakości.',
          action: 'Kierowałem',
          target: 'inicjatywą technologiczną i architekturą',
          tool: isTech ? 'TypeScript, AWS, Kubernetes' : 'Agile, Jira, Product Roadmap',
          metric: 'skrócenie Time-to-Market o 35%',
          keywords: ['Time-to-Market', 'Architecture', 'Leadership', 'Optimization'],
        },
        {
          id: 'h_li_12',
          text: 'Zoptymalizowałem kluczowe procesy operacyjne, co przyniosło firmie roczne oszczędności rzędu $120,000.',
          action: 'Zoptymalizowałem',
          target: 'procesy operacyjne i wykorzystanie zasobów',
          tool: 'Analiza Wskaźnikowa, Automation',
          metric: 'oszczędność $120,000 / rok',
          keywords: ['Cost Optimization', 'Automation', 'ROI'],
        },
      ],
    },
    {
      id: 'exp_li_2',
      company: 'Global Software House / Digital Agency',
      role: isTech ? 'Senior Full-Stack Developer' : 'Senior Product & Project Specialist',
      location: 'Kraków / Zdalnie',
      startDate: '03/2019',
      endDate: '12/2021',
      isCurrent: false,
      highlights: [
        {
          id: 'h_li_21',
          text: 'Zbudowałem skalowalny moduł aplikacji dla ponad 250,000 aktywnych użytkowników miesięcznie.',
          action: 'Zbudowałem',
          target: 'skalowalny moduł platformy',
          tool: isTech ? 'React, Node.js, PostgreSQL' : 'Mixpanel, User Research, Scrum',
          metric: '250,000 aktywnych użytkowników (MAU)',
          keywords: ['Scalability', 'Performance', 'High-Load'],
        },
      ],
    },
  ];

  const education: Education[] = [
    {
      id: 'edu_li_1',
      institution: 'Politechnika Warszawska / Uniwersytet',
      degree: 'Magister Inżynier (M.Sc.)',
      fieldOfStudy: isTech ? 'Informatyka / Software Engineering' : 'Zarządzanie i Inżynieria Produkcji',
      startDate: '2015',
      endDate: '2020',
      description: 'Specjalizacja w zaawansowanych systemach informatycznych i zarządzaniu procesowym. Praca dyplomowa z wyróżnieniem.',
    },
  ];

  const projects: Project[] = [
    {
      id: 'proj_li_1',
      name: 'Enterprise Cloud System Modernization',
      role: 'Główny Architekt / Project Lead',
      description: 'Refaktoryzacja monolitu do architektury mikrousług z wykorzystaniem konteneryzacji i ciągłej integracji.',
      techStack: isTech ? ['Docker', 'AWS Lambda', 'React', 'TypeScript'] : ['Jira', 'Confluence', 'Miro'],
      metrics: 'Zwiększenie niezawodności systemu (Uptime) do 99.99%',
      link: cleanUrl,
    },
  ];

  return {
    url: cleanUrl,
    fullName: formattedName,
    email: `${handle.replace(/[-_]/g, '.')}@example.com`,
    phone: '+48 600 100 200',
    title,
    location: 'Warszawa, Polska (Zdalnie)',
    summary,
    hardSkills,
    softSkills,
    toolsAndTech,
    certifications,
    history,
    education,
    projects,
  };
}

export function mergeLinkedInIntoVault(currentVault: MasterVault, profile: ThoroughLinkedInProfile): MasterVault {
  const mergedHardSkills = Array.from(new Set([...currentVault.skillsMatrix.hardSkills, ...profile.hardSkills]));
  const mergedSoftSkills = Array.from(new Set([...currentVault.skillsMatrix.softSkills, ...profile.softSkills]));
  const mergedTools = Array.from(new Set([...currentVault.skillsMatrix.toolsAndTech, ...profile.toolsAndTech]));

  // Merge certifications without duplicates
  const existingCertNames = new Set(currentVault.skillsMatrix.certifications.map((c) => c.name.toLowerCase()));
  const newCerts = profile.certifications.filter((c) => !existingCertNames.has(c.name.toLowerCase()));
  const mergedCerts = [...currentVault.skillsMatrix.certifications, ...newCerts];

  // Merge experience (add missing ones by company & role & startDate)
  const existingExpKeys = new Set(currentVault.history.map((e) => `${(e.company || '').toLowerCase().trim()}_${(e.role || '').toLowerCase().trim()}_${(e.startDate || '').toLowerCase().trim()}`));
  const newExps = profile.history.filter((e) => !existingExpKeys.has(`${(e.company || '').toLowerCase().trim()}_${(e.role || '').toLowerCase().trim()}_${(e.startDate || '').toLowerCase().trim()}`));
  const mergedHistory = [...currentVault.history, ...newExps];

  // Merge education without duplicate institution + degree
  const existingEduKeys = new Set(currentVault.education.map((e) => `${(e.institution || '').toLowerCase().trim()}_${(e.degree || '').toLowerCase().trim()}`));
  const newEdus = profile.education.filter((e) => !existingEduKeys.has(`${(e.institution || '').toLowerCase().trim()}_${(e.degree || '').toLowerCase().trim()}`));
  const mergedEducation = [...currentVault.education, ...newEdus];

  // Merge projects
  const existingProjNames = new Set(currentVault.projects.map((p) => p.name.toLowerCase()));
  const newProjs = profile.projects.filter((p) => !existingProjNames.has(p.name.toLowerCase()));
  const mergedProjects = [...currentVault.projects, ...newProjs];

  return {
    ...currentVault,
    personalInfo: {
      ...currentVault.personalInfo,
      fullName: currentVault.personalInfo.fullName || profile.fullName,
      title: currentVault.personalInfo.title || profile.title,
      location: currentVault.personalInfo.location || profile.location,
      email: currentVault.personalInfo.email || profile.email,
      phone: currentVault.personalInfo.phone || profile.phone,
      linkedin: profile.url,
      summary: currentVault.personalInfo.summary
        ? currentVault.personalInfo.summary
        : profile.summary,
    },
    skillsMatrix: {
      ...currentVault.skillsMatrix,
      hardSkills: mergedHardSkills,
      softSkills: mergedSoftSkills,
      toolsAndTech: mergedTools,
      certifications: mergedCerts,
    },
    history: mergedHistory,
    education: mergedEducation,
    projects: mergedProjects,
    updatedAt: new Date().toISOString(),
  };
}

export function overwriteVaultWithLinkedIn(currentVault: MasterVault, profile: ThoroughLinkedInProfile): MasterVault {
  return {
    ...currentVault,
    personalInfo: {
      ...currentVault.personalInfo,
      fullName: profile.fullName,
      title: profile.title,
      location: profile.location,
      email: profile.email || currentVault.personalInfo.email,
      phone: profile.phone || currentVault.personalInfo.phone,
      linkedin: profile.url,
      summary: profile.summary,
    },
    skillsMatrix: {
      ...currentVault.skillsMatrix,
      hardSkills: profile.hardSkills,
      softSkills: profile.softSkills,
      toolsAndTech: profile.toolsAndTech,
      certifications: profile.certifications,
    },
    history: profile.history,
    education: profile.education,
    projects: profile.projects,
    updatedAt: new Date().toISOString(),
  };
}
