import User from "../../models/user.js";

const adminHome = (req, res) => {
  res.render("index");
};

const login = (req, res) => {
  var token = req.cookies.access_token;
  if (token) {
    return res.redirect("/admin");
  }
  res.render("login");
};

const loginFunction = async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const deviceToken = "hapihapi";
    const fcmToken = "hapi";

    const user = await User.findByCredentials(email, password);

    if (!user.isEmailVerified || user.role !== "admin") {
      return res.redirect("/login");
    }

    const updatedDevice = { deviceToken, fcmToken };
    const deviceIndex = user.devices.findIndex(
      (device) => device.deviceToken === deviceToken
    );

    if (deviceIndex === -1) {
      // the device is new, so add it to the user's devices array
      user.devices.push(updatedDevice);
    } else {
      // update the existing device's fcmToken
      user.devices[deviceIndex].fcmToken = fcmToken;
    }

    await user.save();

    const token = await user.generateAuthToken();

    res.cookie("access_token", token, {
      httpOnly: true,
      //secure: process.env.NODE_ENV === "production",
    });

    res.redirect("/admin");
    //res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
};

const logout = async (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/login");
};

export { adminHome, login, loginFunction, logout };
