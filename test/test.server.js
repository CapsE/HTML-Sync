/**
 * Created by Lars on 16.07.2016.
 */

var express = require('express');
var HTMLSync = require('html-sync');

var app = express();

var http = require('http').createServer(app);

http.listen(process.env.PORT || 3000, function(){
    console.log("listening on " + (process.env.PORT || 3000));
});

var io = require('socket.io')(http);
var hs = new HTMLSync(io, {debug:false});

// Actual user count as integer
var userCount = 0;

// The counter object that will be synced. In this case it's a <h2>-tag
var counter = new HTMLSync.Part("h2");

// Setting up the default attributes of the element
counter.attr({
    innerHTML: userCount,
    className: "user-counter"
});

// This tells HTML-Sync where to add the object on the website
counter.parent = "wrapper";
counter.room = "/";

// Finally add the object to all clients
HTMLSync.add(counter);

io.on("connection", function(socket){
    console.log("A user connected");
    userCount += 1;
    console.log(userCount);
    counter.update({
        attr:{
            innerHTML: userCount.toString()
        }
    });

    socket.on("disconnect", function(){
        userCount -= 1;
        console.log(userCount);
        counter.update({
            attr:{
                innerHTML: userCount.toString()
            }
        });
    });
});
