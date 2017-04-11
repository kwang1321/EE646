//This script listens for start and end dates input from a form upon submission by node server.js.
//The form is in /public/index.html which can be browsed at https://127:0.0.1.8081/index_html.
//Using these dates, a search is performed on Dynamo DB. The number of records found, average temperature and humidity 
//are written into a file myOutput.tx. The results can be displayed by node search_rest.js and brownse at
//http://127.0.0.1:8081/weather_report
var express = require('express');
var app = express();

//app.use(express.static('public'));
app.use(express.static(__dirname + "/html"));
//app.get('/index.html', function (req, res) {
//   res.sendFile( __dirname + "/" + "index.htm" );
//})
app.get('/index.html', function(req, res) {
    res.sendfile("html/index.html");
});

app.get('/process_get', function (req, res) {
   // Prepare output in JSON format
   response = {
      start_time:req.query.start_time,
      end_time:req.query.end_time,
   };
   console.log(response);
   res.end(JSON.stringify(response));
   var start_time = response.start_time;
   var end_time = response.end_time;
   console.log("Start Time = " + start_time);
   console.log("End Time = " + end_time);

   var start_dob = new Date(start_time);
   var end_dob = new Date(end_time);
  
   var start_time_ms = start_dob.getTime();
   var end_time_ms = end_dob.getTime();
   console.log("Start Time in ms = " + start_time_ms);
   console.log("End Time in ms = " + end_time_ms);
   //Use the start_time_ms and end_time_ms to search for data records in dynamodb
   
   var AWS = require("aws-sdk");
   var fs = require('fs');
   var wstream = fs.createWriteStream('myOutput.txt');
   AWS.config.update({
       region: "us-east-1",
       endpoint: "https://dynamodb.us-east-1.amazonaws.com"
   });
   wstream.on('finish', function () {
       console.log('file has been written');
   });
   var docClient = new AWS.DynamoDB.DocumentClient();

   var params = {
     TableName: "myIOTDDBTable",
     ProjectionExpression: "#timestamp, temperature, payload.humidity",
     FilterExpression: "#timestamp between :start_timestamp and :end_timestamp",
     ExpressionAttributeNames: {
        "#timestamp": "timestamp",
     },
     ExpressionAttributeValues: {
         ":start_timestamp": start_time_ms,
         ":end_timestamp":   end_time_ms
     }
   };

   console.log("Scanning myIOTDDBTable table.");
   docClient.scan(params, onScan);

   function onScan(err, data) {
     var sum_temperature = 0;
     var sum_humidity = 0;
     var n =0;
     var avg_temperature = 0;
     var avg_humidity = 0;
     var temperature =0;
     var humidity =0;


     if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
     } else {
        // print all the items
        console.log("Scan succeeded.");
        data.Items.forEach(function(item) {
           console.log("timestamp:  " + item.timestamp +
           "    temperature:  " + item.temperature +
           "    humidity:  " + item.payload.humidity);
           temperature = parseFloat(item.temperature);
           console.log("temperature:  " + temperature);
           humidity = parseFloat(item.payload.humidity);
           console.log("humidity:  " + humidity);
           n=n+1;
           sum_temperature=sum_temperature+temperature;
           sum_humidity=sum_humidity+humidity;
           console.log("sum_temperature:  " + sum_temperature);
           console.log("sum_humidity:  " + sum_humidity);
        }
              
        );
      // continue scanning if we have more entries, because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        }
       }
//    wstream.on('finish', function () {
//    console.log('file has been written');
//    });
     //For the data records found, calculate avg_temperature and avg_humidity

     avg_temperature=sum_temperature/n;
     avg_humidity=sum_humidity/n;
     console.log("records found:   " + n);
     console.log("average temperature:   " + avg_temperature);
     console.log("average humidity:   " + avg_humidity);
     avg_temperature = avg_temperature.toFixed(2);
     console.log("average temperature:   " + avg_temperature);
     avg_humidity = avg_humidity.toFixed(2);
     console.log("average humidity:   " + avg_humidity);
     records = n.toString();
     avg_temperature = avg_temperature.toString();
     avg_humidity = avg_humidity.toString();
     wstream.write(start_time + ';');
     wstream.write(end_time + ';');
     wstream.write(records + ';');
     wstream.write(avg_temperature + ';');
     wstream.write(avg_humidity + ';');
     wstream.end();
   }
 
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)

})
