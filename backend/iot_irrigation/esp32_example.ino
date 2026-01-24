/*
 * ESP32 Smart Farming Sensor Node
 * Reads sensors and publishes to MQTT broker
 * 
 * Hardware:
 * - Soil Moisture Sensor (GPIO 34)
 * - DHT11 Temperature & Humidity (GPIO 4)
 * - NPK/Potentiometer (GPIO 35)
 * 
 * MQTT Topics:
 * - Publish: farm/telemetry (sensor data)
 * - Subscribe: farm/commands (irrigation commands)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Configuration
const char* mqtt_server = "YOUR_MQTT_BROKER_IP";  // e.g., "192.168.1.100" or "broker.hivemq.com"
const int mqtt_port = 1883;
const char* mqtt_user = "";  // Optional
const char* mqtt_password = "";  // Optional
const char* mqtt_client_id = "ESP32_Farm_Sensor";

// MQTT Topics
const char* telemetry_topic = "farm/telemetry";
const char* command_topic = "farm/commands";

// Sensor Pins
#define SOIL_MOISTURE_PIN 34  // Analog pin for soil moisture
#define DHT_PIN 4             // DHT11 data pin
#define NPK_PIN 35            // Analog pin for NPK/Potentiometer
#define WATER_PUMP_PIN 2      // Digital pin for water pump relay

// DHT Sensor
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// WiFi and MQTT clients
WiFiClient espClient;
PubSubClient client(espClient);

// Farm ID (unique identifier for this device)
const char* farm_id = "farm_001";

// Timing
unsigned long lastPublish = 0;
const long publishInterval = 5000;  // Publish every 5 seconds

void setup() {
  Serial.begin(115200);
  
  // Initialize sensors
  dht.begin();
  
  // Initialize water pump pin
  pinMode(WATER_PUMP_PIN, OUTPUT);
  digitalWrite(WATER_PUMP_PIN, LOW);
  
  // Connect to WiFi
  setup_wifi();
  
  // Configure MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqtt_callback);
  
  Serial.println("ESP32 Smart Farming Sensor Node Ready!");
}

void loop() {
  // Maintain MQTT connection
  if (!client.connected()) {
    reconnect_mqtt();
  }
  client.loop();
  
  // Publish sensor data at interval
  unsigned long now = millis();
  if (now - lastPublish >= publishInterval) {
    lastPublish = now;
    publish_sensor_data();
  }
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect_mqtt() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT broker...");
    
    if (client.connect(mqtt_client_id, mqtt_user, mqtt_password)) {
      Serial.println("connected!");
      
      // Subscribe to command topic
      client.subscribe(command_topic);
      Serial.print("Subscribed to: ");
      Serial.println(command_topic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds...");
      delay(5000);
    }
  }
}

void publish_sensor_data() {
  // Read sensors
  float moisture = read_soil_moisture();
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  int npk = analogRead(NPK_PIN);
  
  // Check if DHT reading failed
  if (isnan(temp) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    temp = 0;
    humidity = 0;
  }
  
  // Create JSON document
  StaticJsonDocument<256> doc;
  doc["moisture"] = moisture;
  doc["temp"] = temp;
  doc["humidity"] = humidity;
  doc["npk"] = npk;
  doc["farm_id"] = farm_id;
  
  // Add timestamp (optional, backend will add if missing)
  // doc["timestamp"] = "2026-01-24T00:41:31Z";
  
  // Serialize to string
  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);
  
  // Publish to MQTT
  if (client.publish(telemetry_topic, jsonBuffer)) {
    Serial.println("Published sensor data:");
    Serial.println(jsonBuffer);
  } else {
    Serial.println("Failed to publish sensor data");
  }
}

float read_soil_moisture() {
  // Read analog value (0-4095 for ESP32)
  int rawValue = analogRead(SOIL_MOISTURE_PIN);
  
  // Convert to percentage (0-100%)
  // Calibration: Adjust these values based on your sensor
  // Dry soil: ~3000, Wet soil: ~1000
  float moisture = map(rawValue, 3000, 1000, 0, 100);
  moisture = constrain(moisture, 0, 100);
  
  return moisture;
}

void mqtt_callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on topic: ");
  Serial.println(topic);
  
  // Parse JSON payload
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  
  if (error) {
    Serial.print("JSON parsing failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Extract command
  const char* command = doc["command"];
  const char* received_farm_id = doc["farm_id"];
  
  // Check if command is for this farm
  if (strcmp(received_farm_id, farm_id) != 0) {
    Serial.println("Command not for this farm, ignoring");
    return;
  }
  
  Serial.print("Command: ");
  Serial.println(command);
  
  // Execute command
  if (strcmp(command, "WATER_ON") == 0) {
    activate_water_pump(true);
  } else if (strcmp(command, "WATER_OFF") == 0) {
    activate_water_pump(false);
  } else {
    Serial.println("Unknown command");
  }
}

void activate_water_pump(bool state) {
  digitalWrite(WATER_PUMP_PIN, state ? HIGH : LOW);
  
  if (state) {
    Serial.println("💧 Water pump ACTIVATED");
  } else {
    Serial.println("🛑 Water pump DEACTIVATED");
  }
}
