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

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

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
          Math.min(
            90,
            this.sensorData.soilMoisture + (Math.random() - 0.5) * 5,
          ),
        ),
        temperature: this.sensorData.temperature + (Math.random() - 0.5) * 0.5,
        humidity: Math.max(
          40,
          Math.min(85, this.sensorData.humidity + (Math.random() - 0.5) * 3),
        ),
        timestamp: new Date(),
      };
      return this.sensorData;
    }
    
    // Real database call
    try {
      const farmId = localStorage.getItem("current_farm_id");
      if (!farmId || !isUuid(farmId)) {
        // Farm not selected yet; avoid hammering backend with invalid UUIDs
        return { ...mockSensorData, timestamp: new Date() };
      }

      const response = await fetch(`${CONFIG.API_BASE_URL}/sensors/latest?farmId=${farmId}`);
      
      if (!response.ok) {
        console.warn('Failed to fetch sensor data, using mock data');
        return { ...mockSensorData, timestamp: new Date() };
      }
      
      const data = await response.json();
      
      // If no sensor data in database, use mock data
      if (!data.sensorData) {
        console.warn('No sensor data in database, using mock data');
        return { ...mockSensorData, timestamp: new Date() };
      }
      
      return {
        soilMoisture: data.sensorData.soil_moisture,
        temperature: data.sensorData.temperature,
        humidity: data.sensorData.humidity ?? mockSensorData.humidity,
        npk: {
          nitrogen: data.sensorData.nitrogen,
          phosphorus: data.sensorData.phosphorus,
          potassium: data.sensorData.potassium,
        },
        pH: data.sensorData.ph,
        ec: data.sensorData.ec ?? mockSensorData.ec,
        timestamp: new Date(data.sensorData.timestamp),
      };
    } catch (error) {
      console.error('Failed to fetch sensor data from database:', error);
      // Fallback to mock data on error
      return { ...mockSensorData, timestamp: new Date() };
    }
  }

  async getSystemStatus(): Promise<SystemStatus> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      return mockSystemStatus;
    }
    
    const farmId = localStorage.getItem("current_farm_id");
    if (!farmId || !isUuid(farmId)) {
      return mockSystemStatus;
    }
    const response = await fetch(`${CONFIG.API_BASE_URL}/sensors/system-status?farmId=${farmId}`);
    if (!response.ok) throw new Error("Failed to fetch system status");
    const data = await response.json();
    return data.systemStatus;
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
    
    const farmId = localStorage.getItem("current_farm_id");
    if (!farmId || !isUuid(farmId)) {
      throw new Error("No farm selected");
    }
    const response = await fetch(`${CONFIG.API_BASE_URL}/sensors/actions/water-pump`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ farmId }),
    });
    if (!response.ok) throw new Error("Failed to trigger water pump");
    const data = await response.json();
    return data.success;
  }

  async triggerFertilizer(): Promise<boolean> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      return true;
    }
    
    const farmId = localStorage.getItem("current_farm_id");
    if (!farmId || !isUuid(farmId)) {
      throw new Error("No farm selected");
    }
    const response = await fetch(`${CONFIG.API_BASE_URL}/sensors/actions/fertilizer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ farmId }),
    });
    if (!response.ok) throw new Error("Failed to trigger fertilizer");
    const data = await response.json();
    return data.success;
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, CONFIG.SIMULATION_DELAY),
    );
  }
}

export const SensorService = new SensorServiceClass();
