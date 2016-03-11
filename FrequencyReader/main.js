/**
 * Created by alasdairmunday on 10/03/16.
 */

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = null;
var analyser = null;
var mediaStreamSource = null;
var acfCanvas;

var sourceNode =  null;

var isPlaying = false;

var sampleNoteBuffer = null;

var recordedFreqs = [];

var freqBufferLength = 50;
var freqBufferPeriod = 10;
var freqBufferSampleRate = 1/(freqBufferPeriod/1000);


var recordedFreqsSecond = new Array(freqBufferLength).fill(0);

var freqCallbackId;

window.onload = function() {
    audioContext = new AudioContext();

    acfCanvas = document.getElementById('acf').getContext("2d");
    acfCanvas.strokeStyle = "#D5D5D5";
    acfCanvas.lineWidth = 3;

    var request = new XMLHttpRequest();
    request.open("GET", "153769__carlos-vaquero__violoncello-d-4-tenuto-vibrato.wav",true);
    request.responseType = "arraybuffer";
    request.onload = function (){
        audioContext.decodeAudioData(request.response, function(buffer){
            sampleNoteBuffer = buffer;
            console.log("file loaded");

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

    var noiseReduction = audioContext.createBiquadFilter();

    noiseReduction.type = 'lowpass';
    noiseReduction.frequency = 800;

    // Connect it to the destination.
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    mediaStreamSource.connect( analyser );
    updatePitch();
    freqCallbackId = setInterval(getFreq,freqBufferPeriod);

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

function toggleOsc(){
    var osc = audioContext.createOscillator();
    osc.frequency.value = 250;

    osc.type = 'sawtooth';

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    osc.connect( analyser );
    osc.start();

    var vib = audioContext.createOscillator();
    var vibGain = audioContext.createGain();

    vib.frequency.value = 6; //hz
    vib.connect(vibGain);
    vibGain.gain.value = 3;
    vibGain.connect(osc.frequency);

    vib.start();

    var amp = audioContext.createGain();
    amp.gain.value = 0.1;

    osc.connect(amp);

    // amp.connect(audioContext.destination);
    updatePitch();


    freqCallbackId = setInterval(getFreq,freqBufferPeriod);

}

function playAudioSample(){
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = sampleNoteBuffer;
    sourceNode.loop = true;

    var lpf = audioContext.createBiquadFilter();

    lpf.type = 'lowpass';
    lpf.frequency = 1000;

    var gain = audioContext.createGain();
    gain.gain.value = 1.5;

    sourceNode.connect(gain);

    //lpf.connect(gain);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    gain.connect( analyser );

    analyser.connect(audioContext.destination);

    sourceNode.start(0);
    isPlaying = true;
    updatePitch();

    freqCallbackId = setInterval(getFreq,freqBufferPeriod);

}