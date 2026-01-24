/*
 * Smart Farming ESP32 - HiveMQ Cloud Edition
 * Secure MQTT over TLS/SSL (Port 8883)
 * 
 * Hardware:
 * - Soil Moisture Sensor: GPIO 34 (Analog)
 * - DHT22 Temperature/Humidity: GPIO 4
 * - NPK Sensor: GPIO 35 (Analog - simulated)
 * - Wind Speed Sensor: GPIO 32 (Analog - simulated)
 * - Irrigation LED: GPIO 18
 * - Fertilization LED: GPIO 19
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>  // For TLS/SSL
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ============================================================================
// WiFi Configuration
// ============================================================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ============================================================================
// HiveMQ Cloud Configuration (TLS/SSL)
// ============================================================================
const char* mqtt_server = "e17116d0063a4e08bab15c1ff2a00fcc.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;  // TLS/SSL port
const char* mqtt_user = "farm_user";
const char* mqtt_pass = "Yug@2809";

// MQTT Topics
const char* telemetry_topic = "farm/telemetry";
const char* command_topic = "farm/+/commands";  // Subscribe to all farm commands

// ============================================================================
// Hardware Pin Configuration
// ============================================================================
#define SOIL_MOISTURE_PIN 34
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define NPK_PIN 35
#define WIND_SPEED_PIN 32

// Actuation pins
#define IRRIGATION_LED 18
#define FERTILIZATION_LED 19

// ============================================================================
// Sensor Objects
// ============================================================================
DHT dht(DHT_PIN, DHT_TYPE);
WiFiClientSecure espClient;  // Secure client for TLS
PubSubClient client(espClient);

// ============================================================================
// Global Variables
// ============================================================================
unsigned long lastMsg = 0;
const long interval = 5000;  // Send data every 5 seconds

bool irrigationState = false;
bool fertilizationState = false;

// ============================================================================
// Setup Function
// ============================================================================
void setup() {
  Serial.begin(115200);
  
  // Initialize GPIO pins
  pinMode(IRRIGATION_LED, OUTPUT);
  pinMode(FERTILIZATION_LED, OUTPUT);
  digitalWrite(IRRIGATION_LED, LOW);
  digitalWrite(FERTILIZATION_LED, LOW);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Connect to WiFi
  setup_wifi();
  
  // Configure TLS/SSL (skip certificate verification for simplicity)
  espClient.setInsecure();  // For production, use proper certificates
  
  // Configure MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  Serial.println("✅ ESP32 initialized successfully");
}

// ============================================================================
// WiFi Setup
// ============================================================================
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("🔌 Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("✅ WiFi connected");
  Serial.print("📡 IP address: ");
  Serial.println(WiFi.localIP());
}

// ============================================================================
// MQTT Reconnect
// ============================================================================
void reconnect() {
  while (!client.connected()) {
    Serial.print("🔌 Connecting to HiveMQ Cloud...");
    
    // Create unique client ID
    String clientId = "ESP32-";
    clientId += String(random(0xffff), HEX);
    
    // Attempt to connect with credentials
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println(" ✅ Connected!");
      
      // Subscribe to command topic
      client.subscribe(command_topic);
      Serial.println("📡 Subscribed to: farm/+/commands");
      
    } else {
      Serial.print(" ❌ Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

// ============================================================================
// MQTT Callback (Handle incoming commands)
// ============================================================================
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📨 Message received on topic: ");
  Serial.println(topic);
  
  // Parse JSON payload
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  
  if (error) {
    Serial.print("❌ JSON parse failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Extract command data
  const char* type = doc["type"];
  const char* device = doc["device"];
  int state = doc["state"];
  
  Serial.print("   Type: ");
  Serial.println(type);
  Serial.print("   Device: ");
  Serial.println(device);
  Serial.print("   State: ");
  Serial.println(state);
  
  // Handle ACTUATE commands
  if (strcmp(type, "ACTUATE") == 0) {
    if (strcmp(device, "irrigation") == 0) {
      irrigationState = (state == 1);
      digitalWrite(IRRIGATION_LED, irrigationState ? HIGH : LOW);
      Serial.print("💧 Irrigation: ");
      Serial.println(irrigationState ? "ON" : "OFF");
      
      // Send acknowledgement
      sendStatusAck("irrigation", irrigationState);
      
    } else if (strcmp(device, "fertilization") == 0) {
      fertilizationState = (state == 1);
      digitalWrite(FERTILIZATION_LED, fertilizationState ? HIGH : LOW);
      Serial.print("🌿 Fertilization: ");
      Serial.println(fertilizationState ? "ON" : "OFF");
      
      // Send acknowledgement
      sendStatusAck("fertilization", fertilizationState);
    }
  }
}

// ============================================================================
// Send Status Acknowledgement
// ============================================================================
void sendStatusAck(const char* device, bool state) {
  StaticJsonDocument<128> doc;
  doc["type"] = "STATUS";
  doc["device"] = device;
  doc["state"] = state ? 1 : 0;
  doc["timestamp"] = millis();
  
  char buffer[128];
  serializeJson(doc, buffer);
  
  client.publish(telemetry_topic, buffer);
  Serial.print("✅ ACK sent: ");
  Serial.println(buffer);
}

// ============================================================================
// Read Sensors
// ============================================================================
void readAndPublishSensors() {
  // Read soil moisture (0-4095 -> 0-100%)
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  float moisture = map(soilRaw, 4095, 0, 0, 100);  // Inverted: wet=high, dry=low
  
  // Read DHT22
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Read NPK (simulated)
  int npkRaw = analogRead(NPK_PIN);
  int npk = map(npkRaw, 0, 4095, 0, 1000);
  
  // Read wind speed (simulated)
  int windRaw = analogRead(WIND_SPEED_PIN);
  float windSpeed = map(windRaw, 0, 4095, 0, 50);
  
  // Read EC/Salinity (simulated)
  float ecSalinity = random(0, 40) / 10.0;  // 0.0 - 4.0 dS/m
  
  // Read pH (simulated)
  float soilPh = random(50, 80) / 10.0;  // 5.0 - 8.0
  
  // Check for sensor errors
  if (isnan(temp) || isnan(humidity)) {
    Serial.println("❌ Failed to read from DHT sensor!");
    return;
  }
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["moisture"] = (int)moisture;
  doc["temp"] = temp;
  doc["humidity"] = humidity;
  doc["npk"] = npk;
  doc["wind_speed"] = windSpeed;
  doc["ec_salinity"] = ecSalinity;
  doc["soil_ph"] = soilPh;
  doc["farm_id"] = "farm_001";
  doc["timestamp"] = millis();
  
  // Serialize to string
  char buffer[256];
  serializeJson(doc, buffer);
  
  // Publish to MQTT
  if (client.publish(telemetry_topic, buffer)) {
    Serial.println("📡 Telemetry sent:");
    Serial.print("   Moisture: ");
    Serial.print((int)moisture);
    Serial.println("%");
    Serial.print("   Temp: ");
    Serial.print(temp);
    Serial.println("°C");
    Serial.print("   Humidity: ");
    Serial.print(humidity);
    Serial.println("%");
    Serial.print("   NPK: ");
    Serial.println(npk);
    Serial.print("   Wind: ");
    Serial.print(windSpeed);
    Serial.println(" km/h");
    Serial.print("   pH: ");
    Serial.println(soilPh);
  } else {
    Serial.println("❌ Failed to publish telemetry");
  }
}

// ============================================================================
// Main Loop
// ============================================================================
void loop() {
  // Maintain MQTT connection
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Publish sensor data at regular intervals
  unsigned long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;
    readAndPublishSensors();
  }
}
