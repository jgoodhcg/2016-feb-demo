var timesheet = (function(){

  // instance variables
  var width, height, $container, $window, chart, svg, cell, rad, stroke,
  scale = 3.5,
  margin = {height: 170, top: 10, bottom: 30, left: 10, right: 10},
  range,
  days_all = [], days_selected= [],
  project_colors = { },
  angle = d3.scale.linear(),
  break_reg = /(\d{1,2}:\d{2}[ap]m\s*–\s*\d{1,2}:\d{2}[ap]m)(\D*(?:\d(?!\d?:\d{2}[ap]m\s)\D*)*)/ig,
  time_stamp_reg = /(\d{1,2}:\d{2}[ap]m\s*–\s*\d{1,2}:\d{2}[ap]m)/;

  angle.range([0,360])
  .domain([0,1400]);

  // internal functions
  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }
  function describeArc(x, y, radius, startAngle, endAngle){

    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);

    var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

    var d = [
      "M", start.x, start.y,
      "A", radius, radius, 0, arcSweep, 0, end.x, end.y
    ].join(" ");

    return d;
  }
  function translateDay(day){
    var ty = cell * (day.date.format('w') - days_selected[0].date.format('w')),
    tx = cell * day.date.format('d');
    return {x: tx, y: ty};
  }
  function meridiem(time){
    var m = time.charAt(time.length-2),
    r = 'error';
    switch (m) {
      case 'P':
      r = 'A'; // post meridiem in moment.js
      break;

      case 'A':
      r = 'a'; // ante meridiem in moment.js
      break;

      case 'p':
      r = 'A'; // post meridiem in moment.js
      break;

      case 'a':
      r = 'a'; // ante meridiem in moment.js
      break;
    }
    return r;
  }
  function makeColor(colorNum, colors, sat, bri){
    if (colors < 1) colors = 1; // defaults to one color
    if (typeof sat !== 'number' || sat < 0 || sat > 100){
      sat = 100;
    }
    if (typeof bri !== 'number' || bri < 0 || bri > 100){
      bri = 50;
    }
    return "hsl("+colorNum * (360 / colors) % 360 +", "+sat+"%, "+bri+"%)";
  }
  function render(params){
    if(typeof params !== 'undefined'){
      size(params.width);
    }else{
      size();
    }
    draw();
  }
  function size(w){
    if(typeof w !== 'number'){
      width = $container.width() - (margin.left + margin.right);
    }else{
      width = w - (margin.left + margin.right);
    }
    cell = width / 7;
    stroke = 0.15 * cell;
    rad = (0.7 * cell) / 2;
    height = cell * (range.diff('weeks')+1.1) - (margin.top + margin.bottom);

    d3.select('#'+$container.attr('id')+'-svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
    .select('#'+$container.attr('id')+'-svg-group')
    .attr('transform', 'translate('+margin.left+','+margin.top+')');

  }
  function draw(){
    chart.selectAll(".day").remove();

    /*
    <g> .cal-day
      <rect> .cal-bg
      <g> .day
          <circle> .day-bg
          <path> .task
          ...
          <path> .task
    */
    var cal_days = chart.selectAll("g .cal-day")
    .data(days_selected, function(d){
      return d.date.format('DDD');
    }).enter()
    .append("g")
    .attr("class", "cal-day")
    .attr("id", function(day){
      return day.date.format('DDD')+'-g';
    })
    .attr("transform", function(day){
      var t = translateDay(day);
      return "translate("+t.x+","+t.y+")";
    });

    cal_days.append("rect")
    .attr('width', cell)
    .attr('height', cell)
    .attr('class', 'call-bg')
    .attr('fill' , function(day){
      return makeColor(
        Number(day.date.format('M')),
        12, 40, 35
      );
    })
    .attr('opacity', 0.95);

    var days = cal_days.append('g')
    .attr('class', 'day');

    var days_bg = days.append("circle")
    .attr("class", "day-bg")
    .attr("cy", cell/2)
    .attr("cx", cell/2)
    .attr("r", rad)
    .attr("stroke", "#CCC")
    .attr("fill", "#DDD")
    .attr("stroke-width", stroke);

    var tasks = days.selectAll(".task")
    .data(function(day,i){
      return day.intervals;
    }).enter()
    .append("path")
    .attr("class", function(d,i){
      if(d.isbreak){
        this.parentNode.appendChild(this);
        return "task break";
      }else{
        this.parentNode.insertBefore(this, this.parentNode.lastChild);
        return "task";
      }
    })
    .attr('DEBUGDAY', function(d,i){
      return d.start.format("DD/MM/YYYY HH:mm")+'  '
      +d.end.format("DD/MM/YYYY HH:mm");
    })
    .attr("d", function(d,i){
      // figure number of minutes
      var zero = moment(d.start.format('MM/DD/YYYY')+' 12:00AM',
      'MM/DD/YYYY hh:mma'),
      endMin = d.end.diff(zero, 'minutes')
      startMin = d.start.diff(zero, 'minutes');
      // figure angle from minutes
      var endAngle = angle(endMin),
      startAngle = angle(startMin);
      return describeArc(cell/2, cell/2, rad, startAngle, endAngle);

    })
    .attr('fill', 'none')
    .attr('stroke-width', stroke)
    .attr('stroke', function(d,i){
      if(d.isbreak){
        return '#FFF';
      }else{
        return project_colors[d.project];
      }
    });

    // .on("click", function(day,i){
    //   this.parentNode.parentNode.appendChild(this.parentNode);
    //   var t = translateDay(day);
    //   var tx = 0, ty = 0;
    //
    //   if(t.x + (scale*cell) > width){
    //     tx = width - (t.x + (cell*scale));
    //   }
    //
    //   if(t.y + (scale*cell) > height){
    //     ty = height - (t.y + (cell*scale));
    //   }
    //
    //   d3.select(this).transition()
    //   .ease("elastic")
    //   .duration("500")
    //   .attr("stroke-width", stroke/2)
    //   .attr("transform", "scale(4,4), translate("+(tx/scale)+","+(ty/scale)+")");
    // })
    // .on("dblclick", function(day,i){
    //
    //   d3.select(this).transition()
    //   .ease("elastic")
    //   .duration("500")
    //   .attr("stroke-width", stroke)
    //   .attr("transform", "scale(1,1)");
    // });

  }

  // external functions
  return{
    create: function(params){
      // check params
      var req_keys = ['csv', 'cont'],
      missing_keys = _.difference(req_keys, _.keys(params));
      if(missing_keys.length > 0){
        throw("ERROR parameter(s) missing: "+missing_keys.join(', '));
      }
      // cache dom
      $container = $("#"+params.cont);
      $window = $(window);

      chart = d3.select('#'+params.cont)
      .append('svg')
      .attr('id', params.cont+'-svg')
      .append('g')
      .attr('transform', 'translate('+margin.left+','+margin.top+')')
      .attr('id', params.cont+'-svg-group');

      // load csv data
      d3.csv(params.csv, function(d) {return d;},
      function(error, tasks){
        // create date range
        var range_accessor = function(task, i){
          return moment(task.Date, "MM/DD/YY").unix();
        }
        range = moment.range(
          moment.unix(d3.min(tasks, range_accessor)),
          moment.unix(d3.max(tasks, range_accessor))
        );

        // fill days_all with empty days
        range.by('days', function(m){
          days_all.push({date: m, intervals: []});
        });

        // iterate tasks to fill days_all's intervals
        var intervals = _.chain(tasks).map(
          function(task, i, tasks){
            var intervals = [],
            format = "MM/DD/YYYY hh:mm ",
            brk = task['Breaks Description'];
            // parse breaks
            while((m = break_reg.exec(brk)) !== null){
              var p = m[1], desc = m[2],
              psplit = p.match(time_stamp_reg)[0].split('–'); // is not '-' hyphen character
              var start = psplit[0].substring(0,psplit[0].length-1);

              intervals.push({
                start: moment(
                  task['Date']+' '+
                  start,
                  format+meridiem(start)
                ),
                end: moment(
                  task['Date']+' '+
                  psplit[1],
                  format+meridiem(psplit[1])
                ),
                desc: desc,
                isbreak: true,
                project: task['Project']
              });
            }

            // task
            intervals.push({
              start: moment(
                task['Date']+' '+task['Start time'],
                format+meridiem(task['Start time'])
              ),
              end: moment(
                task['Date']+' '+task['End time'],
                format+meridiem(task['End time'])
              ),
              desc: task['Description'],
              isbreak: false,
              project: task['Project']
            });
            return intervals;
          }
        )
        .flatten()
        .groupBy(
          function(task){
            return task.start.format('MM/DD/YYYY');
          }
        )
        .value();

        days_all = _.map(days_all,
          function(day, i){
            var ints = intervals[day.date.format("MM/DD/YYYY")];
            return {
              date: day.date,
              intervals: ((typeof ints === 'undefined') ? [] : ints)
            };
          }
        );

        // determine colors for tasks
        project_colors = _.chain(tasks)
        .uniq(function(task){
          return task['Project'];
        })
        .map(function(task){
          return task['Project'];
        })
        .value(); // object with projects as keys and undefined values

        project_colors = _.chain(project_colors)
        .object(_.range(project_colors.length))
        .mapObject(function(c, p){
          return makeColor(
            _.indexOf(project_colors, p) + 1,
            project_colors.length + 1
          );
        })
        .value(); // object projects as keys and hsl() value for color

        days_selected = days_all.slice(0);
        render();
      });
    },
    render: function(params){
      render(params);
    }
  }
})();

timesheet.create({cont:"container", csv:"/assets/fall2014.csv"});
