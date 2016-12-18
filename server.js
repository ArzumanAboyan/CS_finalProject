var fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var gameno = 1;
var users = {};
var games = {};

function isItemInArray(array, item) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][0] == item[0] && array[i][1] == item[1]) {
            return i;
        }
    }
    return -1;
}

function isWound(a,b,arr) {
    var parts = [];
    var ship = [];
    var k = 1;
    if (arr[a] && arr[a][b - 1] && arr[a][b - 1] !== 0) parts.push([a, b - k]);
    if (arr[a] && arr[a][b + 1] && arr[a][b - 1] !== 0) parts.push([a, b + k]);
    if (arr[a + 1] && arr[a + 1][b] && arr[a + 1][b] !== 0) parts.push([a + k, b]);
    if (arr[a - 1] && arr[a - 1][b] && arr[a - 1][b] !== 0) parts.push([a - k, b]);
    if (parts.length === 0) {
        return false;
    }
        else {
            var new_parts = parts;
            parts.forEach(function (coo) {
                var i = coo[0], j = coo[1];
                while (arr[i] && arr[i][j] && arr[i][j] !== 0) {
                    console.log([i, j]);
                    new_parts.push([i, j]);
                    if (i < a || j < b) {
                        if (i < a) i--;
                        else j--;
                    }
                    else {
                        if (i > a) i++;
                        else j++;
                    }
                }
            });
        }

    if (new_parts !== undefined) {
        new_parts.forEach(function (part) {
            ship.push(arr[part[0]][part[1]]);
        });
        if(ship.indexOf(1) === -1) return new_parts;
        else return true;
    }
    else return true;
}

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket){
    var cur_game = io.nsps['/'].adapter.rooms["game-" + gameno];
    socket.emit('positioning', [[],[],[],[],[],[],[],[],[],[],20]);

    if(cur_game && cur_game.length === 2)
        gameno++;
    socket.join("game-"+gameno);

    if(cur_game && cur_game.length === 2) {
        games["game-"+gameno] = {};
        games["game-"+gameno]["ready"] = 0;

        for(var member_socket in cur_game.sockets){
            games["game-"+gameno][member_socket] = [];
        }
        io.in("game-" + gameno).emit("StartGame");
    }
    users[socket.id] = "game-"+gameno;

    io.in("game-" + gameno).emit('gameno', gameno);
    socket.on("StartGame", function(ships){
        games[users[socket.id]]["ready"] ++;
        games[users[socket.id]][socket.id] = ships.ships;
        games[users[socket.id]][socket.id].push(20);
        socket.emit('positioning', ships.ships);

       if (games[users[socket.id]]["ready"] > 1){
          socket.broadcast.to(users[socket.id]).emit("beginShooting");
           socket.broadcast.to(users[socket.id]).emit('EndOfC', -2);
       }
    });
    socket.on("beginShooting", function(point) {
        var needed_grid;
        var opponent;
        var whole_ship = [point];
        var callback = 'empty';
        for (player in games[users[socket.id]]) {
            if (player !== socket.id && player !== 'ready') {
                needed_grid = games[users[socket.id]][player];
                opponent = player;
            }
        }
        if (needed_grid[point[0] - 1][point[1] - 1] === 1) {
            needed_grid[needed_grid.length - 1]--;
            if (needed_grid[needed_grid.length - 1] === 0) {
                socket.emit('endOfC', 1);

            }
            else {
                if(isWound(point[0] - 1, point[1] - 1, needed_grid) === true) {
                    whole_ship = [point];
                    callback = 'wound';
                }
                else if(isWound(point[0] - 1, point[1] - 1, needed_grid) === false) {
                    callback = 'killed';
                    whole_ship = [point]
                }
                else {
                    callback = 'killed';
                    whole_ship = isWound(point[0] - 1, point[1] - 1, needed_grid);
                    whole_ship.push(point);
                }
                needed_grid[point[0] - 1][point[1] - 1] = -1;
                socket.broadcast.to(opponent).emit("died", point);
                socket.emit("beginShooting");
            }
        }
        else{
            socket.broadcast.to(opponent).emit("beginShooting");
        }
        socket.emit("callback", [callback, whole_ship]);
    });

    socket.on('disconnect', function(socket){
        delete games[users[this.id]];
        io.in(users[this.id]).emit('endOfC', -1);
        delete users[this.id];
    });
});

server.listen(3000, function(){
    console.log('listening to :3000');
});