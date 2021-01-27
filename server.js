const qrcode = require("qrcode-terminal");
const { Client, MessageMedia } = require("whatsapp-web.js");
const fs = require("fs");

//baca ketika ada session
const SESSION_FILE_PATH = "./session.json";
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionCfg = require(SESSION_FILE_PATH);
}

// Use the saved values
const client = new Client({
  //   puppeteer: { headless: true },
  session: sessionCfg,
});

client.initialize();

//ketika tidak ada session makan akan muncul qr dan scan lah
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

//setelah scan, akan disimpan ke file session.js
client.on("authenticated", (session) => {
  fs.writeFile("./session.json", JSON.stringify(session), function (err) {
    if (err) {
      console.error(err);
    }
  });
});

//client dah siap
client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", (message) => {
  if (message.body === "tidak") {
    message.reply(`
okay terimakasih..
    `);
  }
});

//send message with image
client.on("message", (message) => {
  const media = MessageMedia.fromFilePath("./media/sajian.jpg");
  if (message.body === "foto") {
    client.sendMessage(message.from, media, { caption: "selamat menikmati" });
  }
});

client.on("message", (message) => {
  const mb = message.body.toLowerCase();
  if (mb) {
    message.reply(`
_Hape sedang tertinggal, nanti di hubungi kembali_
*Suhartoyo*
    `);
  }
});
