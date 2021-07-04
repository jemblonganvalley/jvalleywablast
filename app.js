require("dotenv").config();
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
var isLogin = false;
var isScan = false;
var client

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

//middleware
const checkLogin = (req, res, next) => {
  if (!isLogin) {
    // res.json({
    //   message: "wrong way",
    // });
    res.redirect("/");
  }
  next();
};

const hasLogin = (req, res, next) => {
  if (isLogin && !isScan) {
    res.redirect("/scan");
  } else if (isLogin && isScan) {
    res.redirect("/send");
  }
  next();
};

//route

app.use(express.static("public"));

// baca ketika ada session
const SESSION_FILE_PATH = "./session.json";
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionCfg = require(SESSION_FILE_PATH);
  console.log(sessionCfg);
  client = new Client({
    session: sessionCfg,
  });

} else {
  client = new Client();
}


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
  if (message.body === "Ya") {
    client.sendMessage(message.from, media, {
      caption: `*LANEIGE SHOPPING VOUCHER IDR 100,000* Tukar pesan ini di Counter LANEIGE Sogo Plaza Senayan. Hanya berlaku sampai 28 Februari 2021! T&C Apply.`,
    });
  }
});

//get qr image
app.get("/qrimage", (req, res) => {
  client.on("qr", (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          qr_url: url,
          message: "silakan scan",
        });
      }
    });
  });
});

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
    socket.emit("ready", "client ready");
    isScan = true;
  });
});

app.post("/api/send", (req, res) => {
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
    })
    .catch((err) => console.log(err));
});

app.post("/sendTest", (req, res) => {
  const media = MessageMedia.fromFilePath("./media/ps.jpeg");

  const { number, name } = req.body;
  var message = `Hello *${name}*..
Kamu mendapatkan pesan ini karena kamu terdaftar menjadi *LANEIGE INDONESIA Member*.

Untuk tetap mendapatkan informasi mengenai Promo, Event dan Produk menarik dari LANEIGE,
silakan balas dengan *Ya*

Terimakasih ${name}`;

  client
    .sendMessage(number, {
      caption: `*LANEIGE SHOPPING VOUCHER IDR 100,000* Tukar pesan ini di Counter LANEIGE Sogo Plaza Senayan. Hanya berlaku sampai 28 Februari 2021! T&C Apply.`,
    })
    .then(() => {
      res.status(200).json({
        message: `pesan terkirim ke : ${number}`,
      });
    })
    .catch((err) => console.log(err));
});

app.get("/scan", checkLogin, (req, res) => {
  res.sendFile("scan.html", { root: `${__dirname}/public` });
});

app.get("/", hasLogin, (req, res) => {
  res.sendFile("login.html", { root: `${__dirname}/public` });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.USERNAME && password === process.env.PASSWORD) {
    res.json({
      result: true,
      message: "login berhasil",
    });
    isLogin = true;
    // console.log(isLogin);
    io.on("connection", (socket) => {
      socket.emit("isLogin", "true");
    });
  } else {
    res.json({
      message: "operation not permited.",
    });
    isLogin = false;
  }
});

app.get("/send", checkLogin, (req, res) => {
  res.sendFile("send.html", { root: `${__dirname}/public` });
});

app.get("/logout", (req, res) => {
  isLogin = false;
  isScan = false;
  res.redirect("/");
});

app.post("/api/blast", (req, res) => {
  const message = req.body.message;
  const allData = message.split(/\n/);
  allData.map((e) => {
    const nm = e.split(" ")[0];
    const number = nm.replace("0", "62") + "@c.us";
    const name = e.split(" ")[1];
    const msg = `Hello *${name}*..
Kamu mendapatkan pesan ini karena kamu terdaftar menjadi *LANEIGE INDONESIA Member*.

Untuk tetap mendapatkan informasi mengenai Promo,Event dan Produk menarik dari LANEIGE,
silakan balas dengan *Ya*

Terimakasih ${name}
      `;
    // console.log(e.split(" ")[0]);
    client
      .sendMessage(number, msg)
      .then(() => {
        res.status(200).json({
          message: `pesan terkirim ke : ${number}`,
        });
      })
      .catch((err) => console.log(err));
  });
});

server.listen(PORT, () => {
  console.log("listening");
});
