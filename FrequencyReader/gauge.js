/**
 * Created by alasdairmunday on 14/03/16.
 */

function Gauge(parent, data, max, min, name){
    this.data = data;
    this.width = 150;
    this.height = 150;
    this.padding = 10;
    this.diameter = this.width < this.height ? this.width - this.padding :this.height - this.padding ;
    this.label = name;
    this.fontSize = 10;
    this.min = min | 0;
    this.max = max | 1;
    this.parent = parent;


    var arcDef = d3.svg.arc()
        .innerRadius(this.diameter/2 - this.padding)
        .outerRadius(this.diameter/2)
        .startAngle(0);


    this.svg = parent.append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .append("g")
        .attr("transform", "translate("+ this.width/2 + ","+this.height/2+")");

    this.arc = this.svg.append("path")
        .datum({endAngle:0})
        .attr("class", "rateGauge")
        .attr("d", arcDef)
        .style("fill", "#275952");

    this.text = this.svg.append("text")
        .attr("text-anchor","middle")
        .text(this.label)
        .style('fill', '#fff');

    this.setData = function (data,min,max) {

        this.data = data;

        if(min)
            this.min = min;
        if(max)
            this.max = max;

        var centre = (this.min + this.max) /2;
        var angle = ( Math.PI / (this.max - centre))* (data - centre);

        this.text.text(this.label + ": " + data.toFixed(2));
        this.arc.transition()
            .duration(10)
            .call(gaugeTween,angle);

        return this;

    };

    function gaugeTween(transition,angle){
        transition.attrTween("d", function(arc){
            var interpolate = d3.interpolate(arc.endAngle,angle);
            return function(t){
                arc.endAngle = interpolate(t);
                return arcDef(arc);
            }
        })
    }

    this.setData(data,min,max);
}