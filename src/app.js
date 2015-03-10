var express = require('express');
var requestify = require('requestify');
var SerialPort = require("serialport").SerialPort;
var serialPort = new SerialPort("COM7", {baudrate: 9600}, false);
var app = express();

var clone = false;

var histo = [0, 0, 0, 0, 0, 0];
var otherEdisonIp = "coucou.fr";

serialPort.open(function (error) {
  if ( error )
    console.log('failed to open: '+error); 
  else 
  {
	console.log("Serial ready !");
	serialPort.on('data', OnRead);
	serialPort.on('error', function(error) {
		console.log('error : ' + error);
	});
	
    serialPort.write("s12540512");
  }
});

function OnRead(data) {
	console.log('data ' + data + '. length : ' + data.length);
	if (data.length == 24)
	{
		requestify.get('http://'+otherEdisonIp+':8080/moveall?value=' + data);
	}
	setTimeout(cloneCopie, 300);

}

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Server ready at http://%s:%s', host, port);
});

app.get('/moveall', function (req, res) {
	if (!req.query.value && !req.query.value.length == 24)
	{
		res.status(400).send('Bad param id');
		return;
	}	
	var toSend = "";
	for (var i = 0; i < 6; i++)
	{
		var value = req.query.value.slice(i*4, i*4+4)+"";
		if (histo[i] != value)
		{
		var id = ('000' + (i + 10)).slice(-3);
			toSend += "s1" + id + "" + value;
		}
		histo[i] = value;
	}
	console.log("ToSend : " + toSend);
	serialPort.write(toSend);
	res.end();
});

app.get('/move', function (req, res) {
	if (!req.query.id || req.query.id < 0 || 255 < req.query.id)
	{
		res.status(400).send('Bad param id');
		return;
	}
	if (!req.query.value || req.query.value < 0 || 1024 < req.query.value)
	{
        res.status(400).send('Bad param value');
		return;
	}
	var id = ('000' + req.query.id).slice(-3);
	var value = ('0000' + req.query.value).slice(-4);
	var data = "s1" + id + "" + value;
		
	serialPort.write(data);
	res.end();
});

app.get('/clone', function (req, res) {
	if (clone)
	{
		clone = false;
	}
	else
	{
		serialPort.write("s32540001");
		clone = true;
		cloneCopie();
	}
	res.end();
});

function cloneCopie() {
	serialPort.write("s20100000");
}