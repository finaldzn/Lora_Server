//Requirements

const app = require("express")();
const request = require("request");
const http = require("http").Server(app);
const fs = require("fs")
const path = require("path")
//we add the socket package
const io = require('socket.io')(http);
const bodyParser = require("body-parser");
const deviceID = "xxxxxxxxxxx"
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyBFK34TXntFYOlrjIf73KusUbPWEBBNT2A' //replace with the API key you got from Google
});

const dir = process.env.DATA_DIR || "."
var downlink_link = ""
file = "data.json"
fs.openSync(file, 'a')

//Read the json
const read = function () {
    return new Promise(function (resolve, reject) {
      // start reading the file
      fs.readFile(file, "utf8", function (err, data) {
        if (err) {
          return reject(err)
        }
        // return the parsed data
        return resolve(JSON.parse(data || "[]"))
      })
    })
}

// special reading function to extract the data from the JSON file and transform them into something usable for our graph.
const readchartTemperature = function () {
    return new Promise(function (resolve, reject) {
      // start reading the file again
      fs.readFile(file, "utf8", function (err, data) {
        if (err) {
          return reject(err)
        }
        // put the data into a variable
        var datajson = JSON.parse(data || "[]")
        // initialize an empty array
        var tab = []
        //for each element of our json file we get the temperature and the date
        for (var i=0; i < datajson.length; i++){
          var obj = datajson[i]
          var temp = obj.temperature
          var date = obj.date
          // and we push it to the previously empty array
          tab.push([date, temp])
        }
        // return the full array with the "graph-ready" data
        return resolve(tab || "[]")
      })
    })
}

const readchartPressure = function () {
  return new Promise(function (resolve, reject) {
    // start reading the file again
    fs.readFile(file, "utf8", function (err, data) {
      if (err) {
        return reject(err)
      }
      // put the data into a variable
      var datajson = JSON.parse(data || "[]")
      // initialize an empty array
      var tab = []
      //for each element of our json file we get the temperature and the date
      for (var i=0; i < datajson.length; i++){
        var obj = datajson[i]
        var temp = obj.pressure
        var date = obj.date
        // and we push it to the previously empty array
        tab.push([date, temp])
      }
      // return the full array with the "graph-ready" data
      return resolve(tab || "[]")
    })
  })
}

const readchartHumidity = function () {
  return new Promise(function (resolve, reject) {
    // start reading the file again
    fs.readFile(file, "utf8", function (err, data) {
      if (err) {
        return reject(err)
      }
      // put the data into a variable
      var datajson = JSON.parse(data || "[]")
      // initialize an empty array
      var tab = []
      //for each element of our json file we get the temperature and the date
      for (var i=0; i < datajson.length; i++){
        var obj = datajson[i]
        var temp = obj.humidity
        var date = obj.date
        // and we push it to the previously empty array
        tab.push([date, temp])
      }
      // return the full array with the "graph-ready" data
      return resolve(tab || "[]")
    })
  })
}

const readGPS = function (){
  return new Promise(function (resolve, reject) {
    // start reading the file again
    fs.readFile(file, "utf8", function (err, data) {
      if (err) {
        return reject(err)
      }
      // put the data into a variable
      var datajson = JSON.parse(data || "[]")
      // initialize an empty array
      var tab = []
      //for each element of our json file we get the temperature and the date
      for (var i=0; i < datajson.length; i++){
        var obj = datajson[i]
        var lng = obj.longitude
        var lat = obj.latitude
        var date = obj.date
        // and we push it to the previously empty array
        tab.push([date, lng, lat])
      }
      // return the full array with the "graph-ready" data
      return resolve(tab[tab.length-1] || "[]")
    })
  })
}
// function writing the data to the JSON file.
const write = function (data) {
    return new Promise(function (resolve, reject) {
      fs.writeFile(file, JSON.stringify(data), "utf8", function (err) {
        if (err) {
          return reject(err)
        }
        return resolve()
      })
    })
}


// write the temperature of the uplink message to our JSON file.
function writeFields(value) {
    return read().then(function(data){
      var now = new Date().toISOString()
      var newEntry = {'date':now, 'temperature':value.temperature, 'altitude':value.altitude*100,'humidity':value.humidity,'pressure':value.pressure,'longitude':value.lon,'latitude':value.lat*0.0566935837}
      data.push(newEntry)
      return write(data)
    })
  }
//code

//What we see
app.get("/", function(req, res){
    res.sendFile(__dirname + "/index.html")
})

app.get('/chartdata/temperature', function(req, res) {
    console.log('GET CHARTDATA TEMPERATURE')
    return readchartTemperature().then(res.json.bind(res))
})

app.get('/chartdata/humidity', function(req, res) {
  console.log('GET CHARTDATA HUMIDITY')
  return readchartHumidity().then(res.json.bind(res))
})
app.get('/chartdata/pressure', function(req, res) {
  console.log('GET CHARTDATA PRESSURE')
  return readchartPressure().then(res.json.bind(res))
})
app.get("/generator", function(req, res) {
  console.log('GET LAT/LONG')
  return readGPS().then(res.json.bind(res))
});
//the treament of the POST request made to the /on URL
app.post("/on", function(req, res) {
    // we create the message to be sent
    var msg = {
        "dev_id": deviceID,
        "port": 1,
        "payload_raw": "AQ=="
    }
    // if the downlink link is defined we send the request
    if (downlink_link != "") {
        request({
            url: downlink_link,
            method: "POST",
            json: msg
        })
    } else { // if not we print an error message
        console.log("Error, wait for an uplink message to come in to get the downlink url")
    }
})

// the treament of the POST request made to the /off URL
app.post("/off", function(req, res) {
    //this is our downlink message
    var msg = {
        "dev_id": deviceID,
        "port": 1,
        "payload_raw": "AA=="
    }

    // if the downlink url is set, we send the request
    if (downlink_link != "") {
        request({
            url: downlink_link,
            method: "POST",
            json: msg
        })
    } else { // if not we print the error message to the console
      console.log("Error, wait for an uplink message to come in to get the downlink url")
    }
})

//How we receive data from the things network
app.post("/endpoint", function(req, res) {
    console.log(req.body)
    writeFields(req.body.payload_fields)
    downlink_link = req.body.downlink_url
    io.emit('message', req.body);
    res.sendFile(__dirname + "/index.html")
})

http.listen(8000, function(){
    console.log('listening on *:8000')
});