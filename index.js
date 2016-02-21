/**
 * Created by Lars on 21.02.2016.
 */

module.exports = function(socket){
    socket.on('update', function(msg){
        updateForm(msg);
        io.sockets.in(msg.roomId).emit('update', msg);
    });

    socket.on('add', function(msg){
        console.log("Adding Form");
        getRoom(msg.roomId, function(room){
            room.forms[msg.id] = msg;
            io.sockets.in(msg.roomId).emit('add', msg);
        });
    });

    socket.on('delete', function(msg){
        getRoom(msg.roomId, function(room){
            delete room.forms[msg.id];
            delete room.updates[msg.id];
        });
        io.sockets.in(msg.roomId).emit('delete', msg);
    });

    socket.on("join", function(msg){
        socket.join(msg["room"]);
        socket.roomId = msg["room"];
    });

    var htmlSync = {

    };

    return htmlSync;
};
