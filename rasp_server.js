// Check argv
if (process.argv.length < 3) {
    console.log("[USAGE] node rasp_server.js PORT");
    return;
}

// raspberry pi motor control
var ctrl = require("./rasp_control.js");

// Get IP address
var gulp   = require( "gulp" );
var os     = require("os");
var ifaces = os.networkInterfaces();
var ipAddress;

Object.keys(ifaces).forEach(function (ifname) {
  ifaces[ifname].forEach(function (iface) {

    if ("IPv4" !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    console.log("AVAILABLE IP:", ifname, iface.address);
    ipAddress = iface.address;

  });
});

// Exit Handler
process.on("uncaughtException", function(err) {
  console.log(err);
  ctrl.exitProc();
});

process.on("SIGINT", sig_proc);
process.on("SIGHUP", sig_proc);
process.on("SIGTERM", sig_proc);

function sig_proc() {
  ctrl.exitProc();
}

// Server Initialization
var port   = process.argv[2];
var http   = require("http");
var fs     = require("fs");
var ejs    = require("ejs");
var qs     = require("querystring");
var server = http.createServer();
server.on("request", response);
server.listen(port);
var io = require("socket.io").listen(server);

//var fs = require("fs");
//var server = require("http").createServer(function(req, res) {
//     res.writeHead(200, {"Content-Type":"text/html"});
//     var output = fs.readFileSync("./index.html", "utf-8");
//     res.end(output);
//}).listen(port);
//var io = require("socket.io").listen(server);

console.log("SERVER started!");
console.log("PORT:" + port);


// POST Handler
var post = [];
function response(req, res) {
  var data = "";

  function makeHTML() {
    //console.log("makeHTML");
    var template = fs.readFileSync("index.ejs", "utf-8");
    var html = ejs.render(template, {post: post});
    res.writeHead(200, {"Content-type": "text/html"});
    res.write(html);
    res.end();
  }

  switch(req.url) {
  case "/buggy.jpg":
        var image_file = "./img/buggy.jpg";
        var type = "image/jpeg";
        if( fs.existsSync( image_file ) ){
          var imgData = fs.readFileSync( image_file, "binary" );
          res.writeHead(200, {"Content-Type": type } );
          res.end( imgData, "binary" );
        }

        // console.log("req.url = " + req.url);
        // fs.readFileSync("./img/buggy_small.jpg", "binary",
        //     function (err, data) {
        //         //res.writeHead(200, {"Content-Type": "image/jpeg"});
        //         //res.write(data, "binary");
        //         //res.end();

        //         if (err) {
        //             res.writeHead(400, {"Content-type":"text/html"})
        //             console.log(err);
        //             res.end("No such image");
        //         } else {
        //             console.log("no error");
        //             //specify the content type in the response will be an image
        //             res.writeHead(200,{"Content-type":"image/jpg"});
        //             res.end(data, "binary");
        //         }
        //     }
        // );
        break;
  case "/cross_line.png":
        var image_file = "./img/cross_line.png";
        var type = "image/png";
        if( fs.existsSync( image_file ) ){
          var imgData = fs.readFileSync( image_file, "binary" );
          res.writeHead(200, {"Content-Type": type } );
          res.end( imgData, "binary" );
        }
        break;
  case "/camera":
        //console.log("req.url = " + req.url );
        // var image_file = "/var/www:8080/?action=stream";
        // var type = "text/plain";
        // var imgData = fs.readFile( image_file, "binary" );
        // res.writeHead(200, {"Content-Type": type } );
        // res.end( imgData, "binary" );
        break;
  }

  if (req.method !=  "POST") {
    makeHTML();
  }

  //console.log("req.url = " + req.url );
  //console.log("req.method = " + req.method );
}

// socket.io Handler
io.sockets.on("connection", function (socket) {
  socket.on("direction", function (data) {
    ctrl.raspSetDir(data.value);
  });

  socket.on("speed", function (data) {
    ctrl.raspSetSpd(data.value);
  });

  var move_val = []; // [Horizontal, Vertical]
  socket.on("move", function (data) {
    move_val[0] = (move_init[0] - data.value[0])/1000*100;
    move_val[1] = (move_init[1] - data.value[1])/200*100;

    ctrl.raspMove(move_val);
    socket.emit("status", {value: move_val});
  });

  var move_init = [];
  socket.on("init_move", function (data) {
    move_init = data.value;
  });
});