Getting Started
===============
Setting everything up
----------------------

First install the library and save it to your package.json. After that install socket.io if you didn't already.
```
npm install html-sync --save

npm install socket.io --save
```

In your main file add the following code to initialize the library
```js
var express = require('express');
var HTMLSync = require('html-sync');

// Set up the server
var app = express();
var http = require('http').createServer(app);
http.listen(process.env.PORT || 3000, function(){
    console.log("listening on " + (process.env.PORT || 3000));
});

// Start Socket.IO Server with instance of webserver
var io = require('socket.io')(http);

// Start HTML-Sync with instance of Socket.IO server
var hs = new HTMLSync(io, {debug:true});
```

That's it on the server side. Now we need to connect a client to the server and we are good to go.
The following is a very basic HTML-Page that connects to the server.
```html
    <html>
        <head>
            <script src="https://code.jquery.com/jquery-3.1.0.min.js"></script>
            <script src="html-sync.min.js"></script>
        </head>
        <body>
            <h1>Hello World</h1>
            <div id="wrapper"></div>
        </body>
        <script>
            var htmlSync = new HTMLSync({
                debug:true,
                url: "ws://127.0.0.1:3000",
                room: "/"
            });
        </script>
    </html>
```
**NOTE:** Once you serve this code from your Express Server instead of the filesystem the url parameter is no longer neeeded.

If everything worked out you should be able to start the server
```
$ node app.js
listening on 3000
```

Once you open the HTML-file in a browser the server should print the following on the console.
```
a user connected
join { room: '/' }
```

Creating an object
------------------
Now that the connection is established we can start adding objects to be synched between multiple clients. You can add object either on the server or client side depending on your needs.
Let's start by creating a simple user counter to our website. In your main server file add the following code
```js
// Actual user count as integer
var userCount = 0;

// The counter object that will be synced. In this case it's a <h2>-tag
var counter = new HTMLSync.Part("h2");

// Setting up the default attributes of the element
counter.attr({
    innerHTML: userCount,
    className: "user-counter"
});

// This tells HTML-Sync where to add the object on the website
counter.parent = "wrapper";

// Finally add the object to all clients
HTMLSync.add(counter);
```

If you restart the server and refresh the website you should see a "0" under the "Hello World". To get the actual user count we need to add a bit more code to our server.
```js
io.on("connection", function(socket){
    userCount += 1;
    console.log("A user connected. User count:", userCount);
    counter.update({
        attr:{
            innerHTML: userCount.toString()
        }
    });

    socket.on("disconnect", function(){
        userCount -= 1;
        console.log("A user disconnected. User count:", userCount);
        counter.update({
            attr:{
                innerHTML: userCount.toString()
            }
        });
    });
});
```

With this code we added an event handler for the usual Socket.IO connect- and disconnet-event. We adjust the userCounter variable and update the counter part object. If you open the test.html file multiple times every tab should always display the correct amount of connected clients.