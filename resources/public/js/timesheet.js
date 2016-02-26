var timesheet = (function(){
  // instance variables
  // TODO will use more than once
  var width, height, $container, chart;
  // TODO possibly will use more than once
  var $window, heightpad = 170;
  // internal functions

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
        // bounding dates
        var range_accessor = function(task, i){
          return moment(task.Date, "MM/DD/YY").unix();
        }
        var range = moment.range(
          moment.unix(d3.min(tasks, range_accessor)),
          moment.unix(d3.max(tasks, range_accessor)));

      // create all days array

      // iterate tasks to fill all days
      });
    }
  }
})();

timesheet.create({cont:"container", csv:"/assets/winter2013.csv"});
