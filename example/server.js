var http = require("http");
var express = require("express");
var ShareDB = require("sharedb");
var WebSocket = require("ws");
var WebSocketJSONStream = require("@teamwork/websocket-json-stream");
var json0 = require("ot-json0");

ShareDB.types.register(json0.type);

var backend = new ShareDB();
createDoc(startServer);

function createDoc(callback) {
  var connection = backend.connect();
  var doc = connection.get("example", "editor");
  doc.fetch(function (err) {
    if (err) throw err;
    if (doc.type === null) {
      doc.create(
        {
          content: `function main() {
  console.log('main');
}
main();
`,
        },
        callback
      );
      return;
    }
    callback();
  });
}

function startServer() {
  var app = express();
  app.use(express.static("static"));
  var server = http.createServer(app);

  var wss = new WebSocket.Server({ server: server });
  wss.on("connection", function (ws) {
    var stream = new WebSocketJSONStream(ws);
    backend.listen(stream);
  });

  server.listen(8080);
  console.log("Listening on http://localhost:8080");
}
