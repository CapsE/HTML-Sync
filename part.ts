/**
 * Created by Lars on 22.02.2016.
 */

/// <reference path="js/syncable.ts"/>

declare var require;
declare var module;

interface UpdateData {
    roomId:string;
    id:string;
}

if(require){
    var Syncable = require("./js/syncable");
}


/**
 * Base Class for the synchronized working. Represents more or less a HTML-Tag.
 */
class Part extends Syncable{
    type:string;
    namespace:string;
    room:string;
    content:Part[] = [];
    style: any = {};
    attributes: any = {};
    static includes: string[] = [];
    parent:Part;

    /**
     * Create either with just a type like "div" or with a hash-map with all relevant fields set.
     */
    constructor(type:string, json?:any){
        super();
        if(json){
            if(!json.id || json.id == ""){
                var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                this.id = randLetter + Part.counter.toString() +  Date.now();
                Part.counter++;
            }else{
                this.id = json.id;
            }
            this.type = json.type;
            this.namespace = json.namespace;
            this.content = [];
            this.style = json.style;
            this.attributes = json.attributes;
            this.functions = json.functions;
            this.data = json.data;
            Part.includes = json.includes;

            for(var p in json.content){
                this.addChild(new Part("", json.content[p]));
            }
        }else{
            var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            this.id = randLetter + Part.counter.toString() +  Date.now();
            Part.counter++;
            this.type = type;
        }
    }

    /**
     * Adds a Child-Part to this part. Also sets this Object as parent of the added child
     */
    addChild(obj:Part){
        obj.parent = this;
        this.content.push(obj);
    }

    css(attribute:string, value?:string){
        if(value){
            this.setStyle(attribute, value);
        }else{
            this.setStyles(attribute);
        }
    }

    private setStyle(attribute: string, value: string){
        this.style[attribute] = value;
    }

    private setStyles(style: any){
        for(var key in style){
            this.style[key] = style[key];
        }
    }

    attr(attribute:string, value?:string){
        if(value){
            this.setAttribute(attribute, value);
        }else{
            this.setAttributes(attribute);
        }
    }

    private setAttribute(attribute: string, value: string){
        this.attributes[attribute] = value;
    }

    private setAttributes(attribute: any){
        for(var key in attribute){
            this.attributes[key] = attribute[key];
        }
    }

    addInclude(incl: string){
        Part.includes.push(incl);
    }

    /**
     * Convertes this Object to a JSON which is ready to be synchronized with other clients.
     * @returns {{id: string, type: string, content: Array, style: any, attributes: any, functions: any}}
     */
    toJSON(){
        var json = super.toJSON();

        json.type = this.type;
        json.namespace= this.namespace;
        json.content= [];
        json.style= this.style;
        json.attributes= this.attributes;
        json.includes= Part.includes;
        if(!this.parent.toJSON){
            json.parent = this.parent;
        }

        for(var p in this.content){
            json.content.push(this.content[p].toJSON());
        }
        return json;
    }

}

module.exports = Part;