var sharedb = require("sharedb/lib/client");
var json0 = require("ot-json0");
var ShareDBMonaco = require("sharedb-monaco-editor").default;

sharedb.types.register(json0.type);

var socket = new WebSocket("ws://localhost:8080");
var shareConnection = new sharedb.Connection(socket);
var doc = shareConnection.get("example", "editor");

window.require.config({
  paths: { vs: "https://unpkg.com/monaco-editor/min/vs" },
});
window.require(["vs/editor/editor.main"], function () {
  var editor = window.monaco.editor.create(
    document.getElementById("container"),
    {
      value: "",
      language: "javascript",
    }
  );
  global.editor = editor;
  ShareDBMonaco.attachDoc(doc, editor, {
    key: "content",
  });
});
