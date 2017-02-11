/**
 * Created by Ari on 12/30/2016.
 */

// Handle client-side response
if (typeof document !== 'undefined') (function(){
    document.addEventListener('response:start', handleStartResponse);

    // Song Variables
    var iOsc0;

    // Initiate Song
    function init() {
        // Set Config Variables
        // FREQUENCY_A4 = 440;

        // Load Instruments
        iOsc0 = new OscillatorInstrument(4);
    }

    // Song Patterns

    function measure1() {
        // Queue Notes
        iOsc0.play('square', 'F4', 0.0, 0.5, 0.6);
        iOsc0.play('triangle', 'D4', 1.0);
        iOsc0.play('sine', 'B4', 2.0, 1.5, 0.6);

        // Set Measure Length
        measureCounter += 1.0;
    }

    // Song Structure



    function processMeasures() {
        measure1();
        measure1();
        measure1();

        for(var i=0; i<100; i++)
        measure1();
    }




    // Support Variables

    var audioContext;
    var songStartTime = 0;
    var measureCounter = 0;
    var AudioContext = window.AudioContext || window.webkitAudioContext;

    // Config Variables

    var FREQUENCY_A4 = 440;
    var HALF_STEP = Math.pow(2, 1/12);
    var MEASURE_LENGTH = 4;
    var BEAT_LENGTH = MEASURE_LENGTH / 4;

    // Music Variables

    var NOTE_FREQUENCIES = {
        A4: FREQUENCY_A4
    };


    // Instruments

    function OscillatorInstrument(polyCount) {

        this.play = function(type, frequency, beat, length, gainValue) {
            // Create new oscillator
            var oscillator = audioContext.createOscillator();
            oscillator.type = type;
            if(typeof frequency == 'string')
                frequency = NOTE_FREQUENCIES[frequency];
            oscillator.frequency.value = frequency;

            // Create gain node
            if(gainValue !== null) {
                var gainNode = audioContext.createGain();
                gainNode.gain.value = gainValue||1.0;
                gainNode.connect(audioContext.destination);
                oscillator.connect(gainNode);
            } else {
                oscillator.connect(audioContext.destination);
            }

            var startTime = songStartTime
                + measureCounter * MEASURE_LENGTH
                + beat * BEAT_LENGTH;
            oscillator.start(startTime);
            oscillator.stop(startTime + ((length||1.0) * BEAT_LENGTH));

            console.log("Playing Note: ", songStartTime, oscillator, arguments);
        };
    }


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
        if(!audioContext)
            audioContext = new AudioContext();
        songStartTime = newStartTime || 0; // audioContext.currentTime;

        measureCounter = 0;
        processMeasures();
    }


    // Event Listeners

    function handleStartResponse (e) {
        var commandString = e.data || e.detail;
        e.preventDefault();

        var split = commandString.split(' ');
        var type = split[0].toLowerCase();
        var offset = parseFloat(split[1]);

        init();
        calculateNoteFrequencies(FREQUENCY_A4, HALF_STEP);
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
