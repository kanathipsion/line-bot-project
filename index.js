const express = require('express');
const bodyParser = require('body-parser');
const line = require('@line/bot-sdk');
const axios = require('axios');

const app = express();

// ตั้งค่าการเชื่อมต่อกับ LINE API
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN, // ใช้ environment variable
  channelSecret: process.env.LINE_CHANNEL_SECRET, // ใช้ environment variable
};

const client = new line.Client(config);

// ตั้งค่า Middleware เพื่อให้รับข้อมูลจาก LINE Webhook
app.use(bodyParser.json());

// ตั้งค่า Route สำหรับ LINE Webhook
app.post('/webhook', (req, res) => {
  const events = req.body.events;
  Promise.all(events.map(handleEvent))
    .then(() => res.status(200).send('OK'))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});

// ฟังก์ชันในการจัดการกับข้อความที่ได้รับ
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const message = event.message.text;

  // แยกข้อมูลจากข้อความ เช่น "ค่าน้ำตาล XX ค่าความดัน YY"
  const [sugarLevel, bloodPressure] = message.split(" ");
  const sugar = parseInt(sugarLevel.replace('ค่าน้ำตาล', '').trim());
  const pressure = parseInt(bloodPressure.replace('ค่าความดัน', '').trim());

  let healthStatus = 'ปกติ';
  if (sugar > 100) healthStatus = 'น้ำตาลสูง';
  if (pressure > 120) healthStatus = 'ความดันสูง';

  // ส่งข้อความตอบกลับ
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `ข้อมูลของคุณ ค่าน้ำตาล: ${sugar} ค่าความดัน: ${pressure}\nสถานะสุขภาพ: ${healthStatus}`,
  });
}

// ตั้งค่าเซิร์ฟเวอร์ให้รันที่ Port 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
