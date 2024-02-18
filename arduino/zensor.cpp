// Saurabh Chalke <saurabh [at] chalke [dot] xyz>
#include <SimpleDHT.h>

#define SRAM_SIZE 2048  // Adjust this based on the available SRAM
#define PUF_LENGTH 256  // Length of the PUF in bits
#define PUF_START_ADDR 256  // Starting address for the PUF in SRAM

// for DHT11, 
//      VCC: 5V or 3V
//      GND: GND
//      DATA: 2
int pinDHT11 = 7;
SimpleDHT11 dht11;

// Define pins for the LED and buzzer
int redLedPin = 3; // Red LED connected to pin 3
int greenLedPin = 2; // Green LED connected to pin 2
int buzzerPin = 4; // Buzzer connected to pin 4

unsigned long previousMillis = 0; // Stores the last time the buzzer was activated
const long interval = 10000; // Interval at which to activate the buzzer (30 seconds)

void setup() {
  Serial.begin(9600);
  pinMode(redLedPin, OUTPUT);
  pinMode(greenLedPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
}

void loop() {
  generateAndPrintPUF();
  
  // start working...
  Serial.println("=================================");
  Serial.print("Timestamp: ");
  Serial.print(millis());
  Serial.println(" ms");
  
  // read with raw sample data.
  byte temperature = 0;
  byte humidity = 0;
  byte data[40] = {0};
  if (dht11.read(pinDHT11, &temperature, &humidity, data)) {
    Serial.print("Read DHT11 failed");
    return;
  }
  
  Serial.print("RAW DHT11 Sensor Data: ");
  for (int i = 0; i < 40; i++) {
    Serial.print(data[i], BIN);
    if (i % 8 == 7) { // Add a space every 8 bits
      Serial.print(' ');
    }
  }
  Serial.println();
  
  // Serial.print("Sample OK: ");
  Serial.print("Temperature: ");Serial.print((int)temperature); Serial.print(" Celsius");
  Serial.print("\n");
  Serial.print("Humidity: ");Serial.print((int)humidity); Serial.println("%");

  // Control the LED based on the temperature
  if (temperature > 30) {
    digitalWrite(redLedPin, HIGH);
    digitalWrite(greenLedPin, LOW);
    // Check if it's time to activate the buzzer
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillis >= interval) {
      // Save the last time the buzzer was activated
      previousMillis = currentMillis;
      // Activate the buzzer for 1 second
      digitalWrite(buzzerPin, HIGH);
      delay(1000);
      digitalWrite(buzzerPin, LOW);
    }
  } else {
    digitalWrite(redLedPin, LOW);
    digitalWrite(greenLedPin, HIGH);
    digitalWrite(buzzerPin, LOW);
  }
  
  // DHT11 sampling rate is 1HZ.
  delay(1000);
}

void generateAndPrintPUF() {
  uint8_t puf[PUF_LENGTH / 8] = {0};  // Array to store the PUF

  // Generate the PUF by reading from a fixed set of SRAM addresses
  for (int i = 0; i < PUF_LENGTH; i++) {
    int sramIndex = PUF_START_ADDR + i;  // Use consecutive SRAM addresses
    if (sramIndex >= SRAM_SIZE) {
      // Wrap around if we reach the end of SRAM
      sramIndex -= SRAM_SIZE;
    }

    uint8_t sramValue = *((uint8_t*)sramIndex);  // Read the SRAM value

    // Use the least significant bit (LSB) of the SRAM value as the PUF bit
    int bit = sramValue & 1;
    puf[i / 8] |= (bit << (i % 8));
  }

  Serial.print("PUF: ");

  // Print the PUF in hexadecimal format
  for (int i = 0; i < PUF_LENGTH / 8; i++) {
    if (puf[i] < 0x10) {
      Serial.print("0");
    }
    Serial.print(puf[i], HEX);
  }
  Serial.println();
}
