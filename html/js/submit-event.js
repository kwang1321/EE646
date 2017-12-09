//The program reads in the start and end times to scan for weather data.
//Then the average temperature and humidity are computered and displayed.

(function() {
    var form = document.getElementById('dates');

    addEvent(form, 'submit', function(e) {
        e.preventDefault();
        var elements = this.elements;
        var start = elements.start.value;
        var end = elements.end.value;
        var start_time = new Date(start);
        var end_time = new Date(end);
        console.log("start_time:  " + start_time);
        console.log("end_time:  " + end_time);

        var AWS = require("aws-sdk");
        AWS.config.update({
            region: "us-east-1",
            endpoint: "https://dynamodb.us-east-1.amazonaws.com"
        });

        var docClient = new AWS.DynamoDB.DocumentClient();

        var params = {
            TableName: "weatherstation",
            ProjectionExpression: "#timestamp, temperature, payload.humidity",
            FilterExpression: "#timestamp between :start_timestamp and :end_timestamp",
            ExpressionAttributeNames: {
                "#timestamp": "timestamp",
            },
            ExpressionAttributeValues: {
                ":start_timestamp": start_time,
                ":end_timestamp": end_time
            }
        };


        console.log("Scanning weatherstation table.");
        docClient.scan(params, onScan);


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
                        //           console.log("temperature:  " + temperature);
                        humidity = parseFloat(item.payload.humidity);
                        //           console.log("humidity:  " + humidity);
                        n = n + 1;
                        sum_temperature = sum_temperature + temperature;
                        //           console.log("sum_temperature:  " + sum_temperature);
                        sum_humidity = sum_humidity + humidity;
                        //           console.log("sum_humidity:  " + sum_humidity);

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
            avg_temperature = sum_temperature / n;
            avg_humidity = sum_humidity / n;
            console.log("records found:   " + n);
            console.log("average temperature:   " + avg_temperature);
            console.log("average humidity:   " + avg_humidity);

            var msg = "Start time:  " + start + "\n" +
                "End time:  " + end + "\n" +
                "records found:  " + n + "\n" +
                "average temperature:  " + avg_temperature + "\n" +
                "average humidity:  " + avg_humidity;

            document.getElementById('main').textContent = msg;

        }

    });
}());
