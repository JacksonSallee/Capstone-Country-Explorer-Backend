const services = require('./countries-services');

function setCors(res) {
  // For a student project, this is fine:
  res.setHeader('Access-Control-Allow-Origin', '*');

  // If you want to be stricter, use this instead of '*':
  // res.setHeader('Access-Control-Allow-Origin', 'https://YOUR_USERNAME.github.io');

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function handleRequest(req, res) {
  setCors(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  let filePath = "." + req.url;

  if (filePath === "./countries" && req.method === "GET") {
    services.fetchCountries()
      .then(function (data) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      })
      .catch(function (err) {
        console.error('Error fetching countries data:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error: failed to fetch data' }));
      });

  } else if (filePath === "./countries") {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end("Incorrect HTTP method used.");
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end("Requested URL not found");
  }
}

module.exports = { handleRequest };
