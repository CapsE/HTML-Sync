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
    static params = {
        debug:false,
        updateLock: 500,
    };
    static parts = {};
    static io;
    static socket;

    constructor(io:IO, params?){
        super();
        if(!HTMLSync.instance) {
            HTMLSync.instance = this;
            HTMLSync.io = io;

            HTMLSync.rooms = {};
            HTMLSync.parts = {};
        }else{
            return HTMLSync.instance;
        }
        if(params) {
            for(var key in params){
                HTMLSync.params[key] = params[key];
            }
        }else {
            HTMLSync.params = {};
        }
        io.on('connection', function(socket){
            console.log('a user connected');

            HTMLSync.setSocket(socket);
        });
        return this;
    }

    /**
     * Sets up the Events needed to sync Elements to the given Socket
     */
    static setSocket(socket:SocketIO){

        HTMLSync.socket = socket;

        socket.on('update', function(msg){
            HTMLSync.instance.emit("update", msg, socket);
            if(HTMLSync.params.debug){
                console.log("update", msg);
            }
            HTMLSync.updateForm(msg, socket.id).then(function(){
                socket.broadcast.emit('update', msg);
            });
        });

        socket.on('add', function(msg){
            if(HTMLSync.params.debug){
                console.log("add", msg);
            }
            HTMLSync.getRoom(msg.roomId, true).then(function(room){
                room.forms[msg.id] = msg;
                HTMLSync.io.sockets.in(msg.roomId).emit('add', msg);
            });
        });

        socket.on('delete', function(msg){
            HTMLSync.instance.emit("delete", msg, socket);
            if(HTMLSync.params.debug){
                console.log("delete", msg);
            }
            HTMLSync.getRoom(msg.roomId).then(function(room){
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

            HTMLSync.getRoom(roomId).then(function(room){
                var forms = Object.keys(room.forms);
                for(var i = 0; i < forms.length; i++){
                    socket.emit("add", room.forms[forms[i]]);
                }
                var updates = Object.keys(room.updates);
                for(var i = 0; i < updates.length; i++){
                    socket.emit("update", room.updates[updates[i]]);
                }
            });
        });
    }

    /**
     * Applies the given updates. The target will be determined by msg.id
     */
    static update(msg){
        HTMLSync.updateForm(msg);
        HTMLSync.io.sockets.in(msg.roomId).emit('update', msg);
    }

    /**
     * Sets up the Events needed to sync Elements to the given Socket
     */
    static add(part:Part){
        var room;
        if(part.room){
            room = part.room;
        }else{
            room = "/";
            part.room = room;
        }
        HTMLSync.parts[part.id] = part;

        HTMLSync.getRoom(room, true).then(function(room){
            room.add(part);
        });

    }

    /**
     * Asynchronously loads a Room from either RAM or Database. Returns a promise.
     */
    static getRoom(roomId:string, create?:boolean) {
        return new Promise(function(success, reject){
            if(HTMLSync.rooms[roomId]) {
                success(HTMLSync.rooms[roomId]);
                return;
            }else{
                if(HTMLSync.params.db) {
                   var cursor = HTMLSync.params.db.find({roomId:roomId});
                   cursor.each(function(err, doc){
                      if(err){
                          reject(err);
                          return;
                      }else{
                          success(doc);
                          return;
                      }
                   });
                }
            }
            if(create){
                var room = new HTMLSync.Room(roomId);
                HTMLSync.rooms[roomId] = room;
                success(room);
            }else{
                reject(Error("Room not found"));
            }

        });
    }

    /**
     * Checks if the given room exists
     */
    static roomExists(roomId:string){
        if(HTMLSync.rooms[roomId]) {
            return true;
        }else{
            return false;
        }
    }

    /**
     * Internal update function
     */
    static updateForm(fields:UpdateData, key?:SocketIO){
        return new Promise(function(resolve, reject){
            HTMLSync.getRoom(fields.roomId).then(function(room){
                var obj = room.forms[fields.id];
                if(obj){
                    if(key){
                        if(obj.key && key != obj.key){
                            reject();
                            return;
                        }
                    }

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
                    obj = room.updates[fields.id];
                    if(obj){
                        for(var k in fields){
                            obj[k] = fields[k];
                        }
                        room.updates[fields.id] = obj;
                    }else{
                        room.updates[fields.id] = fields;
                    }

                }
                room.forms[fields.id].key = key;
                if(!room.forms[fields.id].keyTimeout){
                    room.forms[fields.id].keyTimeout = setTimeout(function resetKey(){
                        delete room.forms[fields.id].key;
                        delete room.forms[fields.id].keyTimeout;
                    }, HTMLSync.params.updateLock);
                }
                resolve();
            });
        });
    }
}

module.exports = HTMLSync;