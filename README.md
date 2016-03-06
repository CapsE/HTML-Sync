HTML-Sync.js
=========================
HTML-Sync.js allows you to synchronize changes a user made on your website with other users to create a cooperative experience.
The library uses Socket.io to send JSON-objects that represent HTML-structures. The library is easily integratet in an existing Node.js Server.

Client - Side
-------------------------
The library implements the Part-class. This class represents a synchronizeable HTML-node. This node has attributes, styles, event-handlers and child elements just like a regular HTML-node does.
The Part class keeps the methods you might know from JQuery. 

```js
var div = new Part("div");
div.css("width", "200px");
div.attr("className", "example");
div.on("click", function(){
    alert("Div got clicked!");
});
```

If you want to set multiple styles or attributes at once you can!

```js
var img = new Part("img");
img.css({
    width:"100px",
    height:"100px"
});
img.attr({
    src="/example_img.png",
    className="example-image"
});
```

Now you created you Part you want to add it to the document. To do so use the following code:

```js
var head = new Part("h1");
head.attr("innerHTML", "Hello World!");
HTMLSync.add(head);
```

This will add the H1-tag for every user currently on you website and everybody that will visit it from now on. Usually objects get added to the body of the document but HTMLSync.add also has a second parameter you can use to set a parent element for your new object.

```html
<body>
    <header id="header"></header>
    <div id="main-page">
        Some content
    </div>
</body>
```

```js
var head = new Part("h1");
head.attr("innerHTML", "Hello World!");
HTMLSync.add(head, "header");
```
