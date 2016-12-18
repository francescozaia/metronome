

(function($, window, undefined){

    "use strict";

    // First, let's shim the requestAnimationFrame API, with a setTimeout fallback
    window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
    })();

    $(function(){
        Metronome.init();
    })

})(jQuery, this);


var Metronome = (function($, window, undefined){

    //"use strict";
    var options = {
        nextNoteTime: 0.0,      // when the next note is due.
        noteLength: 0.1,        // length of "beep" (in seconds)
        scheduleAheadTime: 0.1, // how far ahead to schedule audio (in seconds).
        tempo: 120,             // tempo (in beats per minute)
        lookahead: 25.0,        // How frequently to call scheduling function (in milliseconds)
    }
    var audioContext = null;
    var isPlaying = false;      // Are we currently playing?
    var startTime;              // The start time of the entire sequence.
    var current16thNote;        // What note is currently last scheduled?
    var timerID = 0;            // setInterval identifier.
    var canvas;                 // the canvas element
    var canvasContext;          // canvasContext is the canvas' context 2D
    var last16thNoteDrawn = -1; // the last "box" we drew on the screen
    var notesInQueue = [];      // the notes that have been put into the web audio,
                                // and may or may not have played yet. {note, time}

    var canvasWidth = 640;
    var canvasHeight = 640;
    var numeroQuadratini = 16;

    var noteMatrix = [];
    var finalMatrix = [];

    var returnedObject = this;

    returnedObject.init = function (){
        for (var i=0; i<numeroQuadratini; i++) {
            noteMatrix.push(i*110);
            finalMatrix.push([]);
            //finalMatrix.push
        }
        $("#play").on("click", function(e){
            e.target.innerText = returnedObject.play();
        });

        $("#tempo")[0].oninput = function(e){
            options.tempo = e.target.value;
            $("#showTempo")[0].innerText = options.tempo.toString();
        };

        $("#metronome").width = canvasWidth;
        $("#metronome").height = canvasHeight;
        canvasContext = $("#metronome")[0].getContext( '2d' );

        audioContext = new AudioContext();


        var grid = $('<div></div>').attr("id","grid").hide();

        var styles = {
            position: "absolute",
            top: "100px"
        }
        grid.css(styles)

        for (var row=0; row<numeroQuadratini; row++){
            for (var col=0; col<numeroQuadratini; col++){
                var styles = {
                    position: "absolute",
                    width: "15px",
                    height: "15px",
                    top: row*20 + "px",
                    left: col*20 + "px",
                    backgroundColor: "#CDCDCD"
                };
                var square = $('<div></div>').css(styles).data("test", { row: row, col: col, selected:false });
                grid.append(square);
            }
        }
        
        $("#container").append(grid);

        $("#grid div").on("click", function(event){
            if($(this).data("test").selected){
                $(this).css("backgroundColor", "#CDCDCD");
                $(this).data("test").selected = false;
                var whichColumn = $(this).data("test").col;
                var whichRow = $(this).data("test").row;

                // pop dell'elemento selezionato (se c'è);
                var index = finalMatrix[whichColumn].indexOf(noteMatrix[whichRow]);
                finalMatrix[whichColumn].splice(index, 1);
                console.log("popping note " + noteMatrix[whichRow] + " into column " + whichColumn);
            } else {
                $(this).css("backgroundColor", "#FF0000");
                $(this).data("test").selected = true;
                var whichColumn = $(this).data("test").col;
                var whichRow = $(this).data("test").row;
                finalMatrix[whichColumn].push(noteMatrix[whichRow]);
                console.log("pushing note " + noteMatrix[whichRow] + " into column " + whichColumn); 
            }
            //alert($(this).data("test").i + ", " + $(this).data("test").j);
        });

            
        grid.show();
        $("#grid div:first-child").trigger("click");
        requestAnimFrame(draw);
    }

    returnedObject.nextNote = function() {

        options.nextNoteTime += 0.25 * 60.0 / options.tempo;

        // Advance the beat number, wrap to zero
        current16thNote++;  
        if (current16thNote == numeroQuadratini) {
            current16thNote = 0;
        }
    }

    returnedObject.scheduleNote = function( _beatNumber, _time ) {

        // push the note on the queue, even if we're not playing.
        notesInQueue.push( { note: _beatNumber, time: _time } );
        var oscs = [];



        
         
        // connect source through a series of filters
        


        finalMatrix[_beatNumber].forEach(function(freq) {
            var output = audioContext.createOscillator();
            output.frequency.value = freq;
            output.connect(audioContext.destination);
            output.start(_time);
            output.stop(_time + options["noteLength"]); //+ d.delayValue);
        });

        
    }


    returnedObject.scheduler = function() {
        // while there are notes that will need to play before the next interval, schedule them and advance the pointer.
        while (options.nextNoteTime < audioContext.currentTime + options.scheduleAheadTime ) {
            scheduleNote( current16thNote, options.nextNoteTime );
            nextNote();
        }
        timerID = window.setTimeout( scheduler, options.lookahead );
    }

    returnedObject.play = function() {
        isPlaying = !isPlaying;

        if (isPlaying) { // start playing
            current16thNote = 0;
            options.nextNoteTime = audioContext.currentTime;
            scheduler();    // kick off scheduling
            return "stop";
        } else {
            window.clearTimeout( timerID );
            return "play";
        }
    }

    returnedObject.draw = function() {
        var currentNote = last16thNoteDrawn;
        var currentTime = audioContext.currentTime;

        //console.log(notesInQueue)
        while (notesInQueue.length && notesInQueue[0].time < currentTime) {
            currentNote = notesInQueue[0].note;
            notesInQueue.splice(0,1);
        }


        

        if (last16thNoteDrawn != currentNote) {
            canvasContext.clearRect(0, 0, 320, 15);
            for (var i=0; i<numeroQuadratini; i++) {
                canvasContext.fillStyle = ( currentNote == i ) ? "red" : "black";
                canvasContext.fillRect( 20 * i, 0, 15, 15 );
            }
            last16thNoteDrawn = currentNote;
        }

        // set up to draw again
        requestAnimFrame(draw);
    }

    return returnedObject;

})(jQuery, this);
