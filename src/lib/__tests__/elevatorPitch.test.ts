import { describe, it, expect } from 'vitest';
import {
  generateElevatorPitch,
  estimateSpeakingDurationSec,
  extractTopMetrics,
} from '../elevatorPitchEngine';
import { MasterVault } from '../../types';
import { createEmptyVault } from '../sampleVault';

describe('Elevator Pitch Generator (elevator-pitch-gen-v1)', () => {
  const createMockVault = (): MasterVault => {
    const vault = createEmptyVault('Jan Kowalski', 'jan@example.com');
    vault.personalInfo = {
      fullName: 'Jan Kowalski',
      title: 'Senior DevOps & Cloud Engineer',
      summary: 'Inżynier chmury z 6-letnim doświadczeniem w orkiestracji Kubernetes i automatyzacji CI/CD.',
      email: 'jan@example.com',
      phone: '+48 123 456 789',
      location: 'Warszawa',
    };
    vault.skillsMatrix = {
      hardSkills: ['Kubernetes', 'Terraform', 'AWS', 'Docker'],
      toolsAndTech: ['Prometheus', 'Grafana', 'GitLab CI'],
      softSkills: ['Przywództwo techniczne'],
      certifications: [],
    };
    vault.history = [
      {
        id: 'exp_1',
        company: 'Fintech Sp. z o.o.',
        role: 'Lead DevOps Engineer',
        location: 'Warszawa',
        startDate: '2021-01',
        endDate: '2023-08',
        isCurrent: false,
        highlights: [
          {
            id: 'hl_1',
            text: 'Skrócenie czasu deploymentu o 65% oraz redukcja incydentów produkcyjnych do 0.',
            action: 'Skrócenie',
            target: 'deployment',
            tool: 'Kubernetes',
            metric: '-65% czasu deploymentu',
            keywords: ['Kubernetes', 'CI/CD'],
          },
          {
            id: 'hl_2',
            text: 'Optymalizacja kosztów chmury o 40 000 PLN rocznie.',
            action: 'Optymalizacja',
            target: 'koszty AWS',
            tool: 'AWS',
            metric: '40 000 PLN rocznych oszczędności',
            keywords: ['AWS', 'FinOps'],
          },
        ],
      },
    ];
    return vault;
  };

  describe('Kalkulator Czasu Mówienia (WPM)', () => {
    it('zwraca 0 sekund dla pustego tekstu', () => {
      expect(estimateSpeakingDurationSec('')).toBe(0);
      expect(estimateSpeakingDurationSec('   ')).toBe(0);
    });

    it('poprawnie szacuje czas mowy przy 130 WPM', () => {
      // 130 słów powinno trwać ~60 sekund
      const words130 = Array(130).fill('słowo').join(' ');
      const duration = estimateSpeakingDurationSec(words130, 130);
      expect(duration).toBe(60);

      // 65 słów powinno trwać ~30 sekund
      const words65 = Array(65).fill('słowo').join(' ');
      expect(estimateSpeakingDurationSec(words65, 130)).toBe(30);
    });
  });

  describe('Ekstrakcja Metryk z MasterVault', () => {
    it('wyciąga unikalne metryki sukcesu z historii zatrudnienia', () => {
      const vault = createMockVault();
      const metrics = extractTopMetrics(vault);

      expect(metrics).toContain('-65% czasu deploymentu');
      expect(metrics).toContain('40 000 PLN rocznych oszczędności');
    });
  });

  describe('Generowanie 3 wariantów Elevator Pitch', () => {
    it('generuje wersję 1-liner (~10-15s)', () => {
      const vault = createMockVault();
      const pitch = generateElevatorPitch(vault);

      expect(pitch.oneLiner).toBeDefined();
      expect(pitch.oneLiner.length).toBeGreaterThan(15);
      expect(pitch.estimatedDurationSec.oneLiner).toBeGreaterThan(0);
    });

    it('generuje wersję 30s z imieniem, rolą i kluczową metryką', () => {
      const vault = createMockVault();
      const pitch = generateElevatorPitch(vault);

      expect(pitch.thirtySeconds).toContain('Jan Kowalski');
      expect(pitch.thirtySeconds).toContain('Senior DevOps & Cloud Engineer');
      expect(pitch.thirtySeconds).toContain('Fintech Sp. z o.o.');
      expect(pitch.thirtySeconds).toContain('-65% czasu deploymentu');
      expect(pitch.estimatedDurationSec.thirtySeconds).toBeGreaterThanOrEqual(15);
    });

    it('generuje wersję 90s z pełną narracją i dwiema metrykami', () => {
      const vault = createMockVault();
      const pitch = generateElevatorPitch(vault);

      expect(pitch.ninetySeconds).toContain('Jan Kowalski');
      expect(pitch.ninetySeconds).toContain('-65% czasu deploymentu');
      expect(pitch.ninetySeconds).toContain('40 000 PLN rocznych oszczędności');
      expect(pitch.estimatedDurationSec.ninetySeconds).toBeGreaterThan(30);
    });

    it('obsługuje branże techniczne i inżynieryjne (Reguła 8)', () => {
      const vault = createEmptyVault('Adam Nowak', 'adam@example.com');
      vault.personalInfo = {
        fullName: 'Adam Nowak',
        title: 'Monter Konstrukcji Stalowych / Spawacz TIG',
        summary: 'Doświadczony monter z uprawnieniami TIG i SEP.',
        email: 'adam@example.com',
        phone: '123456789',
        location: 'Gdańsk',
      };
      vault.skillsMatrix = {
        hardSkills: ['Spawanie TIG 141', 'Rysunek techniczny', 'SEP G1'],
        toolsAndTech: ['Szlifierka kątowa', 'Spawarka Kemppi'],
        softSkills: ['Dokładność'],
        certifications: [],
      };

      const pitch = generateElevatorPitch(vault);
      expect(pitch.thirtySeconds).toContain('Monter Konstrukcji Stalowych / Spawacz TIG');
      expect(pitch.thirtySeconds).toContain('Spawanie TIG 141');
    });
  });
});
