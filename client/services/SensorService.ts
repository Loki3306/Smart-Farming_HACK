import CONFIG from "../config";

export interface SensorData {
  soilMoisture: number;
  temperature: number;
  humidity: number;
  npk: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  pH: number;
  ec: number;
  timestamp: Date;
}

export interface SystemStatus {
  isOnline: boolean;
  isAutonomous: boolean;
  location: string;
  lastUpdate: Date;
}

const mockSensorData: SensorData = {
  soilMoisture: 62,
  temperature: 24.5,
  humidity: 68,
  npk: {
    nitrogen: 145,
    phosphorus: 38,
    potassium: 82,
  },
  pH: 6.8,
  ec: 1.2,
  timestamp: new Date(),
};

const mockSystemStatus: SystemStatus = {
  isOnline: true,
  isAutonomous: true,
  location: "Mendocino Valley Farm, CA",
  lastUpdate: new Date(),
};

class SensorServiceClass {
  private sensorData = { ...mockSensorData };

  async getSensorData(): Promise<SensorData> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      // Simulate live data variations
      this.sensorData = {
        ...this.sensorData,
        soilMoisture: Math.max(
          30,
          Math.min(90, this.sensorData.soilMoisture + (Math.random() - 0.5) * 5)
        ),
        temperature: this.sensorData.temperature + (Math.random() - 0.5) * 0.5,
        humidity: Math.max(
          40,
          Math.min(85, this.sensorData.humidity + (Math.random() - 0.5) * 3)
        ),
        timestamp: new Date(),
      };
      return this.sensorData;
    }
    const response = await fetch(`${CONFIG.API_BASE_URL}/sensors`);
    if (!response.ok) throw new Error("Failed to fetch sensor data");
    return response.json();
  }

  async getSystemStatus(): Promise<SystemStatus> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      return mockSystemStatus;
    }
    const response = await fetch(`${CONFIG.API_BASE_URL}/system/status`);
    if (!response.ok) throw new Error("Failed to fetch system status");
    return response.json();
  }

  async setAutonomous(enabled: boolean): Promise<void> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      mockSystemStatus.isAutonomous = enabled;
      return;
    }
    const response = await fetch(`${CONFIG.API_BASE_URL}/system/autonomous`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) throw new Error("Failed to set autonomous mode");
  }

  async triggerWaterPump(): Promise<boolean> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      return true;
    }
    const response = await fetch(`${CONFIG.API_BASE_URL}/actions/water-pump`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to trigger water pump");
    return response.json();
  }

  async triggerFertilizer(): Promise<boolean> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      return true;
    }
    const response = await fetch(`${CONFIG.API_BASE_URL}/actions/fertilizer`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to trigger fertilizer");
    return response.json();
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, CONFIG.SIMULATION_DELAY)
    );
  }
}

export const SensorService = new SensorServiceClass();
