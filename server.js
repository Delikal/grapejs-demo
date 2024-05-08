const express = require("express");
// const https = require("https");
const http = require("http");
const socketIo = require("socket.io");
// const fs = require("fs");

const app = express();

// const server = https.createServer(
//   {
//     key: fs.readFileSync("server.key"),
//     cert: fs.readFileSync("server.crt"),
//   },
//   app
// );

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*", // Umožní přístup z jakéhokoli zdroje
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
