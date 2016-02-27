var timesheet = (function(){

  // instance variables
  var width, height, $container, $window, chart, svg,
  heightpad = 170,
  range, days_displayed,
  days_all = [], days_selected= [],
  project_colors = { },
  break_reg = /(\d{1,2}:\d{2}[ap]m\s*–\s*\d{1,2}:\d{2}[ap]m)(\D*(?:\d(?!\d?:\d{2}[ap]m\s)\D*)*)/ig,
  time_stamp_reg = /(\d{1,2}:\d{2}[ap]m\s*–\s*\d{1,2}:\d{2}[ap]m)/,
  x = d3.scale.ordinal(), y = d3.scale.linear();

  // internal functions
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
  function makeColor(colorNum, colors){
    if (colors < 1) colors = 1; // defaults to one color - avoid divide by zero
    return "hsl("+colorNum * (360 / colors) % 360 +", 100%, 50%)";
  }
  function render(){
    size();
    draw();
  }
  function size(){
    width = $container.width();
    height = $window.innerHeight() - heightpad;

    chart.attr('width', width);
    chart.attr('height', height);
    chart.select('svg').attr('width', width);
    chart.select('svg').attr('height', height);

    // x axis days of the week
    x
    .rangePoints([0, width])
    .domain(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    // y axis day number of year (out of 365)
    y
    .range([0, height])
    .domain([range.start.format('DDD'), range.end.format('DDD')]);
  }
  function draw(){
    days_displayed = days_displayed.data(days_selected, function(d){
      return d.date.format('DDD');
    });

    // new days
    days_displayed.enter()
    .append("g")
    .attr("Class", "day")
    .append("circle");

    // displaying days
    days_displayed
    .attr("transform", function(day){
      var i = Number(day.date.format('DDD'));
      var ty = y(i),
      tx = x(day.date.format('ddd'));
      return "translate("+tx+","+ty+")";
    });

    days_displayed.selectAll("circle")
    .attr("cy", 4)
    .attr("cx", 4)
    .attr("r", 4)
    .attr("stroke", "#DBDBD9")
    .attr("stroke-width", 2);

    // removing days
    days_displayed.exit().remove();
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

      width = $container.width();
      height = $window.innerHeight() - heightpad;

      chart = d3.select("#"+params.cont)
      .append("div")
      .attr("id", params.cont+'-svg-container')
      .attr("class", "svg-container")
      .attr("width", width)
      .attr("height", height);

      chart
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("id", params.cont+"-svg");

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
        svg = d3.select('#'+params.cont+'-svg');
        days_displayed = svg.selectAll("g .day");
        render();
      });

    }
  }
})();

timesheet.create({cont:"container", csv:"/assets/fall2014.csv"});
