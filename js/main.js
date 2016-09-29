/*global window, document, setInterval, clearInterval, setTimeout, clearTimeout, MIDI, console, $*/

(function () {
    'use strict';
    window.onload = function () {
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');
        var delta = 120;
        var notePosition = {
            60: 50,
            62: 150,
            64: 250,
            65: 350,
            67: 450,
            69: 550,
            71: 650,
            72: 750
        };
        var noteColor = {
            60: 'red',
            62: 'orange',
            64: 'yellow',
            65: 'green',
            67: 'cyan',
            69: 'blue',
            71: 'violet',
            72: 'red'
        };
        var noteW = 40;
        var noteH = 20;
        var playingTimeoutId;

        var drawBkrd = function () {
            if (canvas.getContext) {
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, 800, 1600);
            }
        };

        var drawHitArea = function () {
            if (canvas.getContext) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(-2.5, 700.5, 804, 30);
            }
        };
        var drawLines = function () {
            if (canvas.getContext) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(50, -2.5, 0, 1604);
                ctx.strokeRect(150, -2.5, 0, 1604);
                ctx.strokeRect(250, -2.5, 0, 1604);
                ctx.strokeRect(350, -2.5, 0, 1604);
                ctx.strokeRect(450, -2.5, 0, 1604);
                ctx.strokeRect(550, -2.5, 0, 1604);
                ctx.strokeRect(650, -2.5, 0, 1604);
                ctx.strokeRect(750, -2.5, 0, 1604);
            }
        };

        var draw = function (x, y, w, h, color) {
            if (canvas.getContext) {
                ctx.fillStyle = color;
                ctx.fillRect((x - (w / 2) + 0.5), (y - (h / 2) + 0.5), w, h);
            }
        };


        var drawNotes = function (notes) {
            ctx.clearRect(0, 0, canvas.width, 800);
            drawBkrd();
            drawLines();

            var note, yPos;
            var doDrawNote = function (position) {
                yPos = 800 - noteH - (position * delta) - 400;
                if (yPos >= 0 && yPos <= $(window).height() + 100) {
                    draw(notePosition[note], yPos, noteW, noteH, noteColor[note]);
                }
            };
            for (note in notes) {
                if (notes[note] !== undefined) {
                    notes[note].forEach(doDrawNote);
                }
            }

            drawHitArea();
        };

        var animate = function (notes) {
            playingTimeoutId = setInterval(function () {
                var note;
                var getNewPosition = function (position) {
                    return position - 0.01;
                };
                for (note in notes) {
                    if (notes[note] !== undefined) {
                        notes[note] = notes[note].map(getNewPosition);
                    }
                }
                drawNotes(notes);
            }, 12);
        };



        var doInitialDataPlaythrough = function (file) {
            console.log('doInitialDataPlaythrough');
            var deferred = $.Deferred();
            MIDI.loadPlugin({
                soundfontUrl: "./soundfont/",
                instrument: "acoustic_grand_piano",
                onprogress: function (state, progress) {
                    console.log(state, progress);
                },
                onsuccess: function () {
                    console.log('playing: ' + file);

                    MIDI.Player.timeWarp = 0.001; // speed the song is played back
                    MIDI.Player.loadFile(file, MIDI.Player.start);

                    var notes = {};
                    var timeoutId;
                    MIDI.setVolume(0, 0);
                    MIDI.setVolume(1, 0);
                    MIDI.setVolume(2, 0);
                    MIDI.setVolume(3, 0);
                    MIDI.Player.addListener(function (data) { // set it to your own function!
                        var now = data.now; // where we are now
                        var end = data.end; // time when song ends
                        var channel = data.channel; // channel note is playing on
                        var message = data.message; // 128 is noteOff, 144 is noteOn
                        var note = data.note; // the note
                        var velocity = data.velocity; // the velocity of the note
                        console.log(now, end, channel, message, note, velocity);

                        if (message === 144) {
                            if (notes[note]) {
                                notes[note].push(now);
                            } else {
                                notes[note] = [now];
                            }
                            // console.log(notes, now, now, end);
                        }

                        if (timeoutId) {
                            clearTimeout(timeoutId);
                        }
                        timeoutId = setTimeout(function () {
                            deferred.resolve(notes);
                        }, 1000);
                    });
                }
            });

            return deferred;
        };

        var playActualSong = function (file, notes) {
            console.log('playActualSong');
            animate(notes);
            setTimeout(function () {
                MIDI.Player.timeWarp = 1.2; // speed the song is played back
                MIDI.Player.loadFile(file, MIDI.Player.start);

                MIDI.setVolume(0, 127);
                MIDI.setVolume(1, 127);
                MIDI.setVolume(2, 127);
                MIDI.setVolume(3, 127);
                MIDI.Player.addListener(function (data) { // set it to your own function!
                    var now = data.now; // where we are now
                    var end = data.end; // time when song ends
                    var channel = data.channel; // channel note is playing on
                    var message = data.message; // 128 is noteOff, 144 is noteOn
                    var note = data.note; // the note
                    var velocity = data.velocity; // the velocity of the note
                    console.log(now, end, channel, message, note, velocity);
                });
            }, 3800);
        };

        var playSong = function (file) {
            doInitialDataPlaythrough(file).done(function (notes) {
                playActualSong(file, notes);
            });
        };

        $('.play-song').click(function (e) {
            if (playingTimeoutId) {
                clearInterval(playingTimeoutId);
            }
            MIDI.Player.stop();
            drawBkrd();
            drawLines();
            drawHitArea();
            playSong('midi/' + $(e.currentTarget).data('song'));
        });

        drawBkrd();
        drawLines();
        drawHitArea();

    };
}());
