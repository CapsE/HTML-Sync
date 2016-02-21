/**
 * Created by Lars on 31.08.2015.
 */
/// <reference path="./typings/lib.dom.d.ts"/>
/// <reference path="html-sync.ts"/>
/**
 * Base Class for the synchronized working. Represents more or less a HTML-Tag.
 */
var Part = (function () {
    /**
     * Create either with just a type like "div" or with a hash-map with all relevant fields set.
     */
    function Part(type, json) {
        this.content = [];
        this.style = {};
        this.attributes = {};
        this.data = {};
        this.functions = {};
        this.intervals = [];
        if (json) {
            if (!json.id || json.id == "") {
                var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                this.id = randLetter + Part.counter.toString() + Date.now();
                Part.counter++;
            }
            else {
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
            for (var p in json.content) {
                this.addChild(new Part("", json.content[p]));
            }
        }
        else {
            var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            this.id = randLetter + Part.counter.toString() + Date.now();
            Part.counter++;
            this.type = type;
        }
        HTMLSync.parts[this.id] = this;
    }
    /**
     * Adds a Child-Part to this part. Also sets this Object as parent of the added child
     */
    Part.prototype.addChild = function (obj) {
        obj.parent = this;
        this.content.push(obj);
    };
    Part.prototype.setStyle = function (attribute, value) {
        this.style[attribute] = value;
    };
    Part.prototype.setStyles = function (style) {
        for (var key in style) {
            this.style[key] = style[key];
        }
    };
    Part.prototype.setAttribute = function (attribute, value) {
        this.attributes[attribute] = value;
    };
    Part.prototype.setAttributes = function (attribute) {
        for (var key in attribute) {
            this.attributes[key] = attribute[key];
        }
    };
    Part.prototype.setEventHandler = function (attribute, value) {
        this.functions[attribute] = this.prepareFunction(value);
    };
    Part.prototype.addEventHandler = function (attribute, value) {
        if (!this.functions[attribute]) {
            this.functions[attribute] = [];
        }
        this.functions[attribute].push(this.prepareFunction(value));
    };
    Part.prototype.addInclude = function (incl) {
        Part.includes.push(incl);
    };
    Part.prototype.includeLoaded = function () {
        Part.includesToLoad -= 1;
        if (Part.includesToLoad <= 0) {
            var event = new CustomEvent("ready", { "detail": "", "id": this.id });
            this.html().dispatchEvent(event);
        }
    };
    /**
     * Prepares a function. All occurences of "this" will be replaced with parts[this.id] which accesses the same Object
     * as this would but makes sure that the object will be found at runtime.
     */
    Part.prototype.prepareFunction = function (func) {
        var f = func.toString();
        var m;
        while (m = /this/.exec(f)) {
            f = f.replace(m, "HTMLSync.parts['" + this.id + "']");
        }
        return f;
    };
    Part.prototype.call = function (func, e) {
        var result = [];
        var func = this.functions[func];
        if (func) {
            for (var f in func) {
                eval("var x = " + func[f]);
                result.push(x(e));
            }
        }
        if (result.length == 1) {
            result = result[0];
        }
        return result;
    };
    /**
     * Can find a Child-part by name. Parts don't need to have names so it's likely to return undefined
     */
    Part.prototype.find = function (name) {
        for (var c in this.content) {
            if (this.content[c].name == name) {
                return this.content[c];
            }
        }
    };
    /**
     * Raises an Event on the DOM-Element of this part. If checkParents is true it will raise the event on the first Parent that supports it.
     * returns true if an eventhandler was found and false if not.
     *
     * @param name
     * @param data
     * @param checkParents
     * @returns {boolean}
     */
    Part.prototype.raiseEvent = function (name, data, checkParents, raiseAll) {
        if (!checkParents) {
            var event = new CustomEvent(name, { detail: data });
            this.html().dispatchEvent(event);
            if (!(name in this.functions)) {
                return false;
            }
            else {
                return true;
            }
        }
        else {
            var event = new CustomEvent(name, { detail: data });
            var p = this;
            if (!raiseAll) {
                while (p.parent && !(name in p.functions)) {
                    p = p.parent;
                }
                p.html().dispatchEvent(event);
                if (!(name in p.functions)) {
                    return false;
                }
                else {
                    return true;
                }
            }
            else {
                p.html().dispatchEvent(event);
                while (p.parent) {
                    p = p.parent;
                    p.html().dispatchEvent(event);
                }
            }
        }
    };
    /**
     * Sets an interval within this classes context or another given context.
     * @param func
     * @param millis
     * @param scope
     * @returns {number|NodeJS.Timer}
     */
    Part.prototype.setScopedInterval = function (func, millis, scope) {
        if (!scope) {
            scope = this;
        }
        var interval = setInterval(function () {
            func.apply(scope);
        }, millis);
        this.intervals.push(interval);
        console.debug(this.intervals);
        return interval;
    };
    /**
     * Finds the HTML-Elment representing this object in the DOM.
     * @returns {HTMLElement}
     */
    Part.prototype.html = function () {
        return document.getElementById(this.id);
    };
    /**
     * Returns a string that when passed to eval() returns the object.
     * @returns {String}
     */
    Part.prototype.pointer = function () {
        return "HTMLSync.parts['" + this.id + "']";
    };
    /**
     * Finds the HTML-Element and applies all attributes, styles and functions again with the current state.
     */
    Part.prototype.update = function (fields, send) {
        if (!fields) {
            this.renderHTML();
        }
        else if (!send) {
            var element = document.getElementById(this.id);
            if (!element) {
                return false;
            }
            for (var i in fields.style) {
                eval("this.style." + i + " = \"" + fields.style[i] + "\"");
                eval("element.style." + i + " = \"" + fields.style[i] + "\"");
            }
            for (var i in fields.attributes) {
                eval("this.attributes." + i + " = \"" + fields.attributes[i] + "\"");
                eval("element." + i + " = \"" + fields.attributes[i] + "\"");
            }
            for (var i in fields.data) {
                eval("this.data." + i + " = \"" + fields.data[i] + "\"");
                eval("element.dataset." + i + " = \"" + fields.data[i] + "\"");
            }
            for (var i in fields.functions) {
                console.debug(fields.functions[i]);
                eval("this.functions['" + i + "'] = " + this.prepareFunction(fields.functions[i]) + " )");
                eval("element.addEventListener('" + i + "', " + this.prepareFunction(fields.functions[i]) + " )");
            }
            for (var i in fields.calls) {
                var event = new CustomEvent(fields.calls[i].name, { detail: fields.calls[i].detail });
                this.html().dispatchEvent(event);
            }
        }
        if (send) {
            fields.id = this.id;
            HTMLSync.update(fields);
        }
        this.raiseEvent("updated", {}, true, true);
    };
    /**
     * Convertes this Object to a JSON which is ready to be synchronized with other clients.
     * @returns {{id: string, type: string, content: Array, style: any, attributes: any, functions: any}}
     */
    Part.prototype.toJSON = function () {
        var json = { id: this.id, type: this.type, namespace: this.namespace, content: [], style: this.style, attributes: this.attributes, functions: this.functions, data: this.data, includes: Part.includes };
        for (var p in this.content) {
            json.content.push(this.content[p].toJSON());
        }
        return json;
    };
    /**
     * Creates a HTML-Tree and adds it to either target or "desktop" when no target is given
     */
    Part.prototype.renderHTML = function (target) {
        if (!target) {
            target = document.body;
        }
        var newElement;
        if (document.getElementById(this.id)) {
            newElement = document.getElementById(this.id);
        }
        else {
            if (!this.namespace) {
                newElement = document.createElement(this.type);
            }
            else {
                newElement = document.createElementNS(this.namespace, this.type);
            }
        }
        newElement.id = this.id;
        for (var i in this.style) {
            eval("newElement.style." + i + " = \"" + this.style[i] + "\"");
        }
        for (var i in this.attributes) {
            if (this.namespace == "http://www.w3.org/2000/svg") {
                newElement.setAttribute(i, this.attributes[i]);
            }
            else {
                eval("newElement." + i + " = \"" + this.attributes[i] + "\"");
            }
        }
        for (var i in this.functions) {
            //eval("this." + i + " = " + this.functions[i]);
            eval("newElement.addEventListener('" + i + "', function(e){HTMLSync.parts[this.id].call('" + i + "',e);})");
        }
        for (var i in Part.includes) {
            if (Part.includes.indexOf(Part.includes[i]) == -1) {
                console.debug("Including " + Part.includes[i]);
                Part.includesToLoad++;
                Part.includes.push(Part.includes[i]);
                var imported;
                if (endsWith(Part.includes[i], ".js")) {
                    imported = document.createElement('script');
                    imported.src = Part.includes[i];
                }
                else if (endsWith(Part.includes[i], ".css")) {
                    imported = document.createElement('link');
                    imported.href = Part.includes[i];
                    imported.type = "text/css";
                    imported.rel = "stylesheet";
                }
                else {
                    console.debug("Couldn't load " + Part.includes[i]);
                    continue;
                }
                imported.dataset.id = this.id;
                imported.addEventListener("load", function (e) {
                    HTMLSync.parts[this.dataset.id].includeLoaded();
                });
                document.head.appendChild(imported);
            }
            else {
                newElement.addEventListener("added", function (e) {
                    HTMLSync.parts[this.id].includeLoaded();
                });
            }
        }
        for (var i in this.content) {
            this.content[i].renderHTML(newElement);
        }
        var event = new CustomEvent("added", { "detail": "", "id": this.id });
        target.appendChild(newElement);
        // Dispatch/Trigger/Fire the event
        newElement.dispatchEvent(event);
    };
    Part.prototype.changeId = function (id, mainId) {
        var updated = false;
        if (!mainId) {
            console.debug("Main ID is " + this.id);
            updated = true;
            mainId = this.id;
        }
        for (var c in this.content) {
            c = this.content[c];
            var split = c.id.split("_");
            if (split[0] == mainId) {
                console.debug(c.id + " needs update");
                updated = true;
                c.id = id + "_" + split[1];
            }
            c.changeId(id, mainId);
        }
        if (updated) {
            for (var f in this.functions) {
                for (var x in this.functions[f]) {
                    console.debug("Changing function " + x + " of all " + f + " functions for Object " + this.id);
                    console.debug("Replacing " + mainId + " with " + id);
                    var re = new RegExp(mainId, 'g');
                    this.functions[f][x] = this.functions[f][x].replace(re, id);
                }
            }
        }
        if (this.id == mainId)
            this.id = id;
    };
    Part.prototype.kill = function () {
        for (var x = 0; x < this.content.length; x++) {
            this.content[x].kill();
        }
        for (var i = 0; i < this.intervals.length; i++) {
            console.debug("Clearing interval" + this.intervals[i]);
            clearInterval(this.intervals[i]);
        }
    };
    Part.counter = 0;
    Part.includes = [];
    Part.includesToLoad = 0;
    return Part;
})();
/**
 * Created by Lars on 31.08.2015.
 */
/// <reference path="./typings/socket.io.d.ts"/>
/// <reference path="Part.ts"/>
var HTMLSync = (function () {
    function HTMLSync(params) {
        if (!HTMLSync.instance) {
            HTMLSync.instance = this;
        }
        if (!params) {
            params = {};
        }
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
    HTMLSync.update = function (obj) {
        HTMLSync.instance.update(obj);
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
    HTMLSync.add = function (obj, parent) {
        HTMLSync.instance.add(obj, parent);
    };
    HTMLSync.prototype.deleteObj = function (id) {
        HTMLSync.socket.emit("delete", { roomId: this.room, id: id });
    };
    HTMLSync.deleteObj = function (id) {
        HTMLSync.instance.deleteObj(id);
    };
    return HTMLSync;
})();
//# sourceMappingURL=html-sync.js.map