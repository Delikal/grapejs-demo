const express = require("express");
const mqtt = require("mqtt");
const https = require("https");
const socketIo = require("socket.io");
const fs = require("fs");

const app = express();

const server = https.createServer(
  {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.crt"),
  },
  app
);

// MQTT Broker konfigurace
const MQTT_BROKER_URL = "mqtt://mqtt-broker:8883"; // Nahradit skutečnou URL vašeho MQTT brokera
const movement_topic = "manualmovementcontrol/motors"; // Příklad tématu pro publikování/odběr
const down_lights_topic = "manualmovementcontrol/downlights";
const enable_motor = "manualmovementcontrol/enablemotor";
const enable_scanner = "manualmovementcontrol/enablescanner";
const speed = "manualmovementcontrol/enablespeed";
const battery_capacity = "batteryrobot/capacitystatus";

const button_foceni = "foceni";
const button_etl = "etl";

// BOOLEANS
let allow_control = false;

// Připojení k MQTT Brokeru
const mqttClient = mqtt.connect(MQTT_BROKER_URL);

const io = socketIo(server, {
  cors: {
    origin: "*", // Umožní přístup z jakéhokoli zdroje
    methods: ["GET", "POST"],
  },
});

mqttClient.on("connect", () => {
  console.log("MQTT klient připojen");
  mqttClient.subscribe(battery_capacity, (err) => {
    if (!err) {
      console.log(`Subscribed to topic '${battery_capacity}'`);
    } else {
      console.error(`Failed to subscribe to topic '${battery_capacity}':`, err);
    }
  });
  mqttClient.on("message", (topic, message) => {
    if (topic === battery_capacity) {
      // Odesílání zprávy všem připojeným klientům přes Socket.IO
      io.emit("batteryStatus", message.toString());
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("deviceOrientationSupport", (data) => {
    if (data.supported) {
      console.log("The device supports deviceorientation events");
    } else {
      console.log("The device does not support deviceorientation events");
    }
  });

  socket.on("deviceOrientation", (data) => {
    //console.log("Received device orientation:", data);
    if (allow_control === true) {
      // Zde můžete odeslat data do robota
      mqttClient.publish(movement_topic, JSON.stringify(data));
    }
  });

  socket.on("buttonMovement", (data) => {
    allow_control = !allow_control;
    if (allow_control === false) {
      const reset_data = {
        levymotor: 0,
        pravymotor: 0,
      };
      mqttClient.publish(movement_topic, JSON.stringify(reset_data));
    }
  });

  socket.on("buttonMotor", (data) => {
    mqttClient.publish(enable_motor, JSON.stringify(data));
  });

  socket.on("buttonLights", (data) => {
    mqttClient.publish(down_lights_topic, JSON.stringify(data));
  });

  socket.on("buttonScanner", (data) => {
    mqttClient.publish(enable_scanner, JSON.stringify(data));
  });

  socket.on("buttonSpeed", (data) => {
    mqttClient.publish(speed, JSON.stringify(data));
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  socket.on("button-foceni", (data) => {
    mqttClient.publish(button_foceni, JSON.stringify(data));
  });

  socket.on("button-etl", (data) => {
    mqttClient.publish(button_etl, JSON.stringify(data));
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});