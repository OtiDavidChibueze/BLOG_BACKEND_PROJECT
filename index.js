//* BLOGS INDEX FILE
const server = require("./src/routes/app");
const keys = require("./src/config/keys");
const connectToDatabase = require("./src/config/db");

//* TO PORT.....
const Port = keys.PORT || 7070;

//* CONNECT TO DB
connectToDatabase();

//* LISTENING TO PORT
server.listen(Port, () => {
  console.log(`listening to port ${Port}`);
});
