const DOMAIN = process.env.MAILGUN_DOMAIN;
const mailgunAPIKey = process.env.MAILGUN_API_KEY;

const formData = require("form-data");
const Mailgun = require("mailgun.js");

const mailgun = new Mailgun(formData);
const client = mailgun.client({
  username: "pythontesting",
  key: mailgunAPIKey,
});

const sendWelcomeEmail = (email, name) => {
  const messageData = {
    from: "pythontesting@example.com",
    to: email,
    subject: "Hello",
    text: `Welcome to the app. ${name}. Let me know how you get along with the app.`,
  };

  client.messages
    .create(DOMAIN, messageData)
    .then((res) => {
      console.log(res);
    })
    .catch((e) => {
      console.log(e);
    });
};

const sendCancelationEmail = (email, name) => {
  const messageData = {
    from: "pythontesting02234@gmail.com",
    to: email,
    subject: "Hello",
    text: `Goodbye. ${name}. Thank you for using the app.`,
  };

  client.messages
    .create(DOMAIN, messageData)
    .then((res) => {
      console.log(res);
    })
    .catch((e) => {
      console.log(e);
    });
};

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail,
};
