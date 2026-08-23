import liveHudPrompt from './prompts/live-hud.prompt';

export interface AntigravitySkill {
  id: string;
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  ui: string;
  activation: {
    hotkey: string;
    events: string[];
    clickAction: string;
  };
  permissions: readonly string[];
  systemPrompt: string;
}

export interface SkillRegistry {
  registerSkill: (skill: AntigravitySkill) => void;
  getSkill: (id: string) => AntigravitySkill | undefined;
  listSkills: () => AntigravitySkill[];
  activateSkill: (skillId: string) => void;
  getActiveSkills: () => string[];
  bindShortcut: (shortcut: string, handler: () => void) => () => void;
  listen: (event: string, handler: (...args: unknown[]) => void) => () => void;
  emit: (event: string, ...args: unknown[]) => void;
  invokeSkill: (skillId: string, payload?: unknown) => unknown;
  activateOnRoute: (routePattern: string) => void;
  createSkillFromPrompt: (promptConfig: SkillPromptConfig) => Promise<AntigravitySkill>;
}

export interface SkillPromptConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  dependencies?: readonly string[] | string[];
  ui?: string;
  activation?: {
    hotkey?: string;
    events?: readonly string[] | string[];
    clickAction?: string;
  };
  permissions?: readonly string[] | string[];
  systemPrompt: string;
  [key: string]: unknown;
}

/**
 * Fabryka umiejętności na wzór @antigravity/skill-factory
 */
export function createSkillFromPrompt(promptConfig: SkillPromptConfig): AntigravitySkill {
  return {
    id: promptConfig.id,
    name: promptConfig.name,
    version: promptConfig.version,
    description: promptConfig.description,
    dependencies: promptConfig.dependencies ? [...promptConfig.dependencies] : [],
    ui: promptConfig.ui || 'DefaultPanel',
    activation: {
      hotkey: promptConfig.activation?.hotkey || '',
      events: promptConfig.activation?.events ? [...promptConfig.activation.events] : [],
      clickAction: promptConfig.activation?.clickAction || '',
    },
    permissions: promptConfig.permissions ? [...promptConfig.permissions] : [],
    systemPrompt: promptConfig.systemPrompt,
  };
}

export class AntigravityRuntime implements SkillRegistry {
  private skills = new Map<string, AntigravitySkill>();
  private activeSkills = new Set<string>();
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  private shortcuts = new Map<string, () => void>();

  async createSkillFromPrompt(promptConfig: SkillPromptConfig): Promise<AntigravitySkill> {
    return createSkillFromPrompt(promptConfig);
  }

  registerSkill(skill: AntigravitySkill): void {
    this.skills.set(skill.id, skill);
  }

  activateSkill(skillId: string): void {
    this.activeSkills.add(skillId);
    this.emit('skill-activated', skillId);
  }

  getActiveSkills(): string[] {
    return Array.from(this.activeSkills);
  }

  getSkill(id: string): AntigravitySkill | undefined {
    return this.skills.get(id);
  }

  listSkills(): AntigravitySkill[] {
    return Array.from(this.skills.values());
  }

  bindShortcut(shortcut: string, handler: () => void): () => void {
    this.shortcuts.set(shortcut.toLowerCase(), handler);
    return () => this.shortcuts.delete(shortcut.toLowerCase());
  }

  listen(event: string, handler: (...args: unknown[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  emit(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(...args);
        } catch {
          // ignore
        }
      });
    }
  }

  invokeSkill(skillId: string, payload?: unknown): unknown {
    const skill = this.skills.get(skillId);
    if (!skill) return undefined;
    this.emit(`skill-invoked:${skillId}`, payload);
    return { skill, payload, executedAt: new Date().toISOString() };
  }

  activateOnRoute(routePattern: string): void {
    this.emit('route-activated', routePattern);
  }
}

export const ag: SkillRegistry = new AntigravityRuntime();

// Rejestracja skilla Live HUD Teleprompter (live-hud-v1)
export const liveHudSkill = createSkillFromPrompt(liveHudPrompt);
ag.registerSkill(liveHudSkill);
