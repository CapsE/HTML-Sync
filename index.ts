/**
 * Created by Lars on 22.02.2016.
 */

/// <reference path="./js/typings/socket.io.d.ts"/>

declare var module;
declare var require;

var EventEmitter = require("events");

interface SocketIO{
    on(name:string, callback:any);
    join(room:string);
    roomId:string;
    emit(name:string, data:any);
    broadcast(name:string, data:any);
}

interface IO{
    sockets;
}

class HTMLSync extends EventEmitter{

    static instance:HTMLSync;
    static Room  = require("./room");
    static Part = require("./part");
    static rooms = {};
    static params = {};
    static parts = {};
    static io;
    static socket;

    constructor(io:IO, params?){
        if(!HTMLSync.instance) {
            HTMLSync.instance = this;
            HTMLSync.io = io;

            HTMLSync.rooms = {};
            HTMLSync.parts = {};
        }
        if(params) {
            HTMLSync.params = params;
        }else {
            HTMLSync.params = {};
        }
        return this;
    }

    static setSocket(socket:SocketIO){
        HTMLSync.socket = socket;
        socket.on('update', function(msg){
            HTMLSync.instance.emit("update", msg, socket);
            if(HTMLSync.params.debug){
                console.log("update", msg);
            }
            HTMLSync.updateForm(msg);
            socket.broadcast.emit('update', msg);
        });

        socket.on('add', function(msg){
            HTMLSync.instance.emit("add", msg, socket);
            if(HTMLSync.params.debug){
                console.log("add", msg);
            }
            HTMLSync.getRoom(msg.roomId, function(room){
                room.forms[msg.id] = msg;
                HTMLSync.io.sockets.in(msg.roomId).emit('add', msg);
            });
        });

        socket.on('delete', function(msg){
            HTMLSync.instance.emit("delete", msg, socket);
            if(HTMLSync.params.debug){
                console.log("delete", msg);
            }
            HTMLSync.getRoom(msg.roomId, function(room){
                delete room.forms[msg.id];
                delete room.updates[msg.id];
            });
            HTMLSync.io.sockets.in(msg.roomId).emit('delete', msg);
        });

        socket.on("join", function(msg){
            HTMLSync.instance.emit("join", msg, socket);
            if(HTMLSync.params.debug){
                console.log("join", msg);
            }
            var roomId = msg["room"];
            if(!roomId){
                roomId = "/";
            }
            socket.join(roomId);
            socket.roomId = roomId;

            var room = HTMLSync.getRoom(roomId);
            var forms = Object.keys(room.forms);
            for(var i = 0; i < forms.length; i++){
                socket.emit("add", room.forms[forms[i]]);
            }
            var updates = Object.keys(room.updates);
            for(var i = 0; i < updates.length; i++){
                socket.emit("update", room.updates[updates[i]]);
            }
        });
    }

    static update(msg){
        HTMLSync.updateForm(msg);
        HTMLSync.io.sockets.in(msg.roomId).emit('update', msg);
    }

    static add(part:Part){
        var room;
        if(part.room){
            room = part.room;
        }else{
            room = "/";
            part.room = room;
        }
        HTMLSync.parts[part.id] = part;

        var room = HTMLSync.getRoom(room);
        room.add(part);
    }

    static getRoom(roomId:string, callback?:(room) => any) {
        var out;
        var isCalled = false;
        if(HTMLSync.rooms[roomId]) {
            out = HTMLSync.rooms[roomId];
        }else {
            if(!HTMLSync.params.db) {
                out = new HTMLSync.Room(roomId);
                HTMLSync.rooms[roomId] = out;
            }
        }

        if(!isCalled && callback) {
            callback(out);
        }else {
            return out;
        }
    }

    static roomExists(roomId:string){
        if(HTMLSync.rooms[roomId]) {
            return true;
        }else{
            return false;
        }
    }

    static updateForm(fields:UpdateData){
        HTMLSync.getRoom(fields.roomId, function(room){
            var obj = room.forms[fields.id];
            if(obj){
                for(var i in fields.style){
                    eval("obj.style." + i + " = \"" + fields.style[i] + "\"");
                }

                for(var i in fields.attributes){
                    eval("obj.attributes." + i + " = \"" + fields.attributes[i] + "\"");
                }

                for(var i in fields.attr){
                    eval("obj.attributes." + i + " = \"" + fields.attr[i] + "\"");
                }

                for(var i in fields.data){
                    eval("obj.data." + i + " = \"" + fields.data[i] + "\"");
                }

                for(var i in fields.functions){
                    eval("obj.functions['" + i + "'] = " + fields.functions[i] + " )");
                }

                for(var i in fields.calls){
                    var name = fields.calls[i].name;
                    var detail = fields.calls[i].detail;
                    if(obj.functions[i]){
                        for(var f in obj.functions[i]){
                            var func = eval(obj.functions[i][f]);
                            func(detail);
                        }
                    }
                }
                room.forms[fields.id] = obj;
            }else{
                var obj = room.updates[fields.id]
                if(obj){
                    for(var k in fields){
                        obj[k] = fields[k];
                    }
                    room.updates[fields.id] = obj;
                }else{
                    room.updates[fields.id] = fields;
                }

            }
        });
    }
}

module.exports = HTMLSync;