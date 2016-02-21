/**
 * Created by Lars on 31.08.2015.
 */
/// <reference path="./typings/socket.io.d.ts"/>
/// <reference path="Part.ts"/>
var HTMLSync = (function () {
    function HTMLSync(params) {
        if (!HTMLSync.socket) {
            if (params.url) {
                HTMLSync.socket = io.connect(params.url);
            }
            else {
                HTMLSync.socket = io.connect();
            }
        }
        this.room = params.room || "/";
        if (!HTMLSync.parts) {
            HTMLSync.parts = {};
        }
        HTMLSync.socket.on("update", function (msg) {
            if (HTMLSync.parts[msg.id]) {
                HTMLSync.parts[msg.id].update(msg);
            }
        });
        HTMLSync.socket.on("add", function (msg) {
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
            console.debug("Deleting " + msg.id);
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
    }
    HTMLSync.prototype.update = function (obj) {
        obj.roomId = this.room;
        HTMLSync.socket.emit("update", obj);
    };
    HTMLSync.prototype.add = function (obj, parent) {
        var json = obj.toJSON();
        json["roomId"] = this.room;
        if (parent) {
            json["parent"] = parent.id;
        }
        HTMLSync.socket.emit("add", json);
        return obj.id;
    };
    HTMLSync.prototype.deleteObj = function (id) {
        HTMLSync.socket.emit("delete", { roomId: this.room, id: id });
    };
    return HTMLSync;
})();
//# sourceMappingURL=html-sync.js.map