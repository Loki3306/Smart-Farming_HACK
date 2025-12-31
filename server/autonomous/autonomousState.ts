import * as fs from 'fs';
import * as path from 'path';

export type FarmAutomationState = {
  isAutonomous: boolean;
  lastRunAt?: string; // ISO
  lastIrrigationAt?: string; // ISO
  lastFertilizerAt?: string; // ISO
};

export type AutomationStateFile = Record<string, FarmAutomationState>;

const STATE_FILE = path.join(process.cwd(), 'autonomous_state.json');

function safeParseJson(text: string): unknown {
  // tolerate UTF-8 BOM
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  return JSON.parse(text);
}

export class AutonomousStateStore {
  constructor(private readonly filePath: string = STATE_FILE) {}

  private readAll(): AutomationStateFile {
    if (!fs.existsSync(this.filePath)) return {};
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = safeParseJson(raw);
      return (parsed && typeof parsed === 'object') ? (parsed as AutomationStateFile) : {};
    } catch {
      return {};
    }
  }

  private writeAll(data: AutomationStateFile) {
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, this.filePath);
  }

  getFarmState(farmId: string): FarmAutomationState {
    const all = this.readAll();
    const state = all[farmId];
    if (state && typeof state.isAutonomous === 'boolean') return state;
    return { isAutonomous: true };
  }

  setFarmState(farmId: string, patch: Partial<FarmAutomationState>) {
    const all = this.readAll();
    const existing = all[farmId];
    const base: FarmAutomationState = (existing && typeof existing.isAutonomous === 'boolean')
      ? existing
      : { isAutonomous: true };

    all[farmId] = {
      ...base,
      ...patch,
      isAutonomous: typeof patch.isAutonomous === 'boolean' ? patch.isAutonomous : base.isAutonomous,
    };

    this.writeAll(all);
  }
}

export const autonomousStateStore = new AutonomousStateStore();
