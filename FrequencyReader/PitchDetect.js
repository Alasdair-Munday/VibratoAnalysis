/**
 * Created by alasd on 12/02/2016.
 */

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = null;
var analyser = null;
var DEBUGCANVAS = null;
var FCANVAS = null;
var mediaStreamSource = null;
var waveCanvas,
    freqCanvas;

var sourceNode =  null;

var isPlaying = false;

var sampleNoteBuffer = null;

var freqPos = 0;

window.onload = function() {
    audioContext = new AudioContext();
    MAX_SIZE = Math.max(4,Math.floor(audioContext.sampleRate/5000));	// corresponds to a 5kHz signal

    DEBUGCANVAS = document.getElementById( "waveform" );
    if (DEBUGCANVAS) {
        waveCanvas = DEBUGCANVAS.getContext("2d");
        waveCanvas.strokeStyle = "black";
        waveCanvas.lineWidth = 1;
    }

    FCANVAS = document.getElementById("Fo");
    if (FCANVAS) {
        freqCanvas = FCANVAS.getContext("2d");
        freqCanvas.strokeStyle = "black";
        freqCanvas.lineWidth = 1;
    }

    var request = new XMLHttpRequest();
    request.open("GET", "153769__carlos-vaquero__violoncello-d-4-tenuto-vibrato.wav",true);
    request.responseType = "arraybuffer";
    request.onload = function (){
        audioContext.decodeAudioData(request.response, function(buffer){
            sampleNoteBuffer = buffer;
            console.log("file loaded");
            playAudioSample();


        })
    };
    request.send();


};

function error() {
    alert('Stream generation failed.');
}

function getUserMedia(dictionary, callback) {
    try {
        navigator.getUserMedia =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;
        navigator.getUserMedia(dictionary, callback, error);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}

function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);

    // Connect it to the destination.
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    mediaStreamSource.connect( analyser );
    updatePitch();
}



function toggleLiveInput() {
    if(!isPlaying) {
        getUserMedia(
            {
                "audio": {
                    "mandatory": {
                        "googEchoCancellation": "false",
                        "googAutoGainControl": "false",
                        "googNoiseSuppression": "false",
                        "googHighpassFilter": "false"
                    },
                    "optional": []
                }
            }, gotStream);
        isPlaying = true;
    }
}

function playAudioSample(){
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = sampleNoteBuffer;
    sourceNode.loop = true;

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    sourceNode.connect( analyser );

    analyser.connect(audioContext.destination);

    sourceNode.start(0);

    updatePitch();


}


var rafID = null;
var tracks = null;
var buflen = 1024;
var buf = new Float32Array( buflen );

var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteFromPitch( frequency ) {
    var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
    return Math.round( noteNum ) + 69;
}

function frequencyFromNoteNumber( note ) {
    return 440 * Math.pow(2,(note-69)/12);
}

function centsOffFromPitch( frequency, note ) {
    return Math.floor( 1200 * Math.log( frequency / frequencyFromNoteNumber( note ))/Math.log(2) );
}


var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.

function autoCorrelate( buf, sampleRate ) {
    var SIZE = buf.length;
    var MAX_SAMPLES = Math.floor(SIZE/2);
    var best_offset = -1;
    var best_correlation = 0;
    var rms = 0;
    var foundGoodCorrelation = false;
    var correlations = new Array(MAX_SAMPLES);

    for (var i=0;i<SIZE;i++) {
        var val = buf[i];
        rms += val*val;
    }
    rms = Math.sqrt(rms/SIZE);
    if (rms<0.01) // not enough signal
        return -1;

    var lastCorrelation=1;
    for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
        var correlation = 0;

        for (var i=0; i<MAX_SAMPLES; i++) {
            correlation += Math.abs((buf[i])-(buf[i+offset]));
        }
        correlation = 1 - (correlation/MAX_SAMPLES);
        correlations[offset] = correlation; // store it, for the tweaking we need to do below.
        if ((correlation>0.9) && (correlation > lastCorrelation)) {
            foundGoodCorrelation = true;
            if (correlation > best_correlation) {
                best_correlation = correlation;
                best_offset = offset;
            }
        } else if (foundGoodCorrelation) {
            // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
            // Now we need to tweak the offset - by interpolating between the values to the left and right of the
            // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
            // we need to do a curve fit on correlations[] around best_offset in order to better determine precise
            // (anti-aliased) offset.

            // we know best_offset >=1,
            // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and
            // we can't drop into this clause until the following pass (else if).
            var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];
            return sampleRate/(best_offset+(8*shift));
        }
        lastCorrelation = correlation;
    }
    if (best_correlation > 0.01) {
        // console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
        return sampleRate/best_offset;
    }
    return -1;
//	var best_frequency = sampleRate/best_offset;
}


var filterLength = 20;
var freqBuff = new Array(filterLength).fill(0);
var buffIndex = 0;
var ac,ac1;
function updatePitch( time ) {
    analyser.getFloatTimeDomainData( buf );

    freqBuff[buffIndex] = autoCorrelate( buf, audioContext.sampleRate );

    buffIndex = (buffIndex +1 ) % filterLength;

    ac1 = ac;
    ac = freqBuff.reduce(function(a,b){return a+b})/filterLength;

    waveCanvas.clearRect(0,0,512,256);
    waveCanvas.strokeStyle = "red";
    waveCanvas.beginPath();
    waveCanvas.moveTo(0,0);
    waveCanvas.lineTo(0,256);
    waveCanvas.moveTo(128,0);
    waveCanvas.lineTo(128,256);
    waveCanvas.moveTo(256,0);
    waveCanvas.lineTo(256,256);
    waveCanvas.moveTo(384,0);
    waveCanvas.lineTo(384,256);
    waveCanvas.moveTo(512,0);
    waveCanvas.lineTo(512,256);
    waveCanvas.stroke();
    waveCanvas.strokeStyle = "black";
    waveCanvas.beginPath();
    waveCanvas.moveTo(0,buf[0]);

    for (var i=1;i<512;i++) {
        waveCanvas.lineTo(i,128+(buf[i]*128));
    }
    waveCanvas.stroke();

    if(ac != -1){
        freqCanvas.beginPath();
        freqCanvas.moveTo(freqPos,512-ac1/5);
        freqCanvas.lineTo(freqPos+1,512-ac/5);
        freqCanvas.stroke();
        freqPos++;
        if(freqPos==512){
            freqPos=0;
            freqCanvas.clearRect(0,0,512,512);
        }
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = window.webkitRequestAnimationFrame;
    rafID = window.requestAnimationFrame( updatePitch );
}
