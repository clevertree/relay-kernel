/**
 * Created by Ari on 12/30/2016.
 */

// Handle client-side response
if (typeof document !== 'undefined') (function(){
    document.addEventListener('response:start', handleStartResponse);

    // Song Variables

    var FREQUENCY_A4 = 440;
    var HALF_STEP = Math.pow(2, 1/12);

    var PATTERN_LENGTH = 4;
    var NOTE_LENGTH = PATTERN_LENGTH / 16;

    // Initiate Song
    function init() {
        calculateNoteFrequencies(FREQUENCY_A4, HALF_STEP);
    }

    function p1(s, l) {
        if(processedTime > s + l)
            return false;

        var NF = NOTE_FREQUENCIES, NL = NOTE_LENGTH;

        var sine = getOscillatorInstrument('sine');

        // Play Notes
        sine.play(NF.F6, s+NL*1, NL/2, 1.0);
        sine.play(NF.A4, s+NL*2, NL/2, 0.2);
        sine.play(NF.A3, s+NL*3, NL/2, 0.7);

        return true;
    }


    function processPattern() {
        var pl = PATTERN_LENGTH;
        p1(0 * pl, pl) ||
        p2(1 * pl, pl) ||
        p3(2 * pl, pl) ||
        p4(3 * pl, pl);

    }

    // Music Variables

    var NOTE_FREQUENCIES = {
        A4: FREQUENCY_A4
    };


    // Support Variables

    var context;
    var startTime = 0;
    var processedTime = 0;
    var AudioContext = window.AudioContext || window.webkitAudioContext;

    // Support Methods


    function calculateNoteFrequencies(freqA4, halfStep) {
        var octaveOffset = 4;
        var nf = NOTE_FREQUENCIES;
        for(var octave=0; octave<=9; octave++) {
            var stepOffset = 12*(octave - octaveOffset);
            nf['A' + octave] = freqA4 * Math.pow(halfStep, stepOffset++);
            nf['As' + octave] =
            nf['Bb' + octave] = freqA4 * Math.pow(halfStep, stepOffset++);
            nf['B' + octave] = freqA4 * Math.pow(halfStep, stepOffset++);
            nf['C' + octave] = freqA4 * Math.pow(halfStep, stepOffset++);
            nf['Cs' + octave] =
            nf['Db' + octave] = freqA4 * Math.pow(halfStep, stepOffset++);
            nf['D' + octave] = freqA4 * Math.pow(halfStep, stepOffset++);
            nf['Ds' + octave] =
            nf['Eb' + octave] = freqA4 * Math.pow(halfStep, stepOffset++);
            nf['E' + octave] = freqA4 * Math.pow(halfStep, stepOffset++);
            nf['F' + octave] = freqA4 * Math.pow(halfStep, stepOffset++);
            nf['Fs' + octave] =
            nf['Gb' + octave] = freqA4 * Math.pow(halfStep, stepOffset++);
            nf['G' + octave] = freqA4 * Math.pow(halfStep, stepOffset++);
            nf['Gs' + octave] =
            nf['Ab' + octave] = freqA4 * Math.pow(halfStep, stepOffset++);
        }
        nf['A'] = nf['A4'];
        nf['As'] = nf['As4'];
        nf['Bb'] = nf['Bb4'];
        nf['B'] = nf['B4'];
        nf['C'] = nf['C4'];
        nf['Cs'] = nf['Cs4'];
        nf['Db'] = nf['Db4'];
        nf['D'] = nf['D4'];
        nf['Ds'] = nf['Ds4'];
        nf['Eb'] = nf['Eb4'];
        nf['E'] = nf['E4'];
        nf['F'] = nf['F4'];
        nf['Fs'] = nf['Fs4'];
        nf['Gb'] = nf['Gb4'];
        nf['G'] = nf['G4'];
        nf['Gs'] = nf['Gs4'];
        nf['Ab'] = nf['Ab4'];
    }

    function process(newStartTime) {
        if(!context) {
            context = new AudioContext();
            processedTime = startTime = context.currentTime;

        } else if(newStartTime !== null) {
            processedTime = startTime = newStartTime;
        }

        processPattern();
    }

    // Instruments

    function getOscillatorInstrument(type) {
        var oscillator = context.createOscillator();
        oscillator.type = type;
// TODO:  polyphony
        var gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.gainNode = gainNode;
        oscillator.play = function(frequency, start, length, gain) {
            if(frequency !== null) oscillator.frequency.value = frequency;
            if(gain !== null) gainNode.gain.value = gain;
            oscillator.start(start);
            if(length !== null) oscillator.stop(start+length);
        };
        return oscillator;
    }





    function handleStartResponse (e) {
        var commandString = e.data || e.detail;
        e.preventDefault();

        var split = commandString.split(' ');
        var type = split[0].toLowerCase();
        var offset = parseFloat(split[1]);

        console.log("TODO HANDLE AUDIO: " + commandString);

        init();
        process(offset);

    }


})();

else if (typeof module !== 'undefined') {
    var PATH = 'tests/files/music/song1.js';
    var INCLUDE = "INCLUDE " + PATH + ";";
    console.log("Loading " + PATH);

    module.exports = (function () {

        return new Song1();

        function Song1() {
            this.start = function (e, offset) {
                e.target.postMessage(INCLUDE + "START " + offset);
            };

            this.stop = function (e) {
                e.target.postMessage(INCLUDE + "STOP");
            };
        }
    })();
}
