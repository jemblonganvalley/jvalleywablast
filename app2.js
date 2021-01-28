const qrcode = require("qrcode");
const express = require("express");
const cors = require("cors");
const http = require("http");
const app = express();
const socketIo = require("socket.io");
const { Client, MessageMedia } = require("whatsapp-web.js");
const fs = require("fs");
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const io = socketIo(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.sendFile("scan.html", { root: __dirname + "/public" });
});

//baca ketika ada session
const SESSION_FILE_PATH = "./session.json";
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionCfg = require(SESSION_FILE_PATH);
  // console.log(sessionCfg);
}

// kalo dah scan
// const client = new Client({
//   session: sessionCfg,
// });

//kalo belom scan nyalain ini
const client = new Client();

client.initialize();

//setelah scan, akan disimpan ke file session.js
client.on("authenticated", (session) => {
  fs.writeFile("./session.json", JSON.stringify(session), function (err) {
    if (err) {
      console.error(err);
    }
  });
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
  const media = MessageMedia.fromFilePath("./media/ps.jpeg");
  if (message.body === "foto") {
    client.sendMessage(message.from, media, { caption: "selamat menikmati" });
  }
});

// //send message with image
// client.on("message", (message) => {
//   const media = MessageMedia.fromFilePath("./media/sajian.jpg");
//   const balas = [
//     "ya",
//     "oke",
//     "boleh",
//     "baiklah",
//     "yaudah",
//     "okedeh",
//     "ok",
//     "baik",
//     "yes",
//   ];
//   // const bls = await  message.body.toLowerCase();
//   if (balas.include(message.body.toLowerCase())) {
//     client.sendMessage(message.from, media, { caption: "siap" });
//   }
// });

//send message with image
client.on("message", (message) => {
  const media = MessageMedia.fromFilePath("./media/ps.jpeg");
  if (message.body === "Ya") {
    client.sendMessage(message.from, media, {
      caption: `*LANEIGE SHOPPING VOUCHER IDR 100,000* Tukar pesan ini di Counter LANEIGE Sogo Plaza Senayan. Hanya berlaku sampai 28 Februari 2021! T&C Apply.`,
    });
  }
});

//ketika client mendapatkan pesan
// client.on("message", (message) => {
//   const mb = message.body.toLowerCase();
//   if (mb) {
//     message.reply(`
// _Hape sedang tertinggal, nanti di hubungi kembali_
// *Suhartoyo*
//     `);
//   }
// });

io.on("connection", (socket) => {
  socket.emit("message", "silakan tunggu...");
  client.on("qr", (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
      if (err) {
        console.log(err);
      } else {
        socket.emit("qr", url);
        socket.emit("message", "qrcode silakan scan...");
      }
    });
  });

  //client dah siap
  client.on("ready", () => {
    console.log("Client is ready!");
    socket.emit("message", "client ready");
  });
});

app.post("/send", (req, res) => {
  const { number, name } = req.body;
  var message = `Hello *${name}*..
Kamu mendapatkan pesan ini karena kamu terdaftar
menjadi *LANEIGE INDONESIA Member*.

Untuk tetap mendapatkan informasi mengenai Promo,
Event dan Produk menarik dari LANEIGE,
silakan balas dengan *Ya*

Terimakasih ${name}
  `;
  client
    .sendMessage(number, message)
    .then(() => {
      res.status(200).json({
        message: `pesan terkirim ke : ${number}`,
      });
      socket.emit("log", `Pesan terkirim ke ${number.replace("@c.us", "")}`);
    })
    .catch((err) => console.log(err));
});

app.post("/sendTest", (req, res) => {
  const media = MessageMedia.fromFilePath("./media/ps.jpeg");

  const { number, name } = req.body;
  var message = `Hello *${name}*..
Kamu mendapatkan pesan ini karena kamu terdaftar
menjadi *LANEIGE INDONESIA Member*.

Untuk tetap mendapatkan informasi mengenai Promo,
Event dan Produk menarik dari LANEIGE,
silakan balas dengan *Ya*

Terimakasih ${name}`;

  client
    .sendMessage(number, media, {
      caption: `*LANEIGE SHOPPING VOUCHER IDR 100,000* Tukar pesan ini di Counter LANEIGE Sogo Plaza Senayan. Hanya berlaku sampai 28 Februari 2021! T&C Apply.`,
    })
    .then(() => {
      res.status(200).json({
        message: `pesan terkirim ke : ${number}`,
      });
    })
    .catch((err) => console.log(err));
});

server.listen(PORT, () => {
  console.log("listening");
});
