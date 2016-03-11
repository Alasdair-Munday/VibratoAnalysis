function autoCorrelate( buf, sampleRate, minFreq, maxFreq ) {

    minFreq = minFreq || 80; //Hz
    maxFreq = maxFreq || 400; //Hz

    var maxPeriod = Math.floor(sampleRate/minFreq);
    var minPeriod = Math.floor(sampleRate/maxFreq);


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
    if (rms < 0.01)
        return -1;

    var lastCorrelation=1;
    for (var offset = minPeriod; offset < maxPeriod; offset++) {
        var correlation = 0;

        for (var i=0; i<MAX_SAMPLES; i++) {
            correlation += Math.abs((buf[i])-(buf[i+offset]));
        }
        correlation = 1 - (correlation/MAX_SAMPLES);
        correlations[offset] = correlation;


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

function getVibrato(buffer, sampleRate){
    //find average value
    var vib = {};

    //find range
    var max = Math.max.apply(null,buffer);
    var min = Math.min.apply(null,buffer);
    vib.amount = max - min; //Hz

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
