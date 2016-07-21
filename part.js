/**
 * Created by Lars on 22.02.2016.
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};



module.exports = function(HTMLSync){
    var _super = require("./syncable")(HTMLSync);

    /**
     * Base Class for the synchronized working. Represents more or less a HTML-Tag.
     */


    /**
     * Create either with just a type like "div" or with a hash-map with all relevant fields set.
     */
    var Part = function(type, json) {
        _super.call(this);
        this.content = [];
        this.style = {};
        this.attributes = {};
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
            this.name = json.name;
            this.parent = json.parent;
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
    }
    __extends(Part, _super);
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
    Part.prototype.addInclude = function (incl) {
        Part.includes.push(incl);
    };
    /**
     * Convertes this Object to a JSON which is ready to be synchronized with other clients.
     * @returns {{id: string, type: string, content: Array, style: any, attributes: any, functions: any}}
     */
    Part.prototype.toJSON = function () {
        var json = _super.prototype.toJSON.call(this);
        json.type = this.type;
        json.name = this.name;
        json.namespace = this.namespace;
        json.content = [];
        json.style = this.style;
        json.attributes = this.attributes;
        json.includes = Part.includes;
        if (!this.parent.toJSON) {
            json.parent = this.parent;
        }
        for (var p in this.content) {
            json.content.push(this.content[p].toJSON());
        }
        return json;
    };
    Part.includes = [];
    Part.counter = 0;

    return Part;
};

