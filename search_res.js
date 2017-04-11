//This script search myOutput.text and listens for http://127:0.0.1:8081/weather_report to output the results of the search
const fs = require('fs');


var express = require('express');
var app = express();

app.get('/weather_report', function (req, res) {
   fs.readFile('myOutput.txt', function (err, data) {
	   if (err) {
	       throw err;
	   }
	   console.log(data.toString());
	   var str = data.toString();
	   var result = str.split(";");
	   console.log(result[0]);
	   console.log(result[1]);
	   console.log(result[2]);
	   console.log(result[3]);
	   console.log(result[4]);
	   var content = { 'Start time': result[0], 'End time': result[1], 
	   'Records found': result[2], 'Average temperature': result[3], 'Average humidity': result[4] };
       res.send(content);
   });
});

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
});
