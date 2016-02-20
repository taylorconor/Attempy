var width = $("#diagram").width(),
    height = $("#diagram").height();

var color = d3.scale.category20();

var cola = cola.d3adaptor()
    .linkDistance(120)
    .avoidOverlaps(true)
    .size([width, height]);

var svg = d3.select("#diagram").append("svg")
    .attr("width", width)
    .attr("height", height);



svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("refX", 6 + 3) /*must be smarter way to calculate shift*/
    .attr("refY", 2)
    .attr("markerWidth", 60)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .style("fill", "white")
    .append("path")
        .attr("d", "M 0,0 V 4 L12,12 Z"); //this is actual shape for arrowhead


function init(error, graph) {


    cola
        .nodes(graph.nodes)
        .links(graph.links)
        .start();

    var link = svg.selectAll(".link")
        .data(graph.links)
      .enter().append("line")
        .attr("class", "link")
        .style("stroke-dasharray", function(d) {
            return d.dotted ? ("3,3"):("0,0");
        })
        .attr("marker-end", "url(#arrowhead)");

    var node = svg.selectAll(".node")
        .data(graph.nodes)
      .enter().append("rect")
        .attr("class", function(d) {return d.type; })
        .attr("width", function (d) { return d.width; })
        .attr("height", function (d) { return d.height; })
        .attr("rx", 5).attr("ry", 5)
        .style("fill", function (d) { return d.color; })
        .call(cola.drag);

    var label = svg.selectAll(".label")
        .data(graph.nodes)
       .enter().append("text")
        .attr("class", "label")
        .text(function (d) { return d.name; })
        .call(cola.drag);

    node.append("title")
        .text(function (d) { return d.name; });

    cola.on("tick", function () {
        link.attr("x1", function (d) { 
                switch(d.linkNum){
                    case 0:
                        return d.source.x;
                    case 1:
                        return d.source.x + d.source.width;
                    case 2:
                        return d.source.x + d.source.width/2;
                    case 3  :
                        return d.source.x + d.source.width/2;

                }
                return d.source.x; 
            })
            .attr("y1", function (d) { 
                switch(d.linkNum){
                    case 2:
                        return d.source.y - d.source.height/2;
                    case 3  :
                        return d.source.y + d.source.height/2;

                }
                return d.source.y; 
            })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        node.attr("x", function (d) { return d.x - d.width / 2; })
            .attr("y", function (d) { return d.y - d.height / 2; })
            .attr("transform", function (d) { 
                if(d.rotate > 0){
                    return 'rotate('+d.rotate+', '+ (d.x + d.height/(90/d.rotate)) + ','+ (d.y + d.width/(90/d.rotate))+')'; 
                }
                else{
                    return "rotate(0)";
                }
            })
            .attr("id", function (d, i) {
                return i;
            });

        label.attr("x", function (d) { return d.x; })
             .attr("y", function (d) {
                 var h = this.getBBox().height;
                 return d.y + h/4;
             })
             .attr("transform", function (d) { 
                if(d.rotate > 0){
                    return 'translate('+(d.width/(90/d.rotate)) + ','+ (-d.height/(90*2/d.rotate))+')'; 
                }
                else{
                    return "rotate(0)";
                }
            });
    });

    initMenu();
}
