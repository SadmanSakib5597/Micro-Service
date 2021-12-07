const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http,  {
    cors: {
        origin: '*'
    }
});

const sch = require('node-schedule');

var riders = [];
var drivers = [];

var numberOfClientReq = 0;

app.use(express.json());

io.of('communication').on('connection', (socket)=>{
    console.log("User connected: " + socket.id);
    const job = sch.scheduleJob('*/5 * * * * *', function(){
         getMinDistance(socket);
    });
});

app.post('/rider',async (req,res) => {
    riders.push(req);

});

app.post('/driver',async (req,res) => {
    drivers.push(req);
});

function getDistance (x1, y1, x2, y2) {
    var deltaX = x1 - x2;
    var deltaY = y1 - y2;
    var dist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    return (dist);
  };

function getMinDistance(socket){

    if(numberOfClientReq>5){
        numberOfClientReq = 0;
        riders = [];
        drivers = [];
        return;
    }

    if(riders.length == 0)
    {
        socket.emit('minDis', 'No match found!');
        return;
    }

    riders.forEach(rider => {
        var riderCorX = rider.body.CorX;
        var riderCorY = rider.body.CorY;

        var minDistance = 100000;
        var selectedDriver;
        selectedRider = rider;

        drivers.forEach(driver => {
            var driverCorX = driver.body.CorX;
            var driverCorY = driver.body.CorY;

            var distance = getDistance(riderCorX, riderCorY, driverCorX, driverCorY);

            if(distance < minDistance)
            {
                minDistance = distance;
                selectedDriver = driver;
            }
                
        });

        var rating = randomNumber(0,5);

        socket.emit("minDis", 'Best Match: ' +
         selectedRider.body.name + ' (' + selectedRider.body.CorX.toFixed(2) + ", " + selectedRider.body.CorY.toFixed(2) + ')' +
        ' and ' +
        selectedDriver.body.name + ' (' + selectedDriver.body.CorX.toFixed(2) + ", " + selectedDriver.body.CorY.toFixed(2) + ')' +
        ' Car Number: ' + selectedDriver.body.carNumber +
        ' Distance: ' + 
        minDistance.toFixed(2) +
        ' km, Ride Fare: ' +
        (minDistance * 2.0).toFixed(2) +
        ' Driver Rating: ' + parseInt(rating)
        );

        socket.emit('driverRating', JSON.stringify(
            {
                name: selectedDriver.body.name,
                carNumber: selectedDriver.body.carNumber,
                rating: rating,
            }
        ));

        numberOfClientReq++;

    });
}

function randomNumber(min, max) { 
    return Math.random() * (max - min) + min;
}

http.listen(3000,()=>{
    console.log('Server started and listening to port 3000...');
})