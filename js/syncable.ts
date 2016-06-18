/**
 * Created by Lars on 16.04.2016.
 */

/// <reference path="html-sync.ts"/>

interface UpdateData {
    data?: any;
    functions?: any;
    calls?:[any];
}

function debug(msg){
    if(HTMLSync.params.debug){
        console.log(msg);
    }
}

/**
 * Represents a verry basic Object that can be synchronised.
 */
class Syncable{
    id:string;
    name:string;
    static counter:number = 0;
    data: any = {};
    functions: any = {};
    handlers:any = {};
    locked:any = false;

    constructor(json?:any){
        if(json){
            if(!json.id || json.id == ""){
                var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                this.id = randLetter + Syncable.counter.toString() +  Date.now();
                Syncable.counter++;
            }else{
                this.id = json.id;
            }

            this.functions = json.functions;
            this.handlers = json.handlers;
            this.data = json.data;
            if(!this.data.locked){
                this.data.locked = false;
            }
        }else{
            var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            this.id = randLetter + Syncable.counter.toString() +  Date.now();
            Syncable.counter++;
        }

    }

    /**
     * Changes the ID of this Part and updates child-parts accordingly
     */
    changeId(id:string, mainId?:string){
        var updated = false;
        if(!mainId){
            updated = true;
            mainId = this.id;
        }

        for(var c in this.content){
            c = this.content[c];
            var split = c.id.split("_");
            if(split[0] == mainId){
                updated = true;
                c.id = id + "_" + split[1];
            }
            c.changeId(id, mainId);
        }
        if(updated){
            for(var f in this.functions){
                for(var x in this.functions[f]){
                    console.debug("Changing function " + x + " of all " + f + " functions for Object " + this.id);
                    console.debug("Replacing " + mainId + " with " + id);
                    var re = new RegExp(mainId, 'g');
                    this.functions[f][x] = this.functions[f][x].replace(re, id);
                }
            }
        }

        if(this.id == mainId) this.id = id;
    }

    /**
     * Finds the HTML-Element and applies all attributes, styles and functions again with the current state.
     */
    update(fields?:UpdateData, send?:boolean){
        if(!fields.key){
            fields.key = HTMLSync.socket.id;
        }
        if(this.locked && this.locked != fields.key){
            debug("This Part is locked");
            return;
        }
        if(typeof(send) === "undefined"){
            send = true;
        }
        if(!fields){
            this.renderHTML();
        }else{
            debug("Applying Updates");
            var element = document.getElementById(this.id);
            var $element = $("#" + this.id);
            if(!element){
                return false;
            }
            for(var i in fields.style){
                eval("this.style." + i + " = \"" + fields.style[i] + "\"");
                eval("element.style." + i + " = \"" + fields.style[i] + "\"");
            }

            for(var i in fields.attributes){
                eval("this.attributes." + i + " = \"" + fields.attributes[i] + "\"");
                eval("element." + i + " = \"" + fields.attributes[i] + "\"");
            }

            for(var i in fields.attr){
                eval("this.attributes." + i + " = \"" + fields.attr[i] + "\"");
                eval("element." + i + " = \"" + fields.attr[i] + "\"");
            }

            for(var i in fields.data){
                eval("this.data." + i + " = \"" + fields.data[i] + "\"");
                eval("element.dataset." + i + " = \"" + fields.data[i] + "\"");
            }

            for(var i in fields.functions){
                eval("this.functions['" + i + "'] = " + this.prepareFunction(fields.functions[i]) + " )");
                eval("element.addEventListener('" + i + "', " + this.prepareFunction(fields.functions[i]) + " )");
            }

            for(var i in fields.calls){
                if(this.html){
                    var event = new CustomEvent(fields.calls[i].name, {detail: fields.calls[i].detail});
                    this.html().dispatchEvent(event);
                }else{
                    var name = fields.calls[i].name;
                    var detail = fields.calls[i].detail;
                    if(this.functions[i]){
                        for(var f in this.functions[i]){
                            var func = eval(this.functions[i][f]);
                            func(detail);
                        }
                    }
                }
            }
            if(!this.locked && fields.locked){
                debug("Locking Part");
                this.locked = fields.locked;
                if(fields.locked != HTMLSync.socket.id){
                    $element.addClass("sync-locked");
                    fields.attributes = $element.attr("class");
                    this.call("locked", fields.locked);
                }
            }

            if(this.locked && fields.locked == false){
                debug("Unlocking Part");
                this.locked = false;
                if(this.locked != HTMLSync.socket.id ){
                    $element.removeClass("sync-locked");
                    fields.attributes = $element.attr("class");
                    this.call("unlocked");
                }

            }
        }
        if(this.locked){
            fields.key = HTMLSync.socket.id;
        }
        if(send != false){
            debug("Sending Update");
            fields.id = this.id;
            fields.roomId = HTMLSync.room;
            fields.attributes = fields.attr;
            HTMLSync.update(fields);
        }
        this.raiseEvent("updated", {}, true, true);
    }

    /**
     * Convertes this Object to a JSON which is ready to be synchronized with other clients.
     * @returns {{id: string, type: string, content: Array, style: any, attributes: any, functions: any}}
     */
    toJSON(){
        var stringFunctions = this.functions;
        for(var i in this.functions){
            for(var x =0, y = this.functions[i].length; x < y; x++){
                stringFunctions[i][x] = this.functions[i][x].toString();
            }
        }
        var json = {
            id: this.id,
            functions: stringFunctions,
            handlers: this.handlers,
            data: this.data,
        };
        return json;
    }

    /**
     * Alias for addEventHandler
     */
    on(attribute: string, value: any){
        this.addEventHandler(attribute, value);
    }

    /**
     * Adds an Eventhandler to this Objekt
     */
    addEventHandler(attribute: string, value: any){
        if(!this.functions[attribute]){
            this.functions[attribute] = [];
        }
        this.functions[attribute].push(value);
        this.handlers[attribute] = true;
    }

    /**
     * Prepares a function. All occurences of "this" will be replaced with parts[this.id] which accesses the same Object
     * as this would but makes sure that the object will be found at runtime.
     */
    prepareFunction(func){
        var f = func.toString();
        var m;
        while(m = /this/.exec(f)){
            f = f.replace(m, "HTMLSync.parts['" + this.id + "']");
        }

        return f;
    }

    /**
     * Calls the given event with the given parameter can return results of this call.
     */
    call(func, e){
        var result = [];
        var func = this.functions[func];
        if(func){
            for(var i=0, y = func.length; i < y; i++){
                result.push(_.bind(func[i], this)(e));
            }
        }
        return result;
    }

    /**
     * Removes this Object, its children and all intervals that might still be running within it.
     */
    kill(){
        for(var x = 0; x < this.content.length; x++){
            this.content[x].kill();
        }
        for(var i = 0; i < this.intervals.length; i++){
            console.debug("Clearing interval" + this.intervals[i]);
            clearInterval(this.intervals[i]);
        }
    }

    /**
     * Locks the Object so only the current Client may update it.
     */
    lock(){
        var fields = {
            id: this.id,
            roomId: HTMLSync.room,
            locked: HTMLSync.socket.id,
        };
        HTMLSync.update(fields);
    }

    /**
     * Unlocks the Object so everybody may update it.
     */
    unlock(){
        var fields = {
            id: this.id,
            roomId: HTMLSync.room,
            locked: false,
        };
        HTMLSync.update(fields);
    }
}

if(typeof(module) !== "undefined"){
    module.exports = Syncable;
}
