var express = require('express');
var app = express();
var cors = require('cors');
const proxy = require('http-proxy-middleware');
var apparels = require('./apparels.json');
var footwear = require('./footwear.json');

var template = `<!DOCTYPE html> <html> <body>
	<script type="text/javascript">
		var source = new EventSource("/events/");
		source.onmessage = function(e) {
			document.body.innerHTML += e.data + "<br>";
		};
	</script>
</body> </html>`;

app.use(function(req, res, next) {
  console.log('request', req);
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.get('/', function(req, res) {
  res.send(template); // <- Return the static template above
});

var clientId = 0;
var clients = {}; // <- Keep a map of attached clients

// Called once for each new client. Note, this response is left open!
app.get('/events/', function(req, res) {
  req.socket.setTimeout(Number.MAX_VALUE);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream', // <- Important headers
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write('\n');
  (function(clientId) {
    clients[clientId] = res; // <- Add this client to those we consider "attached"
    req.on('close', function() {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
  })(++clientId);
});

app.get('/apparels/', function(req, res) {
  res.json(apparels);
});

app.get('/footwear/', function(req, res) {
  res.json(footwear);
});

setInterval(function() {
  var msg = Math.random();
  console.log('Clients: ' + Object.keys(clients) + ' <- ' + msg);
  for (clientId in clients) {
    clients[clientId].write('data: ' + msg + '\n\n'); // <- Push a message to a single attached client
  }
}, 30000);

app.listen(process.env.PORT || 5000);
