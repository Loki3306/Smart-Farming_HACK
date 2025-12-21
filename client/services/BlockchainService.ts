import CONFIG from "../config";

export interface BlockchainRecord {
  id: string;
  timestamp: Date;
  actionType:
    | "irrigation"
    | "fertilization"
    | "sensor_reading"
    | "system_status"
    | "autonomous_action";
  quantity?: number;
  unit?: string;
  transactionHash: string;
  blockNumber: number;
  verified: boolean;
  details: string;
}

const mockRecords: BlockchainRecord[] = [
  {
    id: "rec_001",
    timestamp: new Date(Date.now() - 3600000),
    actionType: "irrigation",
    quantity: 15,
    unit: "liters",
    transactionHash:
      "0x7a8c9f2b3e4d5a6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z",
    blockNumber: 18245721,
    verified: true,
    details: "Automated irrigation cycle triggered due to low soil moisture",
  },
  {
    id: "rec_002",
    timestamp: new Date(Date.now() - 7200000),
    actionType: "fertilization",
    quantity: 2.5,
    unit: "kg",
    transactionHash:
      "0x6z7y8x9w0v1u2t3s4r5q6p7o8n9m0l1k2j3i4h5g6f7e8d9c0b1a2z3y4x",
    blockNumber: 18245690,
    verified: true,
    details: "NPK fertilizer application - Phosphorus boost",
  },
  {
    id: "rec_003",
    timestamp: new Date(Date.now() - 10800000),
    actionType: "sensor_reading",
    transactionHash:
      "0x5y6x7w8v9u0t1s2r3q4p5o6n7m8l9k0j1i2h3g4f5e6d7c8b9a0z1y2x3w",
    blockNumber: 18245660,
    verified: true,
    details: "Environmental sensor data recorded - pH 6.8, EC 1.2",
  },
  {
    id: "rec_004",
    timestamp: new Date(Date.now() - 14400000),
    actionType: "autonomous_action",
    transactionHash:
      "0x4x5w6v7u8t9s0r1q2p3o4n5m6l7k8j9i0h1g2f3e4d5c6b7a8z9y0x1w2v",
    blockNumber: 18245630,
    verified: true,
    details: "AI decision: Irrigation skipped - rain forecast 65%",
  },
  {
    id: "rec_005",
    timestamp: new Date(Date.now() - 18000000),
    actionType: "system_status",
    transactionHash:
      "0x3w4v5u6t7s8r9q0p1o2n3m4l5k6j7i8h9g0f1e2d3c4b5a6z7y8x9w0v1u",
    blockNumber: 18245600,
    verified: true,
    details: "System health check passed - all sensors operational",
  },
];

class BlockchainServiceClass {
  async getAuditTrail(): Promise<BlockchainRecord[]> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      return mockRecords;
    }
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/blockchain/audit-trail`,
    );
    if (!response.ok) throw new Error("Failed to fetch audit trail");
    return response.json();
  }

  async getRecordByHash(transactionHash: string): Promise<BlockchainRecord> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      const record = mockRecords.find(
        (r) => r.transactionHash === transactionHash,
      );
      if (!record) throw new Error("Record not found");
      return record;
    }
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/blockchain/record/${transactionHash}`,
    );
    if (!response.ok) throw new Error("Failed to fetch record");
    return response.json();
  }

  async logAction(
    actionType: BlockchainRecord["actionType"],
    details: string,
    quantity?: number,
    unit?: string,
  ): Promise<BlockchainRecord> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      const newRecord: BlockchainRecord = {
        id: `rec_${Date.now()}`,
        timestamp: new Date(),
        actionType,
        quantity,
        unit,
        transactionHash: this.generateMockHash(),
        blockNumber: 18245721 + Math.floor(Math.random() * 100),
        verified: true,
        details,
      };
      mockRecords.unshift(newRecord);
      return newRecord;
    }
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/blockchain/log-action`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType,
          details,
          quantity,
          unit,
        }),
      },
    );
    if (!response.ok) throw new Error("Failed to log action");
    return response.json();
  }

  async verifyRecord(transactionHash: string): Promise<boolean> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      return true;
    }
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/blockchain/verify/${transactionHash}`,
    );
    if (!response.ok) throw new Error("Failed to verify record");
    const data = await response.json();
    return data.verified;
  }

  private generateMockHash(): string {
    const chars = "0123456789abcdef";
    let hash = "0x";
    for (let i = 0; i < 64; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, CONFIG.SIMULATION_DELAY),
    );
  }
}

export const BlockchainService = new BlockchainServiceClass();
