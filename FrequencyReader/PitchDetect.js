/**
 * Created by alasd on 12/02/2016.
 */




var rafID = null;
var tracks = null;
var buflen = 2048;
var buf = new Float32Array( buflen );
var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.
function updatePitch( time ) {

    //get data for plots
    analyser.getFloatTimeDomainData(buf);

    var freqs = recordedFreqsSecond.slice((rfsindex+1) % freqBufferLength, recordedFreqsSecond.length - 1);
    freqs = freqs.concat(recordedFreqsSecond.slice(0,rfsindex % freqBufferLength));

    var vibrato = getVibrato(freqs,freqBufferSampleRate);
    if(vibrato.rate >0) {
        $('#vibrato-rate').html("Vibrato Rate:" + vibrato.rate.toFixed(2) + "Hz");
        $('#vibrato-amount').html("Vibrato Amount:" + vibrato.amount.toFixed(2) +"Hz")
    }

    acfCanvas.clearRect(0,0,512,512);


    //calculate the sample period of the frequency buffer in terms of canvas pixels
    var step = 512/freqBufferLength;


    acfCanvas.moveTo(0,vibrato.buffer[0]);
    acfCanvas.beginPath();
    //plot the graphs
    for (var i=0;i< freqBufferLength;i++) {
        acfCanvas.lineTo(i*step, 128 - vibrato.buffer[Math.floor(i)]*128);
    }
    acfCanvas.stroke();

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = window.webkitRequestAnimationFrame;
    rafID = window.requestAnimationFrame( updatePitch );
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
