/**
 *
 * This file handles all the DSP required to process the vibrato
 *
 * Created by alasd on 12/02/2016.
 */


var amountMax = 60;
var amountMin = 0;
var rateMax = 10;
var rateMin = 3.5;

var freqCallbackId;

var rafID = null;
var tracks = null;
var buflen = 2048;
var buf = new Float32Array( buflen );
var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.

var rateGauge, amountGauge;

$(document).ready(function(){
    var rateEl = document.getElementById('rate-gauge');
    var amountEl = document.getElementById('amount-gauge');

    rateGauge = new Gauge(d3.select(rateEl), 0, rateMax, rateMin,"Rate");
    amountGauge = new Gauge(d3.select(amountEl),0, amountMax,amountMin, "Amount" )

});


var noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function noteFromFrequency( frequency ) {
    var note = {};

    note.frequencyActual = frequency;
    note.number =  Math.round( 12 * Math.log2(frequency / 440)) + 69;
    note.frequencyIntended = 440 * Math.pow(2,(note.number -69)/12);
    note.name = noteNames[note.number%12];
    note.centsOut = Math.floor( 1200 * Math.log( frequency / note.frequencyIntended)/Math.log(2) );

    return note;
}

function startPitchDetection(){
    clearInterval(freqCallbackId);
    freqCallbackId = setInterval(getFreq,freqBufferPeriod);
    window.cancelAnimationFrame(rafID);
    updatePitch();
}

function updatePitch( time ) {
    //get data for plots
    analyser.getFloatTimeDomainData(buf);

    var freqs = recordedFreqsSecond.slice((rfsindex+1) % freqBufferLength, recordedFreqsSecond.length - 1);
    freqs = freqs.concat(recordedFreqsSecond.slice(0,rfsindex % freqBufferLength));

    var note = noteFromFrequency(freqs[freqs.length-1]);
    $('#note').html(note.name );
    $('#freq').html(note.frequencyActual.toFixed() +"Hz");

    var vibrato = getVibrato(freqs,freqBufferSampleRate);
    if(vibrato.rate >0) {
        rateGauge.setData(vibrato.rate);
        amountGauge.setData(vibrato.amount);
        setBallPos(vibrato.rate, vibrato.amount);
    }

    waveCanvas.clearRect(0,0,512,512);

    //calculate the sample period of the frequency buffer in terms of canvas pixels
    var step = 512/freqBufferLength;


    waveCanvas.moveTo(0,vibrato.buffer[0]);
    waveCanvas.beginPath();
    //plot the graphs
    for (var i=0;i< freqBufferLength;i++) {
        waveCanvas.lineTo(i*step, 128 - vibrato.buffer[Math.floor(i)]*128);
    }
    waveCanvas.stroke();

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = window.webkitRequestAnimationFrame;

    window.requestAnimationFrame( updatePitch );
}


var filterLength = 5;
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

    if(Math.abs(ac - ac1) < 20)
        recordedFreqs.push(ac);

    recordedFreqsSecond[rfsindex++ % freqBufferLength] = ac;

}


