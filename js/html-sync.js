/**
 * Created by Lars on 31.08.2015.
 */
/// <reference path="./typings/socket.io.d.ts"/>
/// <reference path="part.ts"/>
var HTMLSync = (function () {
    function HTMLSync(params) {
        if (!HTMLSync.instance) {
            HTMLSync.instance = this;
        }
        if (!params) {
            params = {};
        }
        HTMLSync.params = params;
        if (!HTMLSync.socket) {
            if (params.url) {
                HTMLSync.socket = io.connect(params.url);
            }
            else {
                HTMLSync.socket = io.connect();
            }
        }
        if (params.room) {
            HTMLSync.room = params.room;
        }
        else {
            HTMLSync.room = "/";
        }
        HTMLSync.socket.emit("join", { room: this.room });
        if (!HTMLSync.parts) {
            HTMLSync.parts = {};
        }
        HTMLSync.socket.on("update", function (msg) {
            if (HTMLSync.params.debug) {
                console.log("update", msg);
            }
            if (HTMLSync.parts[msg.id]) {
                HTMLSync.parts[msg.id].update(msg, false);
            }
        });
        HTMLSync.socket.on("add", function (msg) {
            if (HTMLSync.params.debug) {
                console.log("add", msg);
            }
            var p = new Part("", msg);
            if (!msg.parent) {
                p.renderHTML();
            }
            else {
                p.renderHTML(document.getElementById(msg.parent));
                if (HTMLSync.parts[msg.parent]) {
                    HTMLSync.parts[msg.parent].addChild(p);
                }
            }
            HTMLSync.parts[p.id] = p;
            //p.raiseEvent("added", { "detail": "", "id": this.id });
        });
        HTMLSync.socket.on("delete", function (msg) {
            if (HTMLSync.params.debug) {
                console.log("delete", msg);
            }
            var minId = HTMLSync.parts[msg.id].data.minimizedId;
            if (minId && minId != "false") {
                var obj = document.getElementById(minId);
                HTMLSync.parts[minId].kill();
                obj.parentElement.removeChild(obj);
                delete HTMLSync.parts[minId];
            }
            var obj = document.getElementById(msg.id);
            HTMLSync.parts[msg.id].kill();
            obj.parentElement.removeChild(obj);
            delete HTMLSync.parts[msg.id];
        });
        HTMLSync.socket.on("joined", function (msg) {
            console.log(msg.id);
        });
        if (HTMLSync.params.debug) {
            console.log("Constructor", params);
            console.log("Joined", HTMLSync.room);
        }
    }
    HTMLSync.prototype.update = function (obj) {
        obj.roomId = HTMLSync.room;
        HTMLSync.socket.emit("update", obj);
    };
    HTMLSync.update = function (obj) {
        HTMLSync.instance.update(obj);
    };
    HTMLSync.prototype.add = function (obj, parent) {
        var json = obj.toJSON();
        json["roomId"] = HTMLSync.room;
        if (parent) {
            json["parent"] = parent.id;
        }
        HTMLSync.socket.emit("add", json);
        if (HTMLSync.params.debug) {
            console.log("add", json);
        }
        return obj.id;
    };
    HTMLSync.add = function (obj, parent) {
        HTMLSync.instance.add(obj, parent);
    };
    HTMLSync.prototype.deleteObj = function (id) {
        HTMLSync.socket.emit("delete", { roomId: HTMLSync.room, id: id });
    };
    HTMLSync.deleteObj = function (id) {
        HTMLSync.instance.deleteObj(id);
    };
    return HTMLSync;
})();
//# sourceMappingURL=html-sync.js.map