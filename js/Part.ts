/**
 * Created by Lars on 31.08.2015.
 */

/// <reference path="./typings/lib.dom.d.ts"/>
/// <reference path="html-sync.ts"/>

interface UpdateData {
    style?: any;
    attributes?: any;
    data?: any;
    functions?: any;
    calls?:[any];
}

/**
 * Base Class for the synchronized working. Represents more or less a HTML-Tag.
 */
class Part{
    id:string;
    name:string;
    static counter:number = 0;
    type:string;
    namespace:string;
    content:Part[] = [];
    style: any = {};
    attributes: any = {};
    data: any = {};
    functions: any = {};
    handlers: any = {};
    static includes: string[] = [];
    static includesToLoad: number = 0;
    parent:Part;
    intervals:any[] = [];

    /**
     * Create either with just a type like "div" or with a hash-map with all relevant fields set.
     */
    constructor(type:string, json?:any){
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
        HTMLSync.parts[this.id] = this;
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

    on(attribute: string, value: any){
        this.addEventHandler(attribute, value);
    }

    addEventHandler(attribute: string, value: any){
        if(!this.functions[attribute]){
            this.functions[attribute] = [];
        }
        this.functions[attribute].push(value);
        this.handlers[attribute] = true;
    }

    addInclude(incl: string){
        Part.includes.push(incl);
    }

    includeLoaded(){
        Part.includesToLoad -= 1;
        if(Part.includesToLoad <= 0){
            var event = new CustomEvent("ready", { "detail": "", "id": this.id });
            this.html().dispatchEvent(event);
        }
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
     * Can find a Child-part by name. Parts don't need to have names so it's likely to return undefined
     */
    find(name:string):Part{
        for(var c in this.content){
            if(this.content[c].name == name){
                return this.content[c];
            }
        }
    }

    /**
     * Raises an Event on the DOM-Element of this part. If checkParents is true it will raise the event on the first Parent that supports it.
     * returns true if an eventhandler was found and false if not.
     *
     * @param name
     * @param data
     * @param checkParents
     * @returns {boolean}
     */
    raiseEvent(name:string, data:any, checkParents?:boolean, raiseAll?:boolean){
        if(!checkParents){
            var event = new CustomEvent(name, {detail: data});
            this.html().dispatchEvent(event);
            if(!(name in this.functions)){
                return false;
            }else{
                return true;
            }
        }else{
            var event =  new CustomEvent(name, {detail: data});
            var p = this;
            if(!raiseAll){
                while(p.parent && !(name in p.functions)){
                    p = p.parent;
                }
                p.html().dispatchEvent(event);
                if(!(name in p.functions)){
                    return false;
                }else{
                    return true;
                }
            }else{
                p.html().dispatchEvent(event);
                while(p.parent){
                    p = p.parent;
                    p.html().dispatchEvent(event);
                }
            }

        }
    }

    /**
     * Sets an interval within this classes context or another given context.
     * @param func
     * @param millis
     * @param scope
     * @returns {number|NodeJS.Timer}
     */
    setScopedInterval(func, millis:number, scope?) {
        if(!scope){
            scope = this;
        }
        var interval = setInterval(function () {
            func.apply(scope);
        }, millis);
        this.intervals.push(interval);
        console.debug(this.intervals);
        return interval;
    }

    /**
     * Finds the HTML-Elment representing this object in the DOM.
     * @returns {HTMLElement}
     */
    html(){
        return document.getElementById(this.id);
    }

    /**
     * Returns a string that when passed to eval() returns the object.
     * @returns {String}
     */
    pointer() :string {
        return "HTMLSync.parts['" + this.id + "']";
    }

    /**
     * Finds the HTML-Element and applies all attributes, styles and functions again with the current state.
     */
    update(fields?:UpdateData, send?:boolean){
        if(send === "undefined"){
            send = true;
        }
        if(!fields){
            this.renderHTML();
        }else if(!send){
            var element = document.getElementById(this.id);
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

            for(var i in fields.data){
                eval("this.data." + i + " = \"" + fields.data[i] + "\"");
                eval("element.dataset." + i + " = \"" + fields.data[i] + "\"");
            }

            for(var i in fields.functions){
                console.debug(fields.functions[i]);
                eval("this.functions['" + i + "'] = " + this.prepareFunction(fields.functions[i]) + " )");
                eval("element.addEventListener('" + i + "', " + this.prepareFunction(fields.functions[i]) + " )");
            }

            for(var i in fields.calls){
                var event = new CustomEvent(fields.calls[i].name, {detail: fields.calls[i].detail});
                this.html().dispatchEvent(event);
            }
        }
        if(send){
            fields.id = this.id;
            fields.roomId = HTMLSync.room;
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
        var json = {id: this.id, type: this.type, namespace: this.namespace, content: [], style: this.style, attributes: this.attributes, functions: stringFunctions, handlers: this.handlers, data: this.data, includes: Part.includes};
        for(var p in this.content){
            json.content.push(this.content[p].toJSON());
        }
        return json;
    }

    /**
     * Creates a HTML-Tree and adds it to either target or "desktop" when no target is given
     */
    renderHTML(target?:any){
        if(!target){
            target = document.body;
        }
        var newElement;
        if(document.getElementById(this.id)){
            newElement = document.getElementById(this.id);
        }else {
            if(!this.namespace){
                newElement = document.createElement(this.type);
            }else{
                newElement = document.createElementNS(this.namespace, this.type);
            }

        }
        newElement.id = this.id;

        for(var i in this.style){
            eval("newElement.style." + i + " = \"" + this.style[i] + "\"");
        }

        for(var i in this.attributes){
            if(this.namespace == "http://www.w3.org/2000/svg"){
                newElement.setAttribute(i, this.attributes[i]);
            }else{
                eval("newElement." + i + " = \"" + this.attributes[i] + "\"");
            }
        }

        for(var i in this.functions){
            for(var x =0, y = this.functions[i].length; x < y; x++){
                console.log("this.functions['" + i + "'][" + x + "] = " + this.functions[i][x] );
                eval("this.functions['" + i + "'][" + x + "] = " + this.functions[i][x]);
            }

            console.log(this.functions[i]);


        }

        for(var i in this.handlers){
            eval("newElement.addEventListener('" + i + "', function(e){HTMLSync.parts['" + this.id +"'].call('"+ i + "',e);})");
        }

        for(var i in Part.includes){
            if(Part.includes.indexOf(Part.includes[i]) == -1){
                console.debug("Including " + Part.includes[i]);
                Part.includesToLoad++;
                Part.includes.push(Part.includes[i]);
                var imported;
                if(endsWith(Part.includes[i], ".js")){
                    imported = document.createElement('script');
                    imported.src = Part.includes[i];
                }else if(endsWith(Part.includes[i], ".css")){
                    imported = document.createElement('link');
                    imported.href = Part.includes[i];
                    imported.type = "text/css";
                    imported.rel = "stylesheet";
                }else{
                    console.debug("Couldn't load " + Part.includes[i]);
                    continue;
                }

                imported.dataset.id = this.id;
                imported.addEventListener("load", function(e){
                    HTMLSync.parts[this.dataset.id].includeLoaded();
                });
                document.head.appendChild(imported);
            }else{
                newElement.addEventListener("added", function(e) {
                    HTMLSync.parts[this.id].includeLoaded();
                });
            }
        }

        for(var i in this.content){
            this.content[i].renderHTML(newElement);
        }

        var event = new CustomEvent("added", { "detail": "", "id": this.id });

        target.appendChild(newElement);
        // Dispatch/Trigger/Fire the event
        newElement.dispatchEvent(event);
    }

    changeId(id:string, mainId?:string){
        var updated = false;
        if(!mainId){
            console.debug("Main ID is " + this.id);
            updated = true;
            mainId = this.id;
        }

        for(var c in this.content){
            c = this.content[c];
            var split = c.id.split("_");
            if(split[0] == mainId){
                console.debug(c.id + " needs update");
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

    kill(){
        for(var x = 0; x < this.content.length; x++){
            this.content[x].kill();
        }
        for(var i = 0; i < this.intervals.length; i++){
            console.debug("Clearing interval" + this.intervals[i]);
            clearInterval(this.intervals[i]);
        }
    }
}