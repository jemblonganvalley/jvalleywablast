const { Client } = require("whatsapp-web.js");
const client = new Client();
// const qrcode = require("qrcode");
const qrcode = require("qrcode-terminal");

const express = require("express");

client.on("qr", (qr) => {
  // Generate and scan this code with your phone
  //   console.log("QR RECEIVED", qr);
  qrcode.generate(qr, { small: false });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", (msg) => {
  if (msg.body == "!ping") {
    msg.reply("pong");
  }
});

client.initialize();
