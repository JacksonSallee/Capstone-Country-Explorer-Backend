let http = require('http');
let routes = require('./controller');

const PORT = 3000;

http.createServer(routes.handleRequest).listen(PORT, '0.0.0.0', function() {
  console.log("Server is listening on port " + PORT);
});