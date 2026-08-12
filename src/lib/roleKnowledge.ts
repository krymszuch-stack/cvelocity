export interface RoleKnowledge {
  family: string;
  aliases: string[];
  commonRequirements: string[];
  commonKeywords: string[];
  softSkills: string[];
  riskFlags: string[];
}

export const ROLE_KNOWLEDGE: RoleKnowledge[] = [
  {
    family: 'Frontend / UI',
    aliases: ['frontend', 'front-end', 'ui', 'ux', 'react', 'javascript', 'typescript', 'web developer', 'webdesigner', 'developer'],
    commonRequirements: ['TypeScript', 'React', 'JavaScript ES6+', 'REST API', 'HTML / CSS', 'UX / accessibility', 'responsiveness', 'Git'],
    commonKeywords: ['React', 'TypeScript', 'JavaScript', 'UI', 'UX', 'CSS', 'Next.js', 'Frontend'],
    softSkills: ['komunikacja', 'rozwiązywanie problemów', 'praca w zespole'],
    riskFlags: ['brak doświadczenia z React', 'brak testów UI', 'brak pracy z design systemami'],
  },
  {
    family: 'Backend / API',
    aliases: ['backend', 'api', 'node', 'python', 'java', 'dotnet', 'fullstack', 'full-stack', 'server', 'engineering'],
    commonRequirements: ['Node.js', 'Python', 'REST API', 'SQL', 'PostgreSQL', 'Docker', 'Git', 'system design'],
    commonKeywords: ['API', 'backend', 'Node.js', 'SQL', 'microservices', 'architecture', 'system design'],
    softSkills: ['analiza', 'architektura', 'komunikacja techniczna'],
    riskFlags: ['brak SQL', 'brak API', 'brak testów'],
  },
  {
    family: 'DevOps / Cloud',
    aliases: ['devops', 'cloud', 'platform', 'site reliability', 'sre', 'infra', 'infrastructure'],
    commonRequirements: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'monitoring'],
    commonKeywords: ['Cloud', 'Kubernetes', 'Terraform', 'AWS', 'Docker', 'Linux', 'CI/CD'],
    softSkills: ['odpowiedzialność', 'diagnozowanie', 'automatyzacja'],
    riskFlags: ['brak Linux', 'brak CI/CD', 'brak monitoringu'],
  },
  {
    family: 'Data / BI / Analytics',
    aliases: ['data', 'bi', 'analytics', 'sql', 'etl', 'business analyst', 'analyst', 'power bi', 'tableau'],
    commonRequirements: ['SQL', 'Power BI', 'Excel', 'analiza danych', 'dashboarding', 'modelowanie danych'],
    commonKeywords: ['SQL', 'Excel', 'Power BI', 'Dashboards', 'Analytics', 'BigQuery', 'ETL'],
    softSkills: ['analiza biznesowa', 'prezentacja danych', 'dokładność'],
    riskFlags: ['brak SQL', 'brak dashboardów', 'brak analityki'],
  },
  {
    family: 'Product / PM',
    aliases: ['product manager', 'pm', 'project manager', 'scrum', 'agile', 'business analyst'],
    commonRequirements: ['Agile', 'roadmap', 'stakeholder management', 'requirements', 'analytics', 'prioritization'],
    commonKeywords: ['Product', 'roadmap', 'stakeholders', 'Agile', 'specyfikacja', 'prioritization'],
    softSkills: ['negocjacje', 'komunikacja', 'priorytetyzacja'],
    riskFlags: ['brak roadmapy', 'brak stakeholder management', 'brak analityki'],
  },
  {
    family: 'Sales / Business Development',
    aliases: ['sales', 'sprzedaż', 'business development', 'bdm', 'account executive', 'key account'],
    commonRequirements: ['sprzedaż', 'negocjacje', 'CRM', 'lead generation', 'retention', 'obsługa klienta'],
    commonKeywords: ['CRM', 'sprzedaż', 'lead generation', 'negocjacje', 'account management'],
    softSkills: ['negocjacje', 'otwartość', 'samodzielność'],
    riskFlags: ['brak CRM', 'brak lead generation', 'brak negocjacji'],
  },
  {
    family: 'HR / Talent / People Ops',
    aliases: ['hr', 'talent', 'recruiter', 'human resources', 'people ops'],
    commonRequirements: ['rekrutacja', 'HR', 'doradztwo', 'MS Excel', 'komunikacja', 'prawo pracy'],
    commonKeywords: ['rekrutacja', 'HR', 'talent acquisition', 'employment', 'onboarding'],
    softSkills: ['empatia', 'komunikacja', 'dyskrecyjność'],
    riskFlags: ['brak doświadczenia rekrutacyjnego', 'brak znajomości prawa pracy'],
  },
  {
    family: 'Logistics / Supply Chain',
    aliases: ['logistics', 'supply chain', 'warehouse', 'procurement', 'buyer', 'transport', 'logistyk'],
    commonRequirements: ['logistyka', 'procurement', 'ERP', 'SAP', 'planowanie', 'transport'],
    commonKeywords: ['ERP', 'SAP', 'transport', 'magazyn', 'procurement', 'supply chain'],
    softSkills: ['organizacja', 'terminowość', 'koordynacja'],
    riskFlags: ['brak ERP', 'brak planowania', 'brak obsługi magazynu'],
  },
  {
    family: 'Finance / Accounting',
    aliases: ['finance', 'accounting', 'controlling', 'finansowy', 'księgowy', 'controller'],
    commonRequirements: ['Excel', 'księgowość', 'analiza finansowa', 'VAT', 'PIT', 'kontrola budżetu'],
    commonKeywords: ['Excel', 'VAT', 'PIT', 'księgowość', 'controlling', 'budżet'],
    softSkills: ['dokładność', 'dyscyplina', 'analiza finansowa'],
    riskFlags: ['brak księgowości', 'brak Excela', 'brak analizy budżetowej'],
  },
];

export function normalizeRoleQuery(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function inferRoleKnowledge(title: string): RoleKnowledge | null {
  const normalized = normalizeRoleQuery(title);
  if (!normalized) return null;

  for (const role of ROLE_KNOWLEDGE) {
    const matches = role.aliases.some((alias) => {
      const normalizedAlias = normalizeRoleQuery(alias);
      return normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized);
    });

    if (matches) return role;
  }

  return null;
}

export function buildRoleRequirements(title: string): string[] {
  const role = inferRoleKnowledge(title);
  if (!role) return [];

  return [...new Set([...role.commonRequirements, ...role.commonKeywords])].slice(0, 8);
}
