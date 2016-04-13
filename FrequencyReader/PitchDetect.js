/**
 *
 * This file handles the view and the
 *
 * Created by alasd on 12/02/2016.
 */

//setup parameters of vibrato detection
var amountMax = 40;
var amountMin = 10;
var rateMax = 8;
var rateMin = 4;

if (!window.requestAnimationFrame)
    window.requestAnimationFrame = window.webkitRequestAnimationFrame;

//id of the frequency detection loop
var freqCallbackId;
//id of the waveform animation loop
var waveformCallbackId = null;

//create the buffer that holds the input samples
var buflen = 2048;
var buf = new Float32Array( buflen );

//the interface gauge elements
var rateGauge, amountGauge;

$(document).ready(function(){
    //locate gauges in DOM
    var rateEl = document.getElementById('rate-gauge');
    var amountEl = document.getElementById('amount-gauge');

    //draw gauges
    rateGauge = new Gauge(d3.select(rateEl), 0, rateMax, rateMin,"Rate");
    amountGauge = new Gauge(d3.select(amountEl),0, amountMax,amountMin, "Amount" )

});


//the possible semitone notes
var noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function noteFromFrequency( frequency ) {

    //build an object with information about the current note
    var note = {};
    note.frequencyActual = frequency;
    //the closest whole midi number(440 as ref freq requires +69 offset)
    note.number =  Math.round( 12 * Math.log2(frequency / 440)) + 69;
    //the frequency of the closest midi integer
    //note.frequencyIntended = 440 * Math.pow(2,(note.number -69)/12);
    //the string from note names that matches the midi number
    note.name = noteNames[note.number%12];
    //the number of cents away from the intended frequency
    //note.centsOut = Math.floor( 1200 * Math.log( frequency / note.frequencyIntended)/Math.log(2) );

    return note;
}

function startPitchDetection(){
    //make sure any previous loops are cancelled
    clearInterval(freqCallbackId);
    window.cancelAnimationFrame(waveformCallbackId);

    //start loops for new inputs.
    freqCallbackId = setInterval(getFreq,freqBufferPeriod);
    updateView();
}

function updateView(time ) {

    //unfurl  frequency buffer into chronological order
    var freqs = recordedFreqs.slice((recordedFreqsIndex+1) % freqBufferLength, recordedFreqs.length - 1);
    freqs = freqs.concat(recordedFreqs.slice(0,recordedFreqsIndex % freqBufferLength));

    //print the note name and frequency to the view
    var note = noteFromFrequency(freqs[freqs.length-1]);
    $('#note').html(note.name );
    $('#freq').html(note.frequencyActual.toFixed() +"Hz");

    //detect vibrato values
    var vibrato = getVibrato(freqs,freqBufferSampleRate);

    //if vibrato is detected
    if(vibrato.rate > 0 && vibrato.amount) {
        //update gauges
        rateGauge.setData(vibrato.rate);
        amountGauge.setData(vibrato.amount);
        //update ball position in golf game
        setBallPos(vibrato.rate, vibrato.amount);
    }

    //clear the canvas ready for the next frame
    waveCanvas.clearRect(0,0,512,512);

    //calculate the sample period of the frequency buffer in terms of canvas pixels
    var step = 512/freqBufferLength;

    //move to first frequency point
    waveCanvas.moveTo(0,vibrato.buffer[0]);

    //plot the vibrato waveform path
    waveCanvas.beginPath();
    for (var i=0;i< freqBufferLength;i++) {
        waveCanvas.lineTo(i*step, 128 - vibrato.buffer[Math.floor(i)]*128);
    }
    //print the path to the canvas
    waveCanvas.stroke();

    //re-call this on next frame
    window.requestAnimationFrame( updateView );
}

//the order of the moving avg filter
var filterLength = 5;
//buffer for the filter
var freqBuff = new Array(filterLength).fill(0);
var buffIndex = 0;
var recordedFreqsIndex = 0;
function getFreq(){
    //apply simple moving average filter to frequency values to remove transients
    analyser.getFloatTimeDomainData( buf );
    freqBuff[buffIndex] = autoCorrelate( buf, audioContext.sampleRate );
    buffIndex = (buffIndex +1 ) % filterLength;

    //get average from filter buffer for next frequency values
    recordedFreqs[recordedFreqsIndex++ % freqBufferLength] = freqBuff.reduce(function (a, b) {
            return a + b
        }) / filterLength;

}


