/**
 * Created by Lars on 22.02.2016.
 */

declare var require;
declare var module;

class Room{

    updates:any;
    forms:any;
    data:any;
    roomId:string;

    constructor(roomId:string){
        this.roomId = roomId;
        this.updates = {};
        this.forms = {};
        this.data = {};
    }

    add(part:Part){
        this.forms[part.id] = part.toJSON();
    }

    toJSON(){
        return {
            updates: this.updates,
            forms: this.forms,
            data: this.data,
            id: this.roomId
        }
    }
}

module.exports = Room;
