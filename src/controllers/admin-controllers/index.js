const adminHome = (req, res) => {
  res.render("index");
};

const login = (req, res) => {
  res.render("login");
};

export { adminHome, login };
