var chartinit = function(workouts) {
    
    width = 380;
    height = 200;
    
    data = [];
    for(var i = 0; i < workouts.length; i++) data[i] = 
      workouts.at(i).get("weight") 
      * workouts.at(i).get("reps")
      * workouts.at(i).get("sets");
    // Create the initial SVG container for the chart
    chart.svg = d3.select('#chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('id', 'chartSVG');
    
    // Define the X and Y scales
    chart.x = d3.scale.linear()
        .domain([0, data.length])
        .range([0, width]);
    
    chart.y = d3.scale.linear()
        .domain([Math.max.apply(Math, data), 0])
        .range([0,height]);
    
    // Define the line generator
    chart.lineGen = d3.svg.line()
        .x(function(d, i) {
            return chart.x(i);
        })
        .y(function(d) {
            return chart.y(d);
        });
        
    var xAxis = d3.svg.axis()
        .scale(chart.x)
        .orient("bottom")
        .ticks(5);

    var yAxis = d3.svg.axis()
        .scale(chart.y)
        .orient("left")
        .ticks(5);



  chart.svg.append("g")
  .attr("class", "axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);

chart.svg.append("g")
  .attr("class", "axis")
  .call(yAxis)

    
    
    // Generate a line graph in the SVG container,
    // using the initial data
    chart.line = chart.svg
        .append('svg:path')
        .attr('d', chart.lineGen(data));
        
   
  };

var redraw = function(workouts) {
  width = 380;
  height = 200;
  
  data = [];
  for(var i = 0; i < workouts.length; i++) data[i] = workouts.at(i).get("weight") 
    * workouts.at(i).get("reps")
    * workouts.at(i).get("sets");
  // update the x and y scales with the new data
  chart.x = d3.scale.linear()
      .domain([0, data.length])
      .range([0,width]);
  
  chart.y = d3.scale.linear()
      .domain([Math.max.apply(Math, data) + 1, 0])
      .range([0,height]);
  
         // Define the line generator
  chart.lineGen = d3.svg.line()
      .x(function(d, i) {
          return chart.x(i);
      })
      .y(function(d) {
          return chart.y(d);
      });
  
  // rather than add a new line, we can just use transitions
  // and update the 'd' attribute of the SVG path used to
  // originally generate the line
  chart.line
      .transition()
      .duration(300)
      .attr('d', chart.lineGen(data));
};
