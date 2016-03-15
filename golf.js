/**
 * Created by alasdairmunday on 14/03/16.
 */
var ball;
var hole;
var pitch;
var svg;
var width = 900;
var height = 500;

$(document).ready(function(){
    svg = d3.select(document.getElementById('golf'))
       .append("svg")
       .attr("width",width)
       .attr("height",height)
       .append("g");


    pitch = svg.append("rect")
        .attr("width",width)
        .attr("height",height)
        .attr("rx", 10)
        .attr("ry", 10)
        .style("fill", "#275952");

    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", height-6)
        .style("font-size", "20px")
        .style("fill","#5D8680")
        .text("Rate");

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



    hole = svg.append("circle")
        .attr("cx",200)
        .attr("cy",300)
        .attr("r",40)
        .style('stroke', '#5D8680')
        .style('stroke-width', '5')
        .style('fill',"#B5C6C4");



    ball = svg.append("circle")
        .attr("cx",50)
        .attr("cy",50)
        .attr("r",25)
        .style('fill',"#fff");


    setHolePos(6,18)
});


function setBallPos(freq, amount){
    setCirclePosition(ball, freq,amount);
}

function setHolePos(freq,amount){
    setCirclePosition(hole,freq,amount);
}

function setCirclePosition(obj,freq,amount){
    var xpos = width/(rateMax - rateMin) *(freq - rateMin);

    var ypos = height/(amountMax - amountMin) * amount;

    obj.transition().duration(100)
        .attr("cx",xpos)
        .attr("cy",height-ypos);
}