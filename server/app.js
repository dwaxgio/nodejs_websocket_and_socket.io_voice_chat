const express = require("express");
const path = require("path");
const app = express();
const http = require("http");
const server = http.createServer(app);
const handlebars = require("express-handlebars");

const hostname = "127.0.0.1";
const port = 4000;

// TO HODLING USERS INFORMATION
const socketsStatus = {};

// CONFIG AND SET HANDLEBARS TO EXPRESS
const customHandlebars = handlebars.create({ layoutsDir: "../client/pages" });

app.engine("handlebars", customHandlebars.engine);
app.set("view engine", "handlebars");

//ENABLE USER ACCESS TO PUBLIC(CLIENT) FOLDER
app.use("/client", express.static(path.join(__dirname, "../client/")));
app.use("/scripts", express.static(path.join(__dirname, "../client/scripts")));
app.use("/css", express.static(path.join(__dirname, "../client/css")));

app.get("/", (req, res) => {
  res.render(path.join(__dirname, "../client/pages/index.handlebars"));
});
// app.get("/", (req, res) => {
//     res.sendFile(path.join(__dirname, "../client/pages/index.html"));
//   });
//
const io = require("socket.io")(server, {
  cors: { origin: "*" },
});

io.on("connection", function (socket) {
  const socketId = socket.id;
  socketsStatus[socket.id] = {};

  console.log("connect");

  socket.on("voice", function (data) {
    var newData = data.split(";");
    newData[0] = "data:audio/ogg;";
    newData = newData[0] + newData[1];

    for (const id in socketsStatus) {
      if (id != socketId && !socketsStatus[id].mute && socketsStatus[id].online)
        socket.broadcast.to(id).emit("send", newData);
    }
  });

  socket.on("userInformation", function (data) {
    socketsStatus[socketId] = data;

    io.sockets.emit("usersUpdate", socketsStatus);
  });

  socket.on("disconnect", function () {
    delete socketsStatus[socketId];
  });
});

//
server.listen(port, () => {
  console.log(`listening on http://${hostname}:${port}/`);
});
