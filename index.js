/**
 * Created by Lars on 22.02.2016.
 */
/// <reference path="./js/typings/socket.io.d.ts"/>
var HTMLSync = (function () {
    function HTMLSync(io, params) {
        if (!HTMLSync.instance) {
            HTMLSync.instance = this;
            HTMLSync.io = io;
            HTMLSync.rooms = {};
            HTMLSync.parts = {};
        }
        if (params) {
            HTMLSync.params = params;
        }
        else {
            HTMLSync.params = {};
        }
        return this;
    }
    HTMLSync.setSocket = function (socket) {
        socket.on('update', function (msg) {
            if (HTMLSync.params.debug) {
                console.log("update", msg);
            }
            HTMLSync.updateForm(msg);
            HTMLSync.io.sockets.in(msg.roomId).emit('update', msg);
        });
        socket.on('add', function (msg) {
            if (HTMLSync.params.debug) {
                console.log("add", msg);
            }
            HTMLSync.getRoom(msg.roomId, function (room) {
                room.forms[msg.id] = msg;
                HTMLSync.io.sockets.in(msg.roomId).emit('add', msg);
            });
        });
        socket.on('delete', function (msg) {
            if (HTMLSync.params.debug) {
                console.log("delete", msg);
            }
            HTMLSync.getRoom(msg.roomId, function (room) {
                delete room.forms[msg.id];
                delete room.updates[msg.id];
            });
            HTMLSync.io.sockets.in(msg.roomId).emit('delete', msg);
        });
        socket.on("join", function (msg) {
            if (HTMLSync.params.debug) {
                console.log("join", msg);
            }
            var roomId = msg["room"];
            if (!roomId) {
                roomId = "/";
            }
            socket.join(roomId);
            socket.roomId = roomId;
            var room = HTMLSync.getRoom(roomId);
            var forms = Object.keys(room.forms);
            for (var i = 0; i < forms.length; i++) {
                socket.emit("add", room.forms[forms[i]]);
            }
            var updates = Object.keys(room.updates);
            for (var i = 0; i < updates.length; i++) {
                socket.emit("update", room.updates[updates[i]]);
            }
        });
    };
    HTMLSync.update = function (msg) {
        HTMLSync.updateForm(msg);
        HTMLSync.io.sockets.in(msg.roomId).emit('update', msg);
    };
    HTMLSync.add = function (part) {
        var room;
        if (part.room) {
            room = part.room;
        }
        else {
            room = "/";
            part.room = room;
        }
        HTMLSync.parts[part.id] = part;
        var room = HTMLSync.getRoom(room);
        room.add(part);
    };
    HTMLSync.getRoom = function (roomId, callback) {
        var out;
        var isCalled = false;
        if (HTMLSync.rooms[roomId]) {
            out = HTMLSync.rooms[roomId];
        }
        else {
            if (!HTMLSync.params.db) {
                out = new HTMLSync.Room(roomId);
                HTMLSync.rooms[roomId] = out;
            }
        }
        if (!isCalled && callback) {
            callback(out);
        }
        else {
            return out;
        }
    };
    HTMLSync.roomExists = function (roomId) {
        if (HTMLSync.rooms[roomId]) {
            return true;
        }
        else {
            return false;
        }
    };
    HTMLSync.updateForm = function (fields) {
        HTMLSync.getRoom(fields.roomId, function (room) {
            var obj = room.forms[fields.id];
            if (obj) {
                for (var i in fields.style) {
                    eval("obj.style." + i + " = \"" + fields.style[i] + "\"");
                }
                for (var i in fields.attributes) {
                    eval("obj." + i + " = \"" + fields.attributes[i] + "\"");
                }
                for (var i in fields.data) {
                    eval("obj.data." + i + " = \"" + fields.data[i] + "\"");
                }
                for (var i in fields.functions) {
                    eval("obj.functions['" + i + "'] = " + this.prepareFunction(fields.functions[i]) + " )");
                }
                room.forms[fields.id] = obj;
            }
            else {
                var obj = room.updates[fields.id];
                if (obj) {
                    for (var k in fields) {
                        obj[k] = fields[k];
                    }
                    room.updates[fields.id] = obj;
                }
                else {
                    room.updates[fields.id] = fields;
                }
            }
        });
    };
    HTMLSync.Room = require("./room");
    HTMLSync.Part = require("./part");
    HTMLSync.rooms = {};
    HTMLSync.params = {};
    HTMLSync.parts = {};
    return HTMLSync;
}());
module.exports = HTMLSync;
//# sourceMappingURL=index.js.map