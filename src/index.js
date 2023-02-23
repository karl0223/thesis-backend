const app = require("./app");

const port = process.env.PORT;

app.listen(port, () => {
  console.log("Server us up on port " + port);
});
