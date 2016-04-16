/**
 * Created by Lars on 22.02.2016.
 */
var Room = (function () {
    function Room(roomId) {
        this.roomId = roomId;
        this.updates = {};
        this.forms = {};
        this.data = {};
    }
    Room.prototype.add = function (part) {
        this.forms[part.id] = part.toJSON();
    };
    return Room;
})();
module.exports = Room;
//# sourceMappingURL=room.js.map