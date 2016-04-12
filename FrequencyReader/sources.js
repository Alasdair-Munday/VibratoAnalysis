/**
 *
 * This File Handles setting up the different audio sources and processing button clicks on the view.
 *
 * Created by alasdairmunday on 10/03/16.
 */

//compatibility fix for safari
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

//declare global variables
var audioContext = null;
var analyser = null;
var gain = null;
var mediaStreamSource = null;
var waveCanvas;
var sourceNode =  null;
var isPlaying = false;
var uploadedAudioFile = null;
var audioElement = null;
var recordedFreqs = [];
var freqBufferLength = 30;
var freqBufferPeriod = 20;
var freqBufferSampleRate = 1/(freqBufferPeriod/1000);
var recordedFreqsSecond = new Array(freqBufferLength).fill(0);
var oscPlaying = false;
var osc = null;
var exampleUrl = "247561__bwv662__overall-quality-of-single-note-cello-g4.wav";

//script to run when page loads
window.onload = function() {

    //create audiocontext object
    audioContext = new AudioContext();

    //locate audio element
    audioElement = document.getElementById("audioPlayer");
    //setup example sound file
    audioElement.src= exampleUrl;
    //web audio node from audio element
    uploadedAudioFile = audioContext.createMediaElementSource(audioElement);

    //setup styling for waveform canvas
    waveCanvas = document.getElementById('waveform').getContext("2d");
    waveCanvas.strokeStyle = "#FFF";
    waveCanvas.lineWidth = 3;


    //setup the analyser for the sources to connect to
    gain = audioContext.createGain();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    gain.connect( analyser );
    analyser.connect(audioContext.destination);

};

//Function called when changing tab
function setView(viewString){
    if(viewString == "readout"){
        //show readout and hide golf
        $("#readout-tab").addClass("active");
        $("#golf-tab").removeClass("active");
        $("#golf").hide();
        $("#readout").show();
    }else{
        //show golf and hide readout
        $("#readout-tab").removeClass("active");
        $("#golf-tab").addClass("active");
        $("#golf").show();
        $("#readout").hide();
    }
}

//function called when selected file changes
function loadFile(obj) {
    //create url for linked file and write it to the src attribute of the audio tag
    audioElement.src = URL.createObjectURL(obj.files[0]);
}

function toggleLiveInput() {
    if(!isPlaying) {
        //get microphone input
        navigator.getUserMedia(
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
            }, gotStream, error);
    }else{
        clearInterval(freqCallbackId);
        mediaStreamSource.disconnect();
        isPlaying = false;
    }
}

//called when microphone could not be obtained
function error() {
    alert("Could not access microphone. Make sure you are using chrome and your url starts with https://");
}

//called when microphone successfully obtained
function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);
    //connect the microphone to the analyser
    mediaStreamSource.connect( gain );

    //start detecting vibrato
    startPitchDetection();
    isPlaying = true;
}

function toggleOsc(){
    //start an oscilator if there isnt one playing
    if(!oscPlaying){
        //if an osc hasnt been made, create one
        if(!osc)
            createOsc();

        //connect the osc to the output
        osc.connect(gain);
        //make sure the volume is safe for the high gain output
        gain.gain.value = 0.3;
        //start analysing pitch
        startPitchDetection();
        oscPlaying = true;
    }else{
        //stop analysing pitch
        clearInterval(freqCallbackId);
        oscPlaying = false;
        //disconnect the osc from the analyser.
        osc.disconnect();
    }
}

function createOsc(){
    //setup oscillator
    osc = audioContext.createOscillator();
    osc.frequency.value = 250;
    osc.start();

    //setup vibrato (lfo controlled detune)
    var vib = audioContext.createOscillator();
    var vibGain = audioContext.createGain();
    vib.frequency.value = 6; //hz
    vib.connect(vibGain);
    vibGain.gain.value = 5;
    vibGain.connect(osc.frequency);
    vib.start();
}

function playUploadedFile(){
    if(isPlaying){
        audioElement.pause();
        clearInterval(freqCallbackId);
        isPlaying=false;
        sourceNode.disconnect();
    }else{
        sourceNode = uploadedAudioFile;
        sourceNode.loop = true;
        sourceNode.connect(gain);
        gain.gain.value=0.9;

        audioElement.play();
        isPlaying = true;
        startPitchDetection();
    }

}