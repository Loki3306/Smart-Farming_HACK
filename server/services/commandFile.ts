import * as fs from 'fs';
import * as path from 'path';

export type SensorCommandType = 'water_pump' | 'fertilizer';

const COMMAND_FILE = path.join(process.cwd(), 'sensor_commands.json');
let commandIdCounter = Date.now();

export function writeSensorCommand(type: SensorCommandType, farmId: string) {
  try {
    let commands: any[] = [];

    // Read existing commands
    if (fs.existsSync(COMMAND_FILE)) {
      try {
        const data = fs.readFileSync(COMMAND_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        commands = parsed.commands || [];
      } catch {
        commands = [];
      }
    }

    // Add new command
    commandIdCounter++;
    commands.push({
      id: commandIdCounter,
      type,
      farmId,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 10 commands
    if (commands.length > 10) {
      commands = commands.slice(-10);
    }

    fs.writeFileSync(COMMAND_FILE, JSON.stringify({ commands }, null, 2));
    console.log(`[Sensors] Command written: ${type} for farm ${farmId}`);
  } catch (error) {
    console.error('[Sensors] Error writing command file:', error);
  }
}
