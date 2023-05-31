import nodemailer from "nodemailer";
import crypto from "crypto";
import User from "../models/user.js";

// Create a Nodemailer transporter with your SMTP settings
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: true,
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

// Generate a verification token using a random 32-byte string
function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Send a verification email to the user
async function sendVerificationEmail(user) {
  const verificationToken = generateVerificationToken();
  user.verificationToken = verificationToken;
  await user.save();

  const verificationUrl = `
  https://liftapp.onrender.com/api/users/verify?verificationToken=${verificationToken}`;

  const mailOptions = {
    from: "noreply@example.com",
    to: user.email,
    subject: "Please verify your email address",
    html: `
    <div style="max-width: 600px; margin: auto;">
    <div style="background-color: #f2f2f2; padding: 20px; text-align: center;">
      <h1>Welcome to Lift App</h1>
      <p>Please click the button below to verify your email address:</p>
      <div style="margin-top: 20px;">
        <a href="${verificationUrl}" style="background-color: #008CBA; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Verify Email Address</a>
      </div>
      <!--<p style="margin-top: 20px;">Email: ${user.email}</p>-->
      <!--<p style="margin-top: 5px;">Password: liftapp123</p>-->
      <p style="margin-top: 20px;">To download the Lift App, please visit our website:</p>
      <div style="margin-top: 10px;">
        <a href="bit.ly/cvsu-lft" style="background-color: #008CBA; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Download the Lift App</a>
      </div>
    </div>
  </div>
    `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return true;
    } else {
      console.log("Email sent: " + info.response);
      return false;
    }
  });
}

async function sendResetPasswordEmail(resetToken, email) {
  const resetUrl = `https://liftapp.onrender.com/api/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: "noreply@example.com",
    to: email,
    subject: "Reset Your Password",
    html: `
      <div style="max-width: 600px; margin: auto;">
        <div style="background-color: #f2f2f2; padding: 20px; text-align: center;">
          <h1>Reset Your Password</h1>
          <p>You have requested to reset your password. Please click the button below to reset your password:</p>
          <div style="margin-top: 20px;">
            <a href="${resetUrl}" style="background-color: #008CBA; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Reset Password</a>
          </div>
          <p>If you did not request this password reset, you can safely ignore this email.</p>
          <p class="signature">Thank you,<br>The Lift App Team</p>
        </div>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return true;
    } else {
      console.log("Email sent: " + info.response);
      return false;
    }
  });
}

const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.query.verificationToken,
      isEmailVerified: false,
    });

    if (!user) {
      return res.status(404).render("error", {
        message: "Invalid verification token",
      });
    }

    user.isEmailVerified = true;
    user.verificationToken = null;
    await user.save();

    res.render("verifyEmail", {
      username: `${user.firstName} ${user.lastName}`,
      appName: "Lift App",
    });
  } catch (e) {
    res.status(500).render("error", { message: e.message });
  }
};

export { sendVerificationEmail, verifyEmail, sendResetPasswordEmail };

// USING MAILGUN

// import crypto from "crypto";
// import User from "../models/user.js";
// import Mailgun from "mailgun.js";
// import formData from "form-data";

// const mailgun = new Mailgun(formData);

// // Create a new Mailgun instance with your API key and domain
// const mg = mailgun.client({
//   username: "api",
//   key: process.env.MAILGUN_API_KEY || "key-yourkeyhere",
// });

// // Generate a verification token using a random 32-byte string
// function generateVerificationToken() {
//   return crypto.randomBytes(32).toString("hex");
// }

// // Send a verification email to the user
// async function sendVerificationEmail(user) {
//   const verificationToken = generateVerificationToken();
//   user.verificationToken = verificationToken;
//   await user.save();

//   const verificationUrl = `
//   https://localhost:3000/api/users/verify?verificationToken=${verificationToken}`;

//   const data = {
//     from: "noreply@example.com",
//     to: user.email,
//     subject: "Please verify your email address",
//     html: `Click <a href="${verificationUrl}">here</a> to verify your email address.`,
//   };

//   mg.messages
//     .create(process.env.MAILGUN_DOMAIN, data)
//     .then((msg) => console.log(msg)) // logs response data
//     .catch((err) => console.error(err)); // logs any error
// }

// // Verify the user's email address
// async function verifyEmail(req, res) {
//   const { verificationToken } = req.query;

//   const user = await User.findOne({ verificationToken });

//   if (!user) {
//     return res.status(400).send("Invalid verification token");
//   }

//   const token = await user.generateAuthToken();

//   user.isEmailVerified = true;
//   user.verificationToken = null;
//   await user.save();

//   return res.redirect("/verified");
// }

// export { sendVerificationEmail, verifyEmail };
