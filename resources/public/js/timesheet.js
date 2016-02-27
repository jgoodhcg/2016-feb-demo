var timesheet = (function(){
  // instance variables

  // TODO will use more than once
  var width, height, $container, chart, range,
  all_days = [], days = [],
  project_colors = { },
  break_reg = /(\d{1,2}:\d{2}[ap]m\s*–\s*\d{1,2}:\d{2}[ap]m)(\D*(?:\d(?!\d?:\d{2}[ap]m\s)\D*)*)/ig,
  time_stamp_reg = /(\d{1,2}:\d{2}[ap]m\s*–\s*\d{1,2}:\d{2}[ap]m)/;

  // TODO possibly will use more than once
  var $window, heightpad = 170;

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
          moment.unix(d3.max(tasks, range_accessor)));

          // fill all_days
          range.by('days', function(m){
            all_days.push({date: m, intervals: []});
          });

          // iterate tasks to fill all_days' intervals
          all_days = _.map(tasks, function(task, i, tasks){
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
          });

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

          console.log(project_colors);
        });

      }
    }
  })();

  timesheet.create({cont:"container", csv:"/assets/fall2014.csv"});
