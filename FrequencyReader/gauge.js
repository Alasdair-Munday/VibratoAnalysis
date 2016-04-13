/**
 * Created by alasdairmunday on 14/03/16.
 *
 * a radial gauge widget built using the D3 framework
 */

function Gauge(parent, data, max, min, name){

    //setup values
    this.data = data;
    this.width = 150;
    this.height = 150;
    this.thickness = 10;
    //make diameter fit the smallest dimention
    this.diameter = this.width < this.height ? this.width - this.thickness :this.height - this.thickness ;
    this.label = name;
    this.min = min | 0;
    this.max = max | 1;
    this.parent = parent;


    //define the arc apart from the end-angle.
    var arcDef = d3.svg.arc()
        .innerRadius(this.diameter/2 - this.thickness)
        .outerRadius(this.diameter/2)
        .startAngle(0);


    //attach an svg canvas centre to the element passed to this function
    this.svg = parent.append("svg")
        //set the dimentions for this gauge
        .attr("width", this.width)
        .attr("height", this.height)
        //attach a g tag to the centre of the canvas to draw the circle from
        .append("g")
        .attr("transform", "translate("+ this.width/2 + ","+this.height/2+")");

    //append a grey circle as the background outline for the gauge
    this.svg.append("circle")
        .attr("r",(this.diameter - this.thickness)/2)
        .style("fill","#5D8680")
        .style("stroke","#B5C6C4")
        .style("stroke-width", this.thickness);

    //draw the arc path from the definition starting with an end angle of 0
    this.arc = this.svg.append("path")
        .datum({endAngle:0})
        .attr("class", "rateGauge")
        .attr("d", arcDef)
        .style("fill", "#275952");

    //print the label to the centre of the gauge
    this.text = this.svg.append("text")
        .attr("text-anchor","middle")
        .text(this.label)
        .style('fill', '#fff');


    //update the angle of the arc from the passed data
    this.setData = function (data,min,max) {
        //update values
        this.data = data;
        this.min = min || this.min;
        this.max = max || this.max;

        //find value at PI radians
        var centre = (this.min + this.max) /2;
        //find required angle
        var angle = ( Math.PI / (this.max - centre))* (data - this.min);

        //update the label
        this.text.text(this.label + ": " + data.toFixed(2));

        //transition to new value
        this.arc.transition()
            .duration(100)
            .call(gaugeTween,angle);

        return this;
    };

    function gaugeTween(transition,angle){
        //handle transition between values
        transition.attrTween("d", function(arc){
            //create function to run from old value to new value
            var interpolate = d3.interpolate(arc.endAngle,angle);
            return function(t){
                arc.endAngle = interpolate(t);
                return arcDef(arc);
            }
        })
    }

    //update the values
    this.setData(data,min,max);
}