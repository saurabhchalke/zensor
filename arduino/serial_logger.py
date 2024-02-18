import serial
import time

# Set up the serial connection (adjust the port and baud rate according to your setup)
ser = serial.Serial('/dev/cu.usbserial-110', 9600)  # Change '/dev/cu.usbserial-110' to your Arduino's serial port

# Open a file for logging
with open('data_log.txt', 'a') as file:
    while True:
        try:
            # Read a line from the serial port
            line = ser.readline().decode('utf-8').rstrip()
            # Write the line to the file
            file.write(line + '\n')
            file.flush()  # Ensure data is written to the file
            # Print the line to the console (optional)
            print(line)
        except KeyboardInterrupt:
            # Gracefully exit the script on a keyboard interrupt
            print("Exiting...")
            break
        except Exception as e:
            # Handle other exceptions
            print(f"Error: {e}")

# Close the serial connection
ser.close()
