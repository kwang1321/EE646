//This js takes the start and stop times to scan DDB and 
//write to a file myOutput.txt he number of records, averge temperature and humidity
//Publish this result in a new web page.
//see the document in https://github.com/jilianggqq/AWS_DrWang/blob/master/README.md#redirct-to-a-new-result-page.
//when we visit http://localhost:8081/query, it will match the url route app.get('/query'... (server_test.js line 24) and send file query.html in html folder.
//In the file query.html, the action of form is process_get, that is to say, when we click submit button, it will post data to url http://localhost:8081/process_get. 
//In the line 22 of server_test.js, app.post('/process_get' will catch this request and we can use req.body(line 36) to get the request data.
//Using request data, we do something with ddb and file. After that, we need to response calculated data to a new page. During this situation we have to use html template for express named EJS.
//We add a View named query_res.ejs into views folder. And use res.render('query_res', contents)(line 148) to render the template named query_res.ejs with response data stored in contents.
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(express.static(__dirname + "/html"));
app.set('view engine', 'ejs');

// to support JSON-encoded bodies
app.use(bodyParser.json());
// to support URL-encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/query', function(req, res) {
    res.sendfile("html/query.html");
});

app.post('/process_get', function(req, res) {
    // Prepare output in JSON format
    console.log("start process_get ...");
    console.log(req.body);
    // response = {
    //     start_time: req.query.start_time,
    //     end_time: req.query.end_time,
    // };
    response = req.body;
    console.log(response);
    // res.end(JSON.stringify(response));
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
    wstream.on('finish', function() {
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
            ":end_timestamp": end_time_ms
        }
    };

    console.log("Scanning myIOTDDBTable table.");
    docClient.scan(params, onScan);
    // res.render('query_res', { users: [{ name: 'John' }, { name: 'Mike' }, { name: 'Samantha' }] });

    function onScan(err, data) {
        var sum_temperature = 0;
        var sum_humidity = 0;
        var n = 0;
        var avg_temperature = 0;
        var avg_humidity = 0;
        var temperature = 0;
        var humidity = 0;


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
                    n = n + 1;
                    sum_temperature = sum_temperature + temperature;
                    sum_humidity = sum_humidity + humidity;
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

        avg_temperature = sum_temperature / n;
        avg_humidity = sum_humidity / n;
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

        // var contents = { "avg_temperature": avg_temperature, "avg_humidity": avg_humidity, "records": records, 'start_time': start_time, 'end_time': end_time };
        // you can uncomment above line to get data from ddb.
        var contents = { "avg_temperature": avg_temperature, "avg_humidity": avg_humidity, "records": records, 'start_time': start_time, 'end_time': end_time };
        res.render('query_res', contents);
    }

});

var server = app.listen(8081, function() {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)

});
