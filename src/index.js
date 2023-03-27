import server from "./app.js";
const port = process.env.PORT;

server.listen(port, () => {
  console.log("Server us up on port " + port);
});
