/**
 * rendering the vibrato golf game
 */
var ball;
var hole;
var pitch;
var svg;
var width = 900;
var height = 500;
var target = {};

$(document).ready(function(){
    //draw the canvas for the golf game
    svg = d3.select(document.getElementById('golf'))
       .append("svg")
       .attr("width",width)
       .attr("height",height)
       .append("g");

    //render the golf course rectangle
    pitch = svg.append("rect")
        .attr("width",width)
        .attr("height",height)
        .attr("rx", 10)
        .attr("ry", 10)
        .style("fill", "#275952");

    //render Rate x axis label
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", height-6)
        .style("font-size", "20px")
        .style("fill","#5D8680")
        .text("Rate");

    //render Amount y axis label
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("x", -height/2)
        .attr("dy", ".75em")
        .style("font-size", "20px")
        .style("fill","#5D8680")
        .text("Amount");

    //render the hole graphic
    hole = svg.append("circle")
        .attr("cx",200)
        .attr("cy",300)
        .attr("r",80)
        .style('stroke', '#5D8680')
        .style('stroke-width', '5')
        .style('fill',"#B5C6C4");

    //render the ball graphic
    ball = svg.append("circle")
        .attr("cx",50)
        .attr("cy",50)
        .attr("r",25)
        .style('fill',"#fff");

    //position the hole at a random position on the course
    setHolePos(5,17);
});

//set the position of the ball from a vibrato rate and amount
function setBallPos(freq, amount){
    //call generic circle move function passing the ball svg
    setCirclePosition(ball, freq,amount);

    //if the ball is in the hole, move the hole to a new position
    if((freq < target.freq +0.5) &&
        (freq > target.freq -0.5) &&
        (amount < target.amount+5) &&
        (amount > target.amount-5)){
        newGoal();
    }
}

//set the position of the hole
function setHolePos(freq,amount){
    //use the generic function, passing the hole svg
    setCirclePosition(hole,freq,amount);
    target.freq = freq;
    target.amount = amount;
}

function setCirclePosition(obj,freq,amount){

    //find the x position in pixels from the passed frequency
    var xpos = width/(rateMax - rateMin) *(freq - rateMin);
    //find the y position in pixels from the passed rate
    var ypos = height/(amountMax - amountMin) * amount;

    //transition to the new position over 100ms
    obj.transition().duration(100)
        .attr("cx",xpos)
        .attr("cy",height-ypos);
}

//move the goal to a new random position
function newGoal (){
    //obtain random values within the bounds
    var randomFreq = Math.random() * (rateMax - rateMin) + rateMin;
    var randomAmount = Math.random() * (amountMax - amountMin) + amountMin;
    //update the position of the hole.
    setHolePos(randomFreq,randomAmount);
}