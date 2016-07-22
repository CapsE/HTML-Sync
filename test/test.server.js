/**
 * Created by Lars on 16.07.2016.
 */

var assert = require('chai').assert;
var express = require('express');
var HTMLSync = require('../index');

var app = express();

var http = require('http').createServer(app);

http.listen(process.env.PORT || 3000, function(){
    console.log("listening on " + (process.env.PORT || 3000));
});

var io = require('socket.io')(http);
var hs = new HTMLSync(io, {debug:false});

describe('Class signatures', function(){
    describe('HTMLSync', function(){
        it('HTMLSync classes are defined', function(){
            assert.isDefined(HTMLSync.Syncable, 'Syncable undefined');
            assert.isDefined(HTMLSync.Part, 'Part undefined');
            assert.isDefined(HTMLSync.Room, 'Room undefined');
        });
        it('HTMLSync functions are defined', function(){
            assert.isDefined(HTMLSync.setSocket, 'setSocket undefined');
            assert.isDefined(HTMLSync.update, 'update undefined');
            assert.isDefined(HTMLSync.add, 'add undefined');
            assert.isDefined(HTMLSync.getRoom, 'getRoom undefined');
            assert.isDefined(HTMLSync.addRoom, 'addRoom undefined');
            assert.isDefined(HTMLSync.roomExists, 'roomExists undefined');
            assert.isDefined(HTMLSync.updateForm, 'updateForm undefined');
        });
        it('HTMLSync variables are defined', function(){
            assert.isDefined(HTMLSync.rooms, 'rooms undefined');
            assert.isDefined(HTMLSync.params, 'params undefined');
            assert.isDefined(HTMLSync.parts, 'parts undefined');
        });
    });

    describe('Syncable', function(){
        it('Syncable empty constructor', function(){
            var syncable = new HTMLSync.Syncable();
            assert.isDefined(syncable.data, 'data array not okay');
            assert.isDefined(syncable.functions, 'functions array not okay');
            assert.isDefined(syncable.handlers, 'handlers array not okay');
            assert.equal(syncable.locked, false, 'locked var not okay');
            assert.isDefined(syncable.id, 'ID not generated');
        });
        it('Syncable constructor', function(){
            var syncable = new HTMLSync.Syncable({
                data:{test:"abc"},
                id:"TestID"
            });
            assert.equal(syncable.data.test, "abc", 'data array not okay');
            assert.equal(syncable.id, "TestID", 'ID not okay');
        });
        it('Syncable functions are defined', function(){
            var syncable = new HTMLSync.Syncable();
            assert.isDefined(syncable.changeId, 'changeId undefined');
            assert.isDefined(syncable.update, 'update undefined');
            assert.isDefined(syncable.toJSON, 'toJSON undefined');
            assert.isDefined(syncable.on, 'on undefined');
            assert.isDefined(syncable.addEventHandler, 'addEventHandler undefined');
            assert.isDefined(syncable.prepareFunction, 'prepareFunction undefined');
            assert.isDefined(syncable.call, 'call undefined');
            assert.isDefined(syncable.kill, 'kill undefined');
            assert.isDefined(syncable.lock, 'lock undefined');
            assert.isDefined(syncable.unlock, 'unlock undefined');
        });
    });

    describe('Part', function(){
        it('Syncable functions are defined (inherited)', function(){
            var syncable = new HTMLSync.Part();
            assert.isDefined(syncable.changeId, 'changeId undefined');
            assert.isDefined(syncable.update, 'update undefined');
            assert.isDefined(syncable.toJSON, 'toJSON undefined');
            assert.isDefined(syncable.on, 'on undefined');
            assert.isDefined(syncable.addEventHandler, 'addEventHandler undefined');
            assert.isDefined(syncable.prepareFunction, 'prepareFunction undefined');
            assert.isDefined(syncable.call, 'call undefined');
            assert.isDefined(syncable.kill, 'kill undefined');
            assert.isDefined(syncable.lock, 'lock undefined');
            assert.isDefined(syncable.unlock, 'unlock undefined');
        });
        it('Part normal constructor', function(){
            var part = new HTMLSync.Part("div");
            assert.equal(part.type, "div", 'type not okay');
        });
        it('Part JSON constructor', function(){
            var part = new HTMLSync.Part("img",{
                data:{test:"abc"},
                id:"TestID",
                style:{color:"red"},
                attributes:{src:"img.png"}
            });
            assert.equal(part.data.test, "abc", 'data array not okay');
            assert.equal(part.style.color, "red", 'style array not okay');
            assert.equal(part.attributes.src, "img.png", 'attribute array not okay');
            assert.equal(part.id, "TestID", 'ID not okay');
        });
        it('Part functions are defined', function(){
            var part = new HTMLSync.Part("div");
            assert.isDefined(part.addChild, 'addChild undefined');
            assert.isDefined(part.css, 'css undefined');
            assert.isDefined(part.setStyle, 'setStyle undefined');
            assert.isDefined(part.setStyles, 'setStyles undefined');
            assert.isDefined(part.attr, 'attr undefined');
            assert.isDefined(part.setAttribute, 'setAttribute undefined');
            assert.isDefined(part.setAttributes, 'setAttributes undefined');
            assert.isDefined(part.addInclude, 'addInclude undefined');
            assert.isDefined(part.toJSON, 'toJSON undefined');
        });
    });

    describe('Room', function(){
        it('Room constructor', function(){
            var room = new HTMLSync.Room("Test");
            assert.equal(room.roomId, "Test", 'name not okay');
            assert.isDefined(room.updates, 'updates array not okay');
            assert.isDefined(room.forms, 'forms array not okay');
            assert.isDefined(room.data, 'data array not okay');
        });
        it('Room functions are defined', function(){
            var room = new HTMLSync.Room("Test");
            assert.isDefined(room.add, 'add undefined');
            assert.isDefined(room.hasParts, 'hasParts undefined');
            assert.isDefined(room.toJSON, 'toJSON undefined');
        });
    });
});


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
