var noble = require('noble');
var gimbal = require('./gimbal');
var rest = require('restler');
var _ = require('lodash');


noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.startScanning([], false);
  } else {
    noble.stopScanning();
  }
});

var present = {}
var cache = []



var addService = function(s) {

  if (!s.advertisement.manufacturerData) {
    return false;
  }

  var sid = s.advertisement.serviceUuids[0];
  var mfid = s.advertisement.manufacturerData.toString('hex');
  if (!present[mfid + ""]) {
    tagInfo(s, function(data) {
      present[mfid + ""] = JSON.stringify({data: data, mfid: mfid, sid: sid, time: new Date().getTime(), rssi: s.rssi})
    });
  }
  else {
    p = JSON.parse(present[mfid + ""])
    p.time = new Date().getTime()
    present[mfid + ""] = JSON.stringify(p)
  }
}

var tagInfo = function(s, callback) {
  if (!s.advertisement || (!s.advertisement.manufacturerData || (s.advertisement.serviceUuids.length < 1))) {
  
    return null;
  }
  var sid = s.advertisement.serviceUuids[0];
  var mfid = s.advertisement.manufacturerData.toString('hex');
  if (cache[mfid]) {
      callback(cache[mfid])
  }
  else {
    gimbal.findBeacon(sid, mfid, function(data) {
      if (!data["identifier"]) {
        return;
      }
      cache[mfid] = data
      callback(cache[mfid])
    })
  }
}

noble.on('discover', function(peripheral) {
  var mfid;
  var sid = peripheral.advertisement.serviceUuids[0]
  if (peripheral.advertisement.manufacturerData) {
    mfid = peripheral.advertisement.manufacturerData.toString('hex');
  }

  if (sid && sid.length == 32) {
    addService(peripheral)
  }



});

setInterval(function() {
  process.stdout.write('\033c');
  console.log(present)
  rest.post("http://officespace.ngrok.com/api/pings", {data: {"tags": JSON.stringify(present), "room_id": 11}}).on('complete', function(resp) {
    //console.log(resp);
  })
}, 30000)

setInterval(function() {
  var now = new Date().getTime();
  _.forEach(_.keys(present), function(n) {
    var p = JSON.parse(present[n])
    var diff = (now - p.time)
    //console.log(diff, 30 * 1000)
    if (diff > (30 * 1000))
      delete present[n]  
  });
}, 2000)


setInterval(function() {
  noble.stopScanning();
  noble.startScanning([], false);
}, 500)
