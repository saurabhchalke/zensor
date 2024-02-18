# Arduino SRAM PUF Project

This project involves using an Arduino with a DHT11 temperature and humidity sensor to collect environmental data. The Arduino also generates a Physically Unclonable Function (PUF) based on the inherent variations in its SRAM. The data is sent via serial communication and can be logged on a computer using a Python script.

## Setting Up the Arduino

1. Connect the DHT11 sensor to your Arduino:
   - VCC to 5V or 3.3V
   - GND to GND
   - DATA to a digital pin (e.g., pin 7)

2. Use the [`Zensor.ino`](Zensor.ino) file to upload the code to your Arduino. The code for the Arduino is [`shared in the same dir`](zensor.cpp).

3. Run the [`serial logger script`](serial_logger.py) to capture the data on your computer.

- Create a virtual environment for your Python project:

```bash
python3 -m venv venv
```

- Activate the virtual environment:

```bash
source venv/bin/activate
```

- Install the required packages:

```bash
pip install pyserial
```

- Run the script:

```bash
python serial_logger.py
```
