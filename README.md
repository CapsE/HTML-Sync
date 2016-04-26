HTML-Sync.js
=========================
HTML-Sync.js allows you to synchronize changes a user made on your website with other users to create a cooperative experience.
The library uses Socket.io to send JSON-objects that represent HTML-structures. The library is easily integratet in an existing Node.js Server.

Client - Side
-------------------------
The library implements the Syncable- and the Part-class. The Part-class represents a synchronizeable HTML-node. This node has attributes, styles, event-handlers and child elements just like a regular HTML-node does.
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
    <div id="header"></div>
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

Here the element will be added to the header instead of the body.

Sometimes you want to synchronise objects that are not HTML-Nodes. You can use the Syncable-Class to do so. The Part class inherits most of it's functions from this class which means you can trat a syncable almost like a regular Part.

Server - Side
-------------------------
Server and Client use the same scripts for the most part but you need to initialize the HTMLSync Server and pass it your Socket.IO Server to make it work.

```js
var io = require('socket.io')(http);
var hs = new HTMLSync(io, {debug:false});

io.on('connection', function(socket){
  HTMLSync.setSocket(socket);
});
```

The new HTMLSync requires access to your Socket.IO Server. You also need to bind the HTMLSync-Events to every new connected client. This might seem like something the library should handle automaticly but this way you keep full control over your Socket.IO server and can use it not just for HTML-Sync.

Ofcourse you can create Parts or Syncables on the server side just like you would on the client side. This is usefull for all elements the users share and don't need their own instance of. In a chat every client creates his own name tag and syncs it but the server adds one user counter that all users share.

Rooms
-------------------------
Rooms are like chatrooms a way to seperate users from each other. Some pages want all user to get synchronized but you might want to allow your clients to have a private room for their little group. Maybe you want to limit the amount of users to 15 to prevent to much action for your clients or you just want to synchronize what the users does with your server to store his work and keep every user in it's own room. Whatever your needs you can easily achieve them with HTML-Sync.
 
Talking about storing: HTML-Sync works great with MogoDB. Just convert your room to JSON and store it including complex event listeners and functions on all your Parts and Syncables.