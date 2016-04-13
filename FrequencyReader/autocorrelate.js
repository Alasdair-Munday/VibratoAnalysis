/**
 *
 * The DSP algorithms
 *
 * AutoCorrelation function adapted from https://github.com/cwilso/PitchDetect/blob/master/js/pitchdetect.js (The MIT License (MIT) Copyright (c) 2014 Chris Wilson)
 */
function autoCorrelate( buf, sampleRate, minFreq, maxFreq ) {

    //set passed or default min/max freq
    minFreq = minFreq || 80; //Hz
    maxFreq = maxFreq || 400; //Hz

    //calculate the maximum and minimum window widths
    var maxPeriod = Math.floor(sampleRate/minFreq);
    var minPeriod = Math.floor(sampleRate/maxFreq);

    //set up the variables for the algorithm
    var bufferLength = buf.length;
    var MAX_SAMPLES = Math.floor(bufferLength/2);
    var best_offset = -1;
    var best_correlation = 0;
    var rms = 0;
    var foundGoodCorrelation = false;
    var correlations = new Array(MAX_SAMPLES);

    //find the rms amplitude of the buffer
    for (var i=0;i<bufferLength;i++) {
        var val = buf[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms/bufferLength);

    //the signal level is too low, return -1 (freq not found)
    if (rms < 0.01)
        return -1;

    var lastCorrelation=1;
    for (var offset = minPeriod; offset < maxPeriod; offset++) {
        var correlation = 0;

        //find average difference value for current offset
        for (var i=0; i<MAX_SAMPLES; i++) {
            correlation += Math.abs((buf[i])-(buf[i+offset]));
        }
        correlation = 1 - (correlation/MAX_SAMPLES);
        correlations[offset] = correlation;

        //if a minimum acceptable correlation has been found and it's stronger than the last one
        if ((correlation>0.9) && (correlation > lastCorrelation)) {
            foundGoodCorrelation = true;
            if (correlation > best_correlation) {
                best_correlation = correlation;
                best_offset = offset;
            }

        } else if (foundGoodCorrelation) {
            //a good correlation was found last time but not this time so take that correlation, interpolated between the surrounding values
            var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];
            return sampleRate/(best_offset+(8*shift));
        }
        lastCorrelation = correlation;
    }
    //periodicity could not be found, no frequency can be inferred
    return -1;
}

//
function getVibrato(buffer, sampleRate){
    var vib = {};

    var max = Math.max.apply(null,buffer);
    var min = Math.min.apply(null,buffer);
    vib.amountHz = max - min; //Hz
    vib.amount = 1200 * Math.log2( max / min);

    //find centre
    var avg = (min+max)/2;

    //centre and scale buffer to (-1 -> 1)
    for(var i= 0; i< buffer.length; i++){
        buffer[i] -= avg;
        buffer[i] = buffer[i]/vib.amount;
    }

    //autocorrelate transformed buffer
    vib.rate =  autoCorrelate(buffer,sampleRate, 4, 10);
    vib.buffer = buffer;

    //return vibrato object
    return vib;
}
