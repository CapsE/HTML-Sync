/**
 * Created by Lars on 22.02.2016.
 */
module.exports = function (HTMLSync) {
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
            HTMLSync.add(this);
        }
        /**
         * Adds a Child-Part to this part. Also sets this Object as parent of the added child
         */
        Part.prototype.addChild = function (obj) {
            obj.parent = this;
            this.content.push(obj);
        };
        Part.prototype.css = function (attribute, value) {
            if (value) {
                this.setStyle(attribute, value);
            }
            else {
                this.setStyles(attribute);
            }
        };
        Part.prototype.setStyle = function (attribute, value) {
            this.style[attribute] = value;
        };
        Part.prototype.setStyles = function (style) {
            for (var key in style) {
                this.style[key] = style[key];
            }
        };
        Part.prototype.attr = function (attribute, value) {
            if (value) {
                this.setAttribute(attribute, value);
            }
            else {
                this.setAttributes(attribute);
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
        Part.prototype.on = function (attribute, value) {
            this.addEventHandler(attribute, value);
        };
        Part.prototype.setEventHandler = function (attribute, value) {
            this.functions[attribute] = this.prepareFunction(value);
        }; //TODO: New Eventsystem
        Part.prototype.addEventHandler = function (attribute, value) {
            if (!this.functions[attribute]) {
                this.functions[attribute] = [];
            }
            this.functions[attribute].push(this.prepareFunction(value));
        }; //TODO: New Eventsystem
        Part.prototype.addInclude = function (incl) {
            Part.includes.push(incl);
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
        }; //TODO: New Eventsystem
        /**
         * Finds the HTML-Element and applies all attributes, styles and functions again with the current state.
         */
        Part.prototype.update = function (fields) {
            fields.id = this.id;
            HTMLSync.update(fields);
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
        Part.prototype.changeId = function (id, mainId) {
            var updated = false;
            if (!mainId) {
                updated = true;
                mainId = this.id;
            }
            for (var c in this.content) {
                c = this.content[c];
                var split = c.id.split("_");
                if (split[0] == mainId) {
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
        Part.counter = 0;
        Part.includes = [];
        return Part;
    })();
    return Part;
};
//# sourceMappingURL=part.js.map