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

var recordedFreqs = [];
var recordedFreqsSecond = new Array(100).fill(0);

var freqCallbackId;

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

function togglePause(){
    if(isPlaying){
        sourceNode.stop();
        window.cancelAnimationFrame(rafID);
        isPlaying = false;
        clearInterval(freqCallbackId)

    }else{
        playAudioSample();
    }

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

    var lpf = audioContext.createBiquadFilter();

    lpf.type = 'lowpass';
    lpf.frequency = 1000;

    sourceNode.connect(lpf);

    var gain = audioContext.createGain();

    gain.gain.value = 1.5;

    lpf.connect(gain);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    gain.connect( analyser );

    analyser.connect(audioContext.destination);

    sourceNode.start(0);
    isPlaying = true;
    updatePitch();

    freqCallbackId = setInterval(getFreq,1);

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


    //find the rms amplitude of the buffer
    for (var i=0;i<SIZE;i++) {
        var val = buf[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms/SIZE);


    //the signal level is too low, return -1 (freq not found)
    if (rms<0.01)
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



function updatePitch( time ) {
    analyser.getFloatTimeDomainData(buf);
    waveCanvas.clearRect(0,0,512,256);
    waveCanvas.strokeStyle = "black";
    waveCanvas.beginPath();
    waveCanvas.moveTo(0,buf[0]);

    for (var i=1;i<512;i++) {
        waveCanvas.lineTo(i,128+(buf[i]*128));
    }
    waveCanvas.stroke();


    console.log("vibrato rate:" + autoCorrelate(recordedFreqsSecond,100));


    $.each(recordedFreqs, function(i,f){
        if(f != -1){
            freqCanvas.beginPath();
            freqCanvas.moveTo(freqPos,512-recordedFreqs[i-1]/5);
            freqCanvas.lineTo(freqPos+1,512-f/5);
            freqCanvas.stroke();
            freqPos++;
            if(freqPos==512){
                freqPos=0;
                freqCanvas.clearRect(0,0,512,512);
            }
        }
    });
    recordedFreqs = [ac];
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = window.webkitRequestAnimationFrame;
    rafID = window.requestAnimationFrame( updatePitch );
}

//Fills frequencybufferBetweenScreens

var filterLength = 3;
var freqBuff = new Array(filterLength).fill(0);
var buffIndex = 0;
var ac,ac1;
var rfsindex = 0;
function getFreq(){
    analyser.getFloatTimeDomainData( buf );
    freqBuff[buffIndex] = autoCorrelate( buf, audioContext.sampleRate );

    buffIndex = (buffIndex +1 ) % filterLength;

    ac1 = ac;
    //get average from filter buffer for next frequency values
    ac = freqBuff.reduce(function(a,b){return a+b})/filterLength;

    recordedFreqs.push(ac);
    recordedFreqsSecond[rfsindex++%100] = ac;



}