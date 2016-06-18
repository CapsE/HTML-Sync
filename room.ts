/**
 * Created by Lars on 22.02.2016.
 */

declare var require;
declare var module;

/**
 * Stores Parts and Syncables for a specific group of clients
 */
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

    /**
     * Adds a new Part to the Room
     */
    add(part:Part){
        this.forms[part.id] = part.toJSON();
    }

    /**
     * Returns a JSON-Object of this room to be stored in a database
     */
    toJSON(){
        return {
            updates: this.updates,
            forms: this.forms,
            data: this.data,
            id: this.roomId
        }
    }

    /**
     * Checks if this room contains any Parts or Syncables
     */
    hasParts(){
        if(Object.keys(this.forms).length == 0){
            return false;
        }else{
            return true;
        }
    }
}

module.exports = Room;
