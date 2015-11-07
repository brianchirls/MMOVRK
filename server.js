function max(a, b) {
	return a !== undefined && a > b ? a : b;
}

var dgram = require('dgram'),
	express = require('express'),
	http = require('http'),
	url = require('url'),
	fs = require('fs'),
	server,
	app,
	socket,


	last = (new Date()).getTime(),
	rate_limit = 1000/50, //milliseconds

	types = {
		js: 'text/javascript',
		html: 'text/html',
		txt: 'text/plain'
	};

app = express();
app.use(express.static(__dirname + '/dist'));
server = http.createServer(app);
socket = require('socket.io').listen(server);
server.listen(8080);

/*
server = http.createServer(function(req, res){
	var path = url.parse(req.url).pathname;

	if (path === '/') {
		path = '/play.html';
	}

	var ext = path.split('.');

	if (ext && ext.length) {
		ext = ext.pop();
		ext = ext.toLowerCase();
	} else {
		ext = 'txt';
	}

	if (path === 'server.js') {
		send404(res, 'not found');
	} else {
		try {
			fs.readFile(__dirname + path, function(err, data){
				if (err) {
					return send404(res, err);
				}
				res.writeHead(200, {'Content-Type': types[ext] || 'text/plain'})
				res.write(data, 'utf8');
				res.end();
			});
		} catch (e) {
			send404(res, 'not found');
		}
	}
}),


send404 = function(res, err){
	res.writeHead(404);
	res.write('<h1>404</h1>');
	res.write('err: ' + JSON.stringify(err));
	res.end();
};

server.listen(8080);
*/
var controller,
	properties = {},
	clients = {},
	part1 = [],
	part2 = []

/*
var socket = io.listen(server, {
	log: console.log,
	transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling'] 
});
*/

socket.on('connection', function(client){
	if (!client) {
		console.log('no client!');
		return;
	}
	if (client.remoteAddress) {
		console.log('client connected. ' + client.id + ' (' + client.connection.remoteAddress + ':' + client.connection.remotePort + ')');
	} else {
		console.log('client connected. ' + client.id);
	}

	console.log('properties', JSON.stringify(properties, null, 4));

	clients[client.id] = client;

	console.log('partX.length', part1.length, part2.length);
	if (part1.length > part2.length) {
		part2.push(client);
		client.part = 2;
	} else {
		part1.push(client);
		client.part = 1;
	}
	console.log('client joining part #' + client.part);

	client.json.send(properties);

	if (properties.playTime) {
		console.log(JSON.stringify({
			action: properties.playState || 'play',
			playTime: properties.playTime,
			part: client.part
		}));
		client.json.send({
			action: properties.playState || 'play',
			playTime: properties.playTime,
			part: client.part
		});
	} else {
		client.json.send({
			part: client.part
		});
	}

	function broadcast(msg) {
		var i;
		for (i in clients) {
			if (clients[i] !== controller) {
				clients[i].json.send(msg);
			}
		}
	}

	var clientSent, serverReceived, response;
	client.on('message', function(message){
		var i;
		if (!message) {
			return;
		}

		console.log(client.id + ': ' + (typeof message) + ': ' + JSON.stringify(message));

		//diff = (client clock - server clock) milliseconds
		serverReceived = Date.now();
		if (message.timing !== undefined) {
			client.maxDiff = max(client.maxDiff, message.timing - serverReceived);

			client.json.send({
				maxDiff:	client.maxDiff,
				timing:		Date.now()
			});

			if (client.maxDiff !== undefined) {
				if (message.minDiff !== undefined) {
					client.minDiff = message.minDiff;
					client.timingDiff = client.minDiff + (client.maxDiff - client.minDiff) / 2
				} else {
					client.timingDiff = client.maxDiff;
				}
			}
		} else {
		}

		if (message.action === 'control') {
			controller = client;
			console.log('control = ' + client.id);
			client.send('control');

			console.log('controller leaving part #' + client.part);
			if (client.part === 1) {
				i = part1.indexOf(client);
				part1.splice(i, 1);
			} else if (client.part === 2) {
				i = part2.indexOf(client);
				part2.splice(i, 1);
			}
			client.part = 0;

		} else if (message.action === 'play' || message.action === 'pause') {
			console.log('broadcasting ' + message.action);
			properties.playState = message.action;
			properties.playTime = message.playTime;
			broadcast({
				action: message.action,
				playTime: message.playTime
			});

		} else if (message.action === 'set') {
			console.log('doing set');
			if (controller === client || controller.id === client.id) {
				console.log('message.value: ' + message.value);
				for (var i in message.value) {
					properties[i] = message.value[i];
					console.log('set property ' + i + ' = ' + message.value[i]);
				}

				broadcast(properties);
			} else {
				console.log('control doesn\'t match', controller.id, client.id);
			}
		}
		

	});
	
	client.on('disconnect', function(){
		var i;
		if (client.part) {
			console.log('client leaving part #' + client.part);
		}
		if (client.part === 1) {
			i = part1.indexOf(client);
			part1.splice(i, 1);
		} else if (client.part === 2) {
			i = part2.indexOf(client);
			part2.splice(i, 1);
		}
		delete clients[client.id];
	});
});



/*

B:	actual time that server clock started (1/1/1970 @ 12am)
b:	actual time that client clock started (1/1/1970 @ 12am)

Sx:	time that server sent timing packet
rx:	time that client received timing packet

d:	b - B
tx:	transmission time + processing time
dx:	rx - Sx
*solve for d

r0 = S0 + b - B + t0
r0 = S0 + d + t

d = r0 - S0 - t
t = r0 - S0 - d
t = d0 - d, t >= 0

********************************************
d <= d0
d <= d0 && d <= d1  --->  d <= min(d0, d1)
********************************************


sx:	time that client sent timing packet
Rx:	time that server received timing packet

Tx:	transmission time
Dx:	Rx - sX

R1 = s1 + B - b + t1
R1 = s1 - d + t
d = s1 - R1 + t
t = d + R1 - s1
t = D1 + d, t >= 0

********************************************
d >= -D1
d >= -D1 && d >= -D2 --->  d >= max(-D1,-D2)

*/
