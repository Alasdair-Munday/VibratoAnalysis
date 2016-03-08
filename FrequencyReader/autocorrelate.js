/**
 * Created by alasdairmunday on 01/03/16.
 */
(function(){

    //simple autocorrelation function
    function autoCorrelateNew(buffer, sampleRate){

        var bufferLength = buffer.length();

        //array of all the correlation values
        var correlationsArray = new Array(bufferLength);

        //build autocorrelation array
        for(var i=0; i<bufferLength; i++){
            var sum = 0;
            for(var j=0; j<bufferLength - i ; j++){
                sum += buffer[j]*buffer[j-i];
            }
            correlationsArray[i] = sum;
        }
        return correlationsArray;
    }

    //find the index of the first local peak in the autocorrelation function
    function findZeroCrossingPeriod(correlationsArray){

        var firstTwoZeroCrossings = [];

        for(var i=0; i<correlationsArray.length(); i++){
            if(correlationsArray[i] > 0){

            }
        }
    }
})();