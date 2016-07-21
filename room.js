/**
 * Created by Lars on 22.02.2016.
 */
var Room = function (HTMLSync) {
    function Room(roomId) {
        this.roomId = roomId;
        this.updates = {};
        this.forms = {};
        this.data = {};
    }
    Room.prototype.add = function (part) {
        this.forms[part.id] = part.toJSON();
    };
    Room.prototype.toJSON = function () {
        return {
            updates: this.updates,
            forms: this.forms,
            data: this.data,
            id: this.roomId
        };
    };
    Room.prototype.hasParts = function () {
        if (Object.keys(this.forms).length == 0) {
            return false;
        }
        else {
            return true;
        }
    };
    return Room;
};
module.exports = Room;
//# sourceMappingURL=room.js.map