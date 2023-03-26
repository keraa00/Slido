const io = require( "socket.io" )();
const socketapi = {
    io: io
};

// Add your socket.io logic here!
/*io.on( "connection", function( socket ) {
   console.log( "A user connected" );

    socket.emit('message', 'Welcome to ChatCord!');
});*/
// end of socket.io logic

const formatMessage = require('./utils/messages');
const botName = 'ChatBot';
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');


io.on('connection', (socket) =>{
    socket.on('joinRoom', ({username, room}) =>{

         const user = userJoin(socket.id, username, room);
         console.log(user);
        socket.join(user.room);

        //Welcome current user
        // socket.emit('message', formatMessage(botName,'Welcome to Chat' ));

        // Broadcast when a user connects
        // socket.broadcast.to(user.room).emit('message',formatMessage(botName,`${user.username} has joined the chat`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });


    });


    // Listen for chatMessage
    socket.on('chatMessage' , (msg) =>{
        const user = getCurrentUser(socket.id);
        console.log(msg); // dodati poruku u bazu
        console.log(user.room);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () =>{
        const user = userLeave(socket.id);

        /*if(user){
           // io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`));
            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }*/




    });

});

module.exports = socketapi;