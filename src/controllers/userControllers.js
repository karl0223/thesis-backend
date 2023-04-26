import User from "../models/user.js";

const signup = async (req, res) => {
  const user = new User(req.body);
  const deviceToken = req.body.deviceToken;
  const fcmToken = req.body.fcmToken;
  try {
    user.devices = [{ deviceToken, fcmToken }];
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
};

const login = async (req, res) => {
  try {
    const { email, password, deviceToken, fcmToken } = req.body;

    const user = await User.findByCredentials(email, password);
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

    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
};

const logout = async (req, res) => {
  try {
    const deviceToken = req.deviceToken;

    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    // remove the device with the given token from the user's devices array
    req.user.devices = req.user.devices.filter(
      (device) => device.deviceToken !== deviceToken
    );

    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
};

const logoutAll = async (req, res) => {
  try {
    req.user.tokens = [];
    req.user.devices = [];

    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("tutorRatings", "value")
      .populate("tuteeRatings", "value")
      .exec();

    if (!user) {
      return res.status(404).send("User not found");
    }

    await user.save();

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
};

const updateUser = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["firstName", "lastName", "email", "password", "age"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });

    await req.user.save();

    res.send(req.user);
  } catch (e) {
    res.status(400).send();
  }
};

const deleteUser = async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
};

export { signup, login, logout, logoutAll, getUser, updateUser, deleteUser };
