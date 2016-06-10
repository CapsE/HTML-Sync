/**
 * Created by Lars on 22.02.2016.
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="./js/typings/socket.io.d.ts"/>
var EventEmitter = require("events");
var HTMLSync = (function (_super) {
    __extends(HTMLSync, _super);
    function HTMLSync(io, params) {
        _super.call(this);
        if (!HTMLSync.instance) {
            HTMLSync.instance = this;
            HTMLSync.io = io;
            HTMLSync.rooms = {};
            HTMLSync.parts = {};
        }
        if (params) {
            for (var key in params) {
                HTMLSync.params[key] = params[key];
            }
        }
        else {
            HTMLSync.params = {};
        }
        return this;
    }
    HTMLSync.setSocket = function (socket) {
        HTMLSync.socket = socket;
        socket.on('update', function (msg) {
            HTMLSync.instance.emit("update", msg, socket);
            if (HTMLSync.params.debug) {
                console.log("update", msg);
            }
            HTMLSync.updateForm(msg, socket.id).then(function () {
                socket.broadcast.emit('update', msg);
            });
        });
        socket.on('add', function (msg) {
            HTMLSync.instance.emit("add", msg, socket);
            if (HTMLSync.params.debug) {
                console.log("add", msg);
            }
            HTMLSync.getRoom(msg.roomId, function (room) {
                room.forms[msg.id] = msg;
                HTMLSync.io.sockets.in(msg.roomId).emit('add', msg);
            });
        });
        socket.on('delete', function (msg) {
            HTMLSync.instance.emit("delete", msg, socket);
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
            HTMLSync.instance.emit("join", msg, socket);
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
    HTMLSync.updateForm = function (fields, key) {
        return new Promise(function (resolve, reject) {
            HTMLSync.getRoom(fields.roomId, function (room) {
                var obj = room.forms[fields.id];
                if (obj) {
                    if (key) {
                        if (obj.key && key != obj.key) {
                            reject();
                            return;
                        }
                    }
                    for (var i in fields.style) {
                        eval("obj.style." + i + " = \"" + fields.style[i] + "\"");
                    }
                    for (var i in fields.attributes) {
                        eval("obj.attributes." + i + " = \"" + fields.attributes[i] + "\"");
                    }
                    for (var i in fields.attr) {
                        eval("obj.attributes." + i + " = \"" + fields.attr[i] + "\"");
                    }
                    for (var i in fields.data) {
                        eval("obj.data." + i + " = \"" + fields.data[i] + "\"");
                    }
                    for (var i in fields.functions) {
                        eval("obj.functions['" + i + "'] = " + fields.functions[i] + " )");
                    }
                    for (var i in fields.calls) {
                        var name = fields.calls[i].name;
                        var detail = fields.calls[i].detail;
                        if (obj.functions[i]) {
                            for (var f in obj.functions[i]) {
                                var func = eval(obj.functions[i][f]);
                                func(detail);
                            }
                        }
                    }
                    room.forms[fields.id] = obj;
                }
                else {
                    obj = room.updates[fields.id];
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
                room.forms[fields.id].key = key;
                if (!room.forms[fields.id].keyTimeout) {
                    room.forms[fields.id].keyTimeout = setTimeout(function resetKey() {
                        delete room.forms[fields.id].key;
                        delete room.forms[fields.id].keyTimeout;
                    }, HTMLSync.params.updateLock);
                }
                resolve();
            });
        });
    };
    HTMLSync.Room = require("./room");
    HTMLSync.Part = require("./part");
    HTMLSync.rooms = {};
    HTMLSync.params = {
        debug: false,
        updateLock: 500
    };
    HTMLSync.parts = {};
    return HTMLSync;
}(EventEmitter));
module.exports = HTMLSync;
//# sourceMappingURL=index.js.map