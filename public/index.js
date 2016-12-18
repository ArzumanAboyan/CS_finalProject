$(document).ready(function(){
    $("#howto").modal('show');
});
$("#settings_area").hide();
var socket = io();
var html = '';
for(i = 0; i < 10; i++){
    html += "<tr class='raw'><th>" + (i+1) + "</th>";
    for(j = 0; j < 10; j++){
        html += "<td class='your-cell'  id = '" + (i+1) + "_" + (j+1) + "_o"+"'></td>";
    }
    html += "</tr>";
}
$("#opponent_grid tbody").html(html);
$(document).ready(function(){
    $('tr')
        .mouseover(function(event) {
        $(this).children().addClass('hovered');
        })
        .mouseout(function(event) {
        $(this).children().removeClass('hovered');
        });
});
socket.on("StartGame", function(){
    var ships = [[],[],[],[],[],[],[],[],[],[]];
    $("#start_play").html('<button id ="start_play">Play</button>');
    $("#start_play").click(function(){
        $("#put_ships").html("<button id='put_ships'>Save ships</button>");
        $("#settings_area").show(200);
    });
    $(".ship").dblclick(function() {
        $(this).toggleClass('rotate');
    });
    $(".ship").draggable({
            snapTolerance:50,
            revert: "invalid",
            cursor: "hand"
        }
    );
    $("#your_grid td").droppable({
        hoverClass: "hovered-grid",
        tolerance : "touch",
        accept : ".ship",
        drop: function( event, ui ) {
            $(this).droppable('option','accept',ui.draggable);
            $(this).addClass('current');

        },
        out: function(event, ui){
            $(this).droppable('option','accept', '.ship');
            $(this).removeClass('current');
        }
    });
    $("#put_ships").click(function() {
        if ($('.current').length === 20){
            var points = $(".current").map(function() {
                return this.id;
            }).get();
            points.forEach(function(point){
                var right_id = point.split("_");
                ships[right_id[0]-1][right_id[1]-1] = 1;
            });
            socket.emit('StartGame', {ships : ships});

        }
        else {
            $('#exit-button').hide();
            $("#popup").html('Error!');
            $("#message").html("Put all the ships!");
            $("#myModal").modal('show');

        }
    });
});

socket.on('positioning', function(list){
    var html = '';
    for(i = 0; i < (list.length)-1; i++){
        html += "<tr class='raw'><th>" + (i+1) + "</th>";
        for(j = 0; j < (list.length)-1; j++){
            if(list[i][j] === 1) var color = "black";
            html += "<td class='your-cell "+color+"' id = '" + (i+1) + "_" + (j+1) + "_y"+"'></td>";
            color = '';
        }
        html += "</tr>";
    }
    $("#your_grid tbody").html(html);
});
socket.on("beginShooting", function() {
    $(document).on("click", "#opponent_grid td", function (e) {
        $(this).addClass("shoot_cell");
        var shootCellID = $(this).attr("id").split("_");
        $(document).off("click", "#opponent_grid td");
        socket.emit("beginShooting", shootCellID);
    });
});
socket.on("callback", function(prop){
    switch(prop[0]){
        case 'killed':
            prop[1].forEach(function(property){
                var coo = "#" + ((typeof (property[0]) === 'number') ? property[0]+1 :
                        property[0]) + "_" + ((typeof (property[1]) === 'number') ? property[1]+1 :
                        property[1]) + "_o";
                $(coo).removeClass("shoot_cell");
                $(coo).removeClass("wound");
                $(coo).addClass('killed');
            });
            $('#exit-button').hide();
            $("#popup").html('Killed!');
            $("#message").html("");
            $("#myModal").modal('show');
            $("#popup").html('Killed!');
            break;
        case 'wound':
            var coo = "#" + prop[1][0][0] + "_" + prop[1][0][1] + "_o";
            $(coo).removeClass("shoot_cell");
            $(coo).addClass('wound');
            break;
        case 'empty':
            var coo = "#" + prop[1][0][0] + "_" + prop[1][0][1] + "_o";
            $(coo).addClass('empty');
            break;
    }
});

socket.on("died", function(point){
    var coo = "#"+point[0]+ "_" + point[1] + "_y";
    $(coo).removeClass('black');
    $(coo).addClass('killed');
});

socket.on('endOfC', function(reason){
   if(reason === -1) $("#message").html("Opponent left and you win!");
   else if(reason === 1) $("#message").html("You have destroyed all the ships, you win!");
   else if(reason === -2) $("#message").html("Your ships have been destroyed, you lose!");
   else $("#message").html("Game ended");
   $("#myModal").modal('show');
});