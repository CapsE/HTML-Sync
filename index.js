/**
 * Created by Lars on 22.02.2016.
 */
/// <reference path="./js/typings/socket.io.d.ts"/>
/// <reference path="part.ts"/>
/// <reference path="room.ts"/>
var ex = function (io) {
    var HTMLSync;
    (function (HTMLSync) {
        HTMLSync.rooms = {};
        HTMLSync.params = {
            debug: false,
            db: ""
        };
        HTMLSync.parts = {};
        function setSocket(socket) {
            socket.on('update', function (msg) {
                if (HTMLSync.params.debug) {
                    console.log("update", msg);
                }
                updateForm(msg);
                io.sockets.in(msg.roomId).emit('update', msg);
            });
            socket.on('add', function (msg) {
                if (HTMLSync.params.debug) {
                    console.log("add", msg);
                }
                HTMLSync.getRoom(msg.roomId, function (room) {
                    room.forms[msg.id] = msg;
                    io.sockets.in(msg.roomId).emit('add', msg);
                });
            });
            socket.on('delete', function (msg) {
                if (HTMLSync.params.debug) {
                    console.log("delete", msg);
                }
                getRoom(msg.roomId, function (room) {
                    delete room.forms[msg.id];
                    delete room.updates[msg.id];
                });
                io.sockets.in(msg.roomId).emit('delete', msg);
            });
            socket.on("join", function (msg) {
                if (HTMLSync.params.debug) {
                    console.log("join", msg);
                }
                var roomId = msg["room"];
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
        }
        HTMLSync.setSocket = setSocket;
        function update(msg) {
            updateForm(msg);
            io.sockets.in(msg.roomId).emit('update', msg);
        }
        HTMLSync.update = update;
        function add(element) {
            var msg = element.toJSON();
            if (HTMLSync.params.debug) {
                console.log("add", msg);
            }
            if (!msg.roomId) {
                msg.roomId = "/";
            }
            HTMLSync.getRoom(msg.roomId, function (room) {
                room.forms[msg.id] = msg;
                io.sockets.in(msg.roomId).emit('add', msg);
            });
            return element;
        }
        HTMLSync.add = add;
        function getRoom(roomId, callback) {
            var out;
            var isCalled = false;
            if (HTMLSync.rooms[roomId]) {
                out = HTMLSync.rooms[roomId];
            }
            else {
                if (!HTMLSync.params.db) {
                    out = new Room(roomId);
                    HTMLSync.rooms[roomId] = out;
                }
            }
            if (!isCalled && callback) {
                callback(out);
            }
            else {
                return out;
            }
        }
        HTMLSync.getRoom = getRoom;
        function updateForm(fields) {
            getRoom(fields.roomId, function (room) {
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
        }
        HTMLSync.updateForm = updateForm;
    })(HTMLSync || (HTMLSync = {}));
    ;
    module.exports = {
        HTMLSync: HTMLSync,
        Part: Part
    };
};
//# sourceMappingURL=index.js.map