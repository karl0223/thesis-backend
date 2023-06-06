import admin from "firebase-admin";
import fcm from "fcm-notification";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../../lft_secret_token.json");

var certPath = admin.credential.cert(serviceAccount);
var FCM = new fcm(certPath);

function sendPushNotification(devices, title, messageBody) {
  try {
    devices.forEach((device) => {
      console.log(device);

      let message = {
        android: {
          ttl: 3600 * 1000, // 1 hour in milliseconds
          priority: "high",
          notification: {
            title: title,
            body: messageBody,
          },
        },
        token: device.fcmToken,
      };

      FCM.send(message, function (err, response) {
        if (err) {
          console.log("Something has gone wrong!");
          //res.send(err);
        } else {
          console.log("Successfully sent with response: ", response);
          //res.send(response);
        }
      });
    });
  } catch (e) {
    console.log(e);
  }
}

export default sendPushNotification;
