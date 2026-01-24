/**
 * IoT Service - WebSocket client for real-time sensor data
 * Connects to FastAPI WebSocket endpoint for live telemetry
 */

import CONFIG from "../config";

export interface LiveSensorData {
    moisture: number;
    temp: number;
    humidity: number;
    npk: number;
    timestamp: string;
    farm_id: string;
}

export interface SystemStatus {
    isOnline: boolean;
    lastUpdate: Date;
}

type MessageCallback = (data: LiveSensorData) => void;
type StatusCallback = (status: SystemStatus) => void;
type IrrigationCallback = (event: { reason: string; timestamp: string }) => void;

class IoTServiceClass {
    private ws: WebSocket | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 3000; // 3 seconds

    private messageCallbacks: Set<MessageCallback> = new Set();
    private statusCallbacks: Set<StatusCallback> = new Set();
    private irrigationCallbacks: Set<IrrigationCallback> = new Set();

    private currentStatus: SystemStatus = {
        isOnline: false,
        lastUpdate: new Date(),
    };

    /**
     * Connect to WebSocket for real-time sensor data
     */
    connect(farmId: string) {
        // Close existing connection
        this.disconnect();

        // Get WebSocket URL
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = window.location.hostname;
        const wsPort = window.location.port || (wsProtocol === "wss:" ? "443" : "80");

        // Production-ready WebSocket URL construction
        // Uses relative path by default to work behind Nginx/Reverse Proxy, or VITE_API_URL if set
        const apiBase = import.meta.env.VITE_API_URL || "";
        console.log(`[IoTService] Configured API Base: ${apiBase || "None (Using current host)"}`);

        const wsUrl = apiBase
            ? `${apiBase.replace(/^http/, 'ws')}/iot/ws/telemetry/${farmId}`
            : `${wsProtocol}//${wsHost}:${wsPort}/iot/ws/telemetry/${farmId}`;

        console.log(`[IoTService] Connecting to WebSocket: ${wsUrl}`);

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log("[IoTService] ✅ WebSocket connected");
                this.reconnectAttempts = 0;
                this.updateStatus(true);

                // Start heartbeat
                this.startHeartbeat();
            };

            this.ws.onmessage = (event) => {
                // Debug raw message
                // console.log("[IoTService] 📥 Raw WS Payload:", event.data);

                try {
                    // Handle non-JSON messages (like "pong")
                    if (typeof event.data === 'string' && event.data === 'pong') {
                        console.log('[IoTService] 💓 Heartbeat acknowledged (pong)');
                        return;
                    }

                    const message = JSON.parse(event.data);
                    console.log("[IoTService] 📨 Message received:", message);

                    if (message.type === "sensor_update" || message.type === "initial_data") {
                        const sensorData: LiveSensorData = message.data;

                        // ========== TESTING: PRINT RECEIVED SENSOR VALUES ==========
                        console.log("\n" + "=".repeat(70));
                        console.log("🎯 FRONTEND RECEIVED SENSOR DATA");
                        console.log("=".repeat(70));
                        console.log("📍 Farm ID:       ", sensorData.farm_id);
                        console.log("💧 Moisture:      ", sensorData.moisture + "%");
                        console.log("🌡️  Temperature:   ", sensorData.temp + "°C");
                        console.log("💨 Humidity:      ", sensorData.humidity + "%");
                        console.log("🟢 NPK:           ", sensorData.npk);
                        console.log("⏰ Timestamp:     ", sensorData.timestamp);
                        console.log("=".repeat(70) + "\n");
                        // ===========================================================

                        this.notifyMessageCallbacks(sensorData);
                        this.updateStatus(true);

                        // Dispatch generic event for decoupled components (Precision Agriculture)
                        window.dispatchEvent(new CustomEvent('iot-data', { detail: message }));
                    } else if (message.type === "irrigation_triggered") {
                        this.notifyIrrigationCallbacks({
                            reason: message.reason,
                            timestamp: message.timestamp,
                        });
                    } else if (message.type === "agronomy_analysis" || message.type === "AI_DECISION") {
                        // Dispatch custom event for Precision Agriculture dashboard (AI Insights)
                        window.dispatchEvent(new CustomEvent('iot-data', { detail: message }));
                        console.log(`[IoTService] 🧠 AI Insight: ${message.type}`);
                    } else if (message.type === "leaching_triggered" || message.type === "wind_safety_alert") {
                        // Dispatch alerts
                        window.dispatchEvent(new CustomEvent('iot-data', { detail: message }));
                        console.log(`[IoTService] ⚠️ Alert: ${message.type}`);
                    } else if (message.type === "notification") {
                        // Generic notification handling (Toast/Alert)
                        window.dispatchEvent(new CustomEvent('iot-notification', { detail: message }));
                        console.log(`[IoTService] 🔔 Notification: ${message.message}`);
                    }
                } catch (error) {
                    console.error("[IoTService] Error parsing message:", error);
                }
            };

            this.ws.onerror = (error) => {
                console.error("[IoTService] ❌ WebSocket error:", error);
                this.updateStatus(false);
            };

            this.ws.onclose = () => {
                console.log("[IoTService] 🔌 WebSocket closed");
                this.updateStatus(false);
                this.attemptReconnect(farmId);
            };
        } catch (error) {
            console.error("[IoTService] Failed to create WebSocket:", error);
            this.updateStatus(false);
        }
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.updateStatus(false);
    }

    /**
     * Auto-reconnect logic
     */
    private attemptReconnect(farmId: string) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("[IoTService] Max reconnect attempts reached");
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        console.log(
            `[IoTService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );

        this.reconnectTimeout = setTimeout(() => {
            this.connect(farmId);
        }, delay);
    }

    /**
     * Send heartbeat ping to keep connection alive
     */
    private startHeartbeat() {
        const heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send("ping");
            } else {
                clearInterval(heartbeatInterval);
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Update system status
     */
    private updateStatus(isOnline: boolean) {
        this.currentStatus = {
            isOnline,
            lastUpdate: new Date(),
        };
        this.notifyStatusCallbacks(this.currentStatus);
    }

    /**
     * Subscribe to sensor data updates
     */
    onMessage(callback: MessageCallback) {
        this.messageCallbacks.add(callback);
        return () => this.messageCallbacks.delete(callback);
    }

    /**
     * Subscribe to system status updates
     */
    onStatusChange(callback: StatusCallback) {
        this.statusCallbacks.add(callback);
        // Immediately notify with current status
        callback(this.currentStatus);
        return () => this.statusCallbacks.delete(callback);
    }

    /**
     * Subscribe to irrigation events
     */
    onIrrigationEvent(callback: IrrigationCallback) {
        this.irrigationCallbacks.add(callback);
        return () => this.irrigationCallbacks.delete(callback);
    }

    /**
     * Notify all message callbacks
     */
    private notifyMessageCallbacks(data: LiveSensorData) {
        this.messageCallbacks.forEach((callback) => {
            try {
                callback(data);
            } catch (error) {
                console.error("[IoTService] Error in message callback:", error);
            }
        });
    }

    /**
     * Notify all status callbacks
     */
    private notifyStatusCallbacks(status: SystemStatus) {
        this.statusCallbacks.forEach((callback) => {
            try {
                callback(status);
            } catch (error) {
                console.error("[IoTService] Error in status callback:", error);
            }
        });
    }

    /**
     * Notify all irrigation callbacks
     */
    private notifyIrrigationCallbacks(event: { reason: string; timestamp: string }) {
        this.irrigationCallbacks.forEach((callback) => {
            try {
                callback(event);
            } catch (error) {
                console.error("[IoTService] Error in irrigation callback:", error);
            }
        });
    }

    /**
     * Get current connection status
     */
    getStatus(): SystemStatus {
        return this.currentStatus;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}

export const IoTService = new IoTServiceClass();
