var excrChart = function(){
  var movColors = {};

  function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  } // TODO modularize banner and chart so there are no repetitsious functions

  function rectX(day) {
    return function(mov){
      return x(day['date'].slice(0, -5));
    }
  }

  function rectY(currStart, day) {
    var c = currStart;
    return function(movement){
      var numReps = 0;
      if (movement['srw']['s'] !== '' && movement['srw']['r'] !== '' ){
           numReps = +movement['srw']['s'] * +movement['srw']['r'];
      }
       var r =  y(c + numReps);
       c += numReps;
       return r;
    }
  }

  function rectHeight() {
    return function(mov){
         var numReps = 0;
          if (mov['srw']['s'] !== '' && mov['srw']['r'] !== '' ){
            numReps = +mov['srw']['s'] * +mov['srw']['r'];
          }
        return height - y(numReps);
    }
  }

  // init d3 stuff
  var $ex = $('#excr-chart');
  var margin = {top: 5, right: 1, bottom: 20, left: 30},
  width = $ex.width() - margin.left - margin.right,
  height = $ex.width()*.618 - margin.top - margin.bottom;
  console.log(width);
  console.log(height);
  $tooltip = $('<div id=\'excr-chart-container-tooltip\' class=\'tooltip\' ><a class=\"close\" style=\"color:white\"'+
  '>×</a><p></p></div>');
  $('#excr-chart-container').prepend($tooltip)
  $tooltip.find('.close').click(function(){
    $tooltip.removeClass('visible-tooltip');
  });

  var y = d3.scale.linear()
  .range([height, 0]);

  var x = d3.scale.ordinal()
  .rangeBands([0, width], 0.07, 2);

  var yAxis = d3.svg.axis()
  .scale(y)
  .orient("left");

  var xAxis = d3.svg.axis()
  .scale(x)
  .orient("bottom");

  var chart = d3.select(".excr-chart")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // get data
  d3.csv("/assets/exData2015.csv", function(d) {
    // parse csv to a day objects
    var day = {date: d['Date'], movements: {}},
    movements = _.omit(d, ['Date', "Runs s", "Runs r", "Runs w"]);
    // runs are eliminated above but some days only have runs
    // those days are removed/filtered in the next callback

    $.each(movements, function(key, val){
      var name = key.slice(0, -1),
      nkey = key.slice(-1); // either sets, reps, or weight
      if (day['movements'].hasOwnProperty(name)){
        day['movements'][name][nkey] = val;
      }else{
        day['movements'][name] = {};
        day['movements'][name][nkey] = val;
      }
    });

    return day;

  },
  function(error, preFilterDays) {
    // console.log(preFilterDays);

    // filter out days of just runs
    noRunsdays = preFilterDays.filter(filterRuns);

    // limit to 60 days
    days = noRunsdays.slice(0,noRunsdays.length-1);

    // TODO set slider clicks

    // create a random color for each type of movement
    _.mapObject(days[0].movements, function(val, key){
      movColors[key] = getRandomColor();
    });

    // set x&y scales
    y.domain([0, d3.max(days, function(day) {
      var numReps = 0;
      $.each(day['movements'], function(movement, srw){
        if (srw['s'] !== '' && srw['r'] !== '' ){
          numReps += +srw['s'] * +srw['r'];
        }
      });
      return numReps;
    })]);

    x.domain(days.map(function(day) {
      return day['date'].slice(0,-5);
    }));

    xAxis.tickValues(x.domain().filter(function(d,i){
        if ( i % 21 === 0){
          return d;
        }
      }));

    yAxis.ticks(5);

    // add axes
    chart.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("total reps per day");

    chart.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    // graph bars
    var bars = chart.selectAll(".bar") // bar containing sets of rects
    .data(days)
    .enter().append("g")
    .attr("id", function(day) {
      // console.log(day);
      return day['date'];})
    .attr("class", "bar");


    bars.each(
      function(day){

        // convert day.movements to an array
        var movements = [];
        _.mapObject(day.movements, function(srw, name){
          movements.push({name: name, srw: srw, date: day['date']});
        });

        var
          posx = rectX(day),
          posy = rectY(0), // each day starts at 0 sets
          hei  = rectHeight();

        var sets = d3.select(this)
        .selectAll('rect')
        .data(movements)
        .enter()
        .append('rect')
        .attr('x', posx)
        .attr('y', posy)
        .attr('width', x.rangeBand() )
        .attr('height', hei)
        .attr('fill', function(mov){
          return movColors[mov.name];
        })
        .attr('id', function(mov){
          return mov.name+mov.date
        })
        .on("mouseover", mapMouseOver)
        .on("click", mapMouseOver)
        .on("mouseout", mapMouseOut);

      });


  });

  function filterRuns(day, index, array){
    // get rid of days with no movements (other than runs that were already removed)
    // in the previous callback (csv parsing)
    var someMovement = false;

    $.each(day['movements'], function(movement, srw){
      if (srw['s'] !== ''){
        someMovement = true;
      }
    });

    return someMovement;
  }

  function mapMouseOver(d) {
    var idstring = "[id='"+d.name+d.date+"']";
    var rect = d3.selectAll($(idstring));
    rect.style('stroke', "blue");
    rect.style('opacity', 0.5);
    $tp = $tooltip.find("p");
    $tp.html(d.date+'<br>'+
    '<span style="color:'+movColors[d.name]+'; font-weight:bold;"> '+
    d.name+'</span><br>'+
    'sets: '+d.srw['s']+'<br>'+
    'reps: '+d.srw['r']+'<br>'+
    'weight: '+d.srw['w']);
    $tooltip.addClass("visible-tooltip");
  }
  function mapMouseOut(d) {
    var idstring = "[id='"+d.name+d.date+"']";
    var rect = d3.selectAll($(idstring));
    rect.style('stroke', "none");
    rect.style('opacity', 1.0);
    // $tp = $tooltip.find("p");
    // $tp.html('');
    // $tooltip.removeClass("visible-tooltip");
  }

}
