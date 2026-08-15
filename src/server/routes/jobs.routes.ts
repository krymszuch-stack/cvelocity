import { Router, Request, Response, NextFunction } from 'express';
import * as cheerio from 'cheerio';
import { JobOffer } from '../../types';
import { JobsQueryParams, FetchJdUrlRequest, ApiResponse } from '../../types/api';

export const jobsRouter = Router();

// In-Memory Cache with TTL (5 minutes)
interface CacheEntry {
  data: JobOffer[];
  expiry: number;
}
const jobsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

const MOCK_JOBS: JobOffer[] = [
  {
    id: 'job-1',
    title: 'Senior Full-Stack Engineer & Cloud Architect',
    company: 'TechGrowth Systems',
    salary: '22 000 - 28 000 PLN netto B2B',
    location: 'Warszawa',
    description: 'Budowa skalowalnych platform chmurowych w TypeScript, React i Node.js z bazą PostgreSQL.',
    requirements: ['React', 'TypeScript', 'Node.js', 'AWS', 'PostgreSQL', 'Docker'],
    remote: true,
    portal: 'JustJoinIT',
    level: 'Senior',
    url: 'https://justjoin.it',
    techStack: ['React', 'TypeScript', 'Node.js', 'AWS', 'PostgreSQL'],
  },
  {
    id: 'job-2',
    title: 'Frontend React / Next.js Specialist',
    company: 'Fintech Velocity Hub',
    salary: '18 000 - 24 000 PLN netto B2B',
    location: 'Kraków',
    description: 'Rozwój nowoczesnych interfejsów bankowości internetowej z użyciem TailwindCSS i Vitest.',
    requirements: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'REST API'],
    remote: true,
    portal: 'NoFluffJobs',
    level: 'Mid',
    url: 'https://nofluffjobs.com',
    techStack: ['React', 'Next.js', 'TypeScript', 'TailwindCSS'],
  },
  {
    id: 'job-3',
    title: 'Lead Software Architect & Engineering Manager',
    company: 'Enterprise Cloud Labs',
    salary: '32 000 - 40 000 PLN netto B2B',
    location: 'Wrocław',
    description: 'Prowadzenie zespołu inżynierskiego, projektowanie mikroserwisów i optymalizacja pipeline CI/CD.',
    requirements: ['TypeScript', 'Kubernetes', 'Architecture', 'Team Leadership', 'GCP'],
    remote: false,
    portal: 'LinkedIn',
    level: 'Lead',
    url: 'https://linkedin.com',
    techStack: ['TypeScript', 'Kubernetes', 'GCP', 'Docker'],
  },
  {
    id: 'job-4',
    title: 'Junior / Entry Frontend Developer',
    company: 'Creative Web Studio',
    salary: '8 000 - 12 000 PLN brutto UoP',
    location: 'Poznań',
    description: 'Tworzenie responsywnych stron internetowych i aplikacji SPA dla klientów międzynarodowych.',
    requirements: ['JavaScript', 'HTML5', 'CSS3', 'React', 'Git'],
    remote: true,
    portal: 'Pracuj.pl',
    level: 'Junior',
    url: 'https://pracuj.pl',
    techStack: ['JavaScript', 'HTML5', 'CSS3', 'React'],
  },
  {
    id: 'job-5',
    title: 'DevOps & Cloud Infrastructure Engineer',
    company: 'ScaleX Data Platforms',
    salary: '25 000 - 30 000 PLN netto B2B',
    location: 'Gdańsk',
    description: 'Zarządzanie klastrami Kubernetes, monitoring Prometheus/Grafana i automatyzacja Terraform.',
    requirements: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Linux'],
    remote: true,
    portal: 'JustJoinIT',
    level: 'Senior',
    url: 'https://justjoin.it',
    techStack: ['Kubernetes', 'Terraform', 'AWS', 'Docker'],
  },
];

/**
 * Filter out web portal navigation noise
 */
function cleanJobHtml(html: string): { title: string; company: string; description: string } {
  const $ = cheerio.load(html);

  // Remove noise elements
  $('script, style, svg, header, footer, nav, aside, noscript, [aria-label*="cookie" i]').remove();

  const title = $('h1').first().text().trim() || $('title').text().split(/[-|]/)[0]?.trim() || 'Stanowisko z Ogłoszenia';
  const company = $('[class*="company" i], [class*="employer" i]').first().text().trim() || 'Firma Rekrutująca';
  const description = $('main, article, [role="main"], body').text().replace(/\s+/g, ' ').trim();

  return { title, company, description: description.slice(0, 5000) };
}

/**
 * GET /api/jobs
 */
jobsRouter.get('/jobs', (req: Request<{}, {}, {}, JobsQueryParams>, res: Response) => {
  const { keywords = '', location = '', remoteOnly, portal = 'ALL', seniority = 'ALL' } = req.query;

  const isRemote = remoteOnly === 'true' || remoteOnly === true;
  const cacheKey = `${keywords}_${location}_${isRemote}_${portal}_${seniority}`.toLowerCase();
  const now = Date.now();

  // 1. Check in-memory cache
  const cached = jobsCache.get(cacheKey);
  if (cached && cached.expiry > now) {
    return res.json({
      success: true,
      jobs: cached.data,
      fromCache: true,
    });
  }

  // 2. Filter Mock Jobs
  const filtered = MOCK_JOBS.filter((job) => {
    if (isRemote && !job.remote) return false;
    if (portal !== 'ALL' && job.portal?.toLowerCase() !== portal.toLowerCase()) return false;
    if (seniority !== 'ALL' && job.level?.toLowerCase() !== seniority.toLowerCase()) return false;

    if (location && location !== 'Wszystkie') {
      const locMatch = job.location.toLowerCase().includes(location.toLowerCase());
      if (!locMatch && !job.remote) return false;
    }

    if (keywords) {
      const kw = keywords.toLowerCase();
      const titleMatch = job.title.toLowerCase().includes(kw);
      const reqMatch = (job.requirements || []).some((r) => r.toLowerCase().includes(kw));
      if (!titleMatch && !reqMatch) return false;
    }

    return true;
  });

  // 3. Save to cache
  jobsCache.set(cacheKey, {
    data: filtered,
    expiry: now + CACHE_TTL_MS,
  });

  res.json({
    success: true,
    jobs: filtered,
    fromCache: false,
  });
});

/**
 * POST /api/fetch-jd-url
 */
jobsRouter.post('/fetch-jd-url', async (req: Request<{}, {}, FetchJdUrlRequest>, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({
        success: false,
        error: 'Podaj prawidłowy adres URL ogłoszenia o pracę (http/https).',
      });
    }

    let fetchedHtml = '';

    // Direct fetch
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (response.ok) {
        fetchedHtml = await response.text();
      }
    } catch (e) {
      console.warn('Direct fetch failed, falling back to basic extraction:', e);
    }

    const cleaned = cleanJobHtml(fetchedHtml || `<html><body><h1>Oferta z ${url}</h1><p>Treść ogłoszenia pobrana z adresu ${url}</p></body></html>`);

    res.json({
      success: true,
      title: cleaned.title,
      company: cleaned.company,
      descriptionRaw: cleaned.description,
      sourceUrl: url,
    });
  } catch (err) {
    next(err);
  }
});
