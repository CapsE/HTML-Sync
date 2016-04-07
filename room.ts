/**
 * Created by Lars on 22.02.2016.
 */

declare var require;
declare var module;

namespace HTMLSync{
    export class Room{

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
    }
}



