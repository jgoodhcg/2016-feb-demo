var stimesheet = function(){

  // instance variables
  var days = [],
  daysSelection = [],
  selectedDay = NaN,
  dateFormat = "MM/DD/YYYY",
  taskProps = ['start', 'end', 'desc', 'isbreak', 'project'],
  breakRegex = /(\d{1,2}:\d{2}[ap]m\s*–\s*\d{1,2}:\d{2}[ap]m)(\D*(?:\d(?!\d?:\d{2}[ap]m\s)\D*)*)/ig,
  tStampRegex = /(\d{1,2}:\d{2}[ap]m\s*–\s*\d{1,2}:\d{2}[ap]m)/,
  radMax = 500,
  rad = radMax, // default max, will reduce to fit
  x = d3.scale.linear(),
  y = d3.scale.linear(),
  angle = d3.scale.linear(),
  width = 0,
  height = 0,
  margin = {top: 1, right: 1, bottom: 1, left: 1},
  circleColor ='#8C8F8F',
  backgroundC = '#ffffff',
  chart, svg, svgContainer, $tooltip, control, cont, $cont,
  col, row, strokeWidth, dayGroups, tasks, collapseBtn, projects;

  // functions available internally
  function shadeBlend(p,c0,c1) {
    var n=p<0?p*-1:p,u=Math.round,w=parseInt;
    if(c0.length>7){
        var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
        return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
    }else{
        var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
        return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
    }
  }
  function hasOwnValue(obj, val) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop) && obj[prop] === val) {
            return true;
        }
    }
    return false;
  }
  function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  function spliceString(str, index, count, add) {
    return str.slice(0, index) + (add || "") + str.slice(index + count);
  }
  function insertTask(param){
    var task = param.task,
    date = moment(param.date),
    hasAllProps = true;

    // check task has all properties it should
    for (var i=0; i<taskProps.length; i++){
      if (!task.hasOwnProperty(taskProps[i])){
        hasAllProps = false;
      }
    }


    // insert the task into days array
    if (task && date && hasAllProps){
      for(var i=0; i<days.length; i++){
        var currDate = moment(days[i].date);
        if(currDate.isSame(date, 'day')){
          days[i].intervals.push(task);
        }
      }
    }else{
      console.log('ERROR: params not correct.');
      return false;
    }

    return true;
  }
  function determineMeridiem(time){
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
  function render(){

    // render day circles
    dayGroups = dayGroups.data(daysSelection, function(d){return d.date});

    // new elements
    dayGroups.enter()
    .append("g")
    .attr("class", "day")
    .append("circle")

    dayGroups
    .attr('transform', function(day, index){
      var ty =  y(Math.floor(index / col)),
      tx = x(index  % col);
      return "translate("+tx+","+ty+")";
    })
    .on("click", function(day,index){
      // indicate day selected
      selectedDay = getIndexOfDate(day.date);
      // fill tooltip info
      var d = day.intervals,
      tp = $tooltip.find("p");
      tp.html(day.date+'<br />');
      // all projects
      for (var i = 0; i<d.length; i++){
        if (i === 0 || d[i].project !== d[i-1].project){
          var tmp = tp.html();
          tmp += '<br /><span style="color:'+
          projects[d[i].project]+'; font-weight:bold;"> '+
          d[i].project+'</span><br />';
          tp.html(tmp);
        }
        var desc = '--no description--';
        if (d[i].desc !== ''){
          desc = d[i].desc;
        }
        var descWords = desc.split(' ');
        // splitting desc into multiple lines
        for (var j = 7; j<descWords.length; j= j+7){
          descWords.splice(j,0,'<br />');
        }
        desc = descWords.join(' ');
        var tmp = tp.html();
        tmp +=
        desc+'<br />'+
        d[i].start.format('HH:mm')+' - '+
        d[i].end.format('HH:mm')+'<br />';
        tp.html(tmp);
      }
      // make tooltip visible
      $tooltip.addClass("visible-tooltip");

      reDraw();
    })
    .on("dblclick", function(d,index){
      console.log("dbl clicked");
      console.log(days[selectedDay]);
      daysSelection = days.slice(selectedDay, selectedDay+1);
      selectedDay = NaN;
      reDraw();
    });

    dayGroups.selectAll("circle")
    .attr("cy", rad)
    .attr("cx", rad)
    .attr("r", rad)
    .attr("stroke", "#DBDBD9")
    .attr("stroke-width", strokeWidth -1 )
    .attr("fill", function(day){
      if (selectedDay === getIndexOfDate(day.date)){
        return circleColor;
      }else{
        return backgroundC;
      }
    });

    // task
    tasks = dayGroups.selectAll(".task")
    .data(function(day,i){
      return day.intervals;
    }, function(t, i){
      return t.start.format('MM/DD/YYYY HH:mm');
    });

    // new elements
    tasks.enter().append("path")
    .attr("class", "task")

    tasks
    .attr("d", function(d,i){
      // figure number of minutes
      var zero = moment(d.start.format('MM/DD/YYYY')+' 12:00AM',
      'MM/DD/YYYY hh:mma'),
      endMin = d.end.diff(zero, 'minutes')
      startMin = d.start.diff(zero, 'minutes');
      // figure angle from minutes
      var endAngle = angle(endMin),
      startAngle = angle(startMin);
      return describeArc(rad, rad, rad, startAngle, endAngle);
    })
    .attr('fill', 'none')
    .attr('stroke-width', strokeWidth)
    .attr('stroke', function(d,i){
      if(d.isbreak){
        return shadeBlend(0.50, projects[d.project], circleColor);
      }else{
        return projects[d.project];
      }
     });

    // removing elements
    tasks.exit().remove();
    dayGroups.exit().remove();

  }
  function reSize(){
    // determine how many rows of circles and number per row
    height = $(window).innerHeight() - 100; //whole svg is viewable on screen
    chart.select('svg').attr('width', width);
    chart.select('svg').attr('height', height);
    chart.attr('height', height);

    var rangeMax = Math.sqrt(width * height / daysSelection.length);
    while(Math.floor(width / (rad*2)) * Math.floor(height / (rad*2)) <
      daysSelection.length){
      rad--;
    }
    col = Math.floor(width / (rad*2));
    row = Math.floor(height / (rad*2));

    // stroke style and radius effect
    strokeWidth = rad * 0.25;
    rad = rad - (strokeWidth*1.25);

    // scales
    y.range([strokeWidth, (height-strokeWidth)]);
    y.domain([0, row])
    x.range([strokeWidth, (width-strokeWidth)])
    .domain([0, col]);
    angle.range([0,360])
    .domain([0,1440]);

  }
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
  function reDraw(){
    rad = radMax;
    // selectedDay = NaN;
    reSize();
    render();
  }
  function getIndexOfDate(date){
    var index = 0;
    for (var j = 0; j<days.length; j++){
      if (days[j].date == date){
        index = j;
      }
    }
    return index;
  }
  function img_create(src, clss, id) {
    var img= document.createElement('img');
    img.src= src;
    if (id!=null) img.id = id;
    if (clss!=null) img.className= clss;
    return img;
  }
  function findWidth(){
    var $cont = $(cont),
    pl = $cont.css('padding-left'),
    pr = $cont.css('padding-right');
    pr = pr.slice(0,-2);
    pl = pl.slice(0,-2);
    var w = cont.offsetWidth - pl - pr;
    return w;
  }
  // externally available functions
  return{
    makeChart: function(param){
      if (param.csv && param.container && param.tooltip && param.control){
        console.log('Appending a chart of '+param.csv+' to '+param.svg+
        'container '+ param.container+'... ');
      }else{
        console.log("ERROR: parameters not met!");
      }

      // init and size chart
      control = document.getElementById(param.control);
      cont = document.getElementById(param.container);
      $cont = $(cont);
      $tooltip = $('<div id=\''+param.container+
      '-tooltip\' class=\'tooltip\' ><a class=\"close\" style=\"color:white\"'+
      '>×</a><p></p></div>');
      $cont.append($tooltip)
      $tooltip.find('.close').click(function(){
        $tooltip.removeClass('visible-tooltip');
        selectedDay = NaN;
        render();
      });

      width = findWidth(),
      height = cont.offsetHeight;

      chart = d3.select("#"+param.container)
      .append("div")
      .attr("id", param.container+'-svg-container')
      .attr("class", 'svg-container');

      chart
      .append("svg")
      .attr('width', width)
      .attr('id', param.container+'-svg');

      var moduleObject = this;

      // load csv and create visualization
      d3.csv(param.csv, function(d) {return d;},function(error, tasks) {
        var maxDate = moment(tasks[0].Date),
        minDate = moment(tasks[0].Date);
        // find the bounding dates
        for (var i=0; i<tasks.length; i++){
          var date = moment(tasks[i].Date);
          if (maxDate.isBefore(date)){
            maxDate = date;
          }
          if (minDate.isAfter(date)){
            minDate = date;
          }
        }

        // create a date range
        var range = moment.range(minDate, maxDate);

        // object for storing colors of all projects
        projects = {};

        // iterate over range to parse data and fill days
        range.by('days', function(m){
          days.push({date: m.format(dateFormat),
            intervals: []});
        });
          // fill the day's objects with the tasks info
          for(var i=0; i<tasks.length; i++){
            // determine color for task
            if (!projects.hasOwnProperty(tasks[i]['Project'])){
              var color = circleColor;
              while (color == circleColor || // check that color isn't used
                 color == backgroundC ||
                 hasOwnValue(projects, color)){

                  color = getRandomColor();
              }
              projects[tasks[i]['Project']] = color;
            }
            var date = tasks[i]['Date'],
            startTime = tasks[i]['Start time'],
            endTime = tasks[i]['End time'],
            smer = determineMeridiem(startTime),
            emer = determineMeridiem(endTime),
            start = moment(date+' '+startTime,"MM/DD/YYYY hh:mm"+smer),
            end = moment(date+' '+endTime,"MM/DD/YYYY hh:mm"+emer);

            var task = {
              start: start,
              end: end,
              desc: tasks[i]['Description'],
              isbreak: false,
              project: tasks[i]['Project']
            };


            insertTask({task: task, date: date});

            var breaks = [],
            bstr = tasks[i]['Breaks Description'],
            m, t;



            while ((m = breakRegex.exec(bstr)) !== null){
              var p = m[1],
              d = m[2];

              var psplit = p.match(tStampRegex)[0].split('–'),
              startTime = psplit[0].substring(0,psplit[0].length-1),
              endTime = psplit[1],
              smer = determineMeridiem(startTime),
              emer = determineMeridiem(endTime),
              start = moment(date+' '+startTime,"MM/DD/YYYY hh:mm"+smer),
              end = moment(date+' '+endTime,"MM/DD/YYYY hh:mm"+emer);

              var btask = {
                start: start,
                end: end,
                desc: d,
                isbreak: true,
                project: tasks[i]['Project']
              };

              // console.log(btask);
              insertTask({task: btask, date: date});

            }
          }

          daysSelection = days.slice(0);
          svg = d3.select('#'+param.container+'-svg');
          svgContainer = document.getElementById(param.container+'-svg-container');
          dayGroups = svg.selectAll("g .day");
          reSize();
          render();
          moduleObject.collapse();
        }
      );

      // insert and bind control buttons

      // append collapse to control container
      var tmpId = param.container+'-collapse-container';
      $('#'+control.id).append('<div class="timesheet-collapse-container" '+
      'id='+tmpId+'></div>');
      // title container
      $('#'+control.id).append($('<div class=\'timesheet-title\' ></div>'));
      // create button container div to append to control div
      var buttonContainer = control.id+'-buttons';
      $('#'+control.id).append('<div '+
      'class="timesheet-control-buttons"'+
      'id='+buttonContainer+'></div>');

      // image paths
      var btns = [
        { name: 'title',
          path: param.title,
          btn: null,
          clck: (function(){
            moduleObject.collapse();
          })
        },
        { name: 'left',
          path: param.left,
          btn: null,
          clck: (function(){
            moduleObject.slideSelection(-1);
          })
        },
        { name:'day',
          path: param.day,
          btn: null,
          clck: moduleObject.selectDay
        },
        { name: 'week',
          path: param.week,
          btn: null,
          clck: moduleObject.selectWeek
        },
        { name: 'month',
          path: param.month,
          btn: null,
          clck: moduleObject.selectMonth
        },
        { name: 'all',
          path: param.all,
          btn: null,
          clck: moduleObject.selectAll
        },
        { name: 'right',
          path: param.right,
          btn: null,
          clck: (function(){
            moduleObject.slideSelection(1);
          })
        },
        { name: 'collapse',
          path: param.up,
          alt: param.down,
          btn: null,
          clck: (function(){
            moduleObject.collapse();
          }),
        }
      ];

      for(var i = 0; i<btns.length; i++){
        if (btns[i].path){ // path is not null
          // create btn
          var btnId = control.id+'-'+btns[i].name+'-button';
          if (btns[i].name === 'title'){
            // create title
            btns[i].btn = $('<div class=\'timesheet-title\' >'+btns[i].path+
            '</div>');
            // append to control
            $('#'+control.id+' .timesheet-title').html(btns[i].path);
          }else{
            btns[i].btn = img_create(btns[i].path, 'timesheet-control-button',
            btnId);

            if(btns[i].name === 'collapse'){
              collapseBtn = btns[i].btn;
              btns[i].btn.alt = btns[i].alt
              // append collapse button to container
              $('#'+tmpId).append(btns[i].btn);
            }else{
              // append img to buttons container inside control container
              $('#'+buttonContainer).append(btns[i].btn);
            }
          }
          // attach click functions
          $('#'+btns[i].btn.id).click({clck: btns[i].clck}, function(e){
            e.data.clck();
          });
        }
      }
    },
    changeFormat: function(format){
      // do some error checking TODO
      dateFormat = format;
    },
    changeRad: function(i){
      radMax = i;
    },
    reDraw: function(){
      width = findWidth(),
      height = cont.offsetWidth;
      reDraw();
    },
    clear: function(){
      days = [];
      rad = 100;
      chart.remove();
    },
    removeDay: function(i){
      daysSelection.splice(i,1);
      reDraw();
    },
    selectAll: function(){
      daysSelection = days.slice(0);
      selectedDay = NaN;
      reDraw();
    },
    selectMonth: function(i){
      i = typeof i !== 'undefined' ? i : selectedDay;
      if (isNaN(selectedDay)){
        i = 0;
      }
      daysSelection = days.slice(i,i+30);
      selectedDay = NaN;
      reDraw();
    },
    selectWeek: function(i){
      i = typeof i !== 'undefined' ? i : selectedDay;
      if (isNaN(selectedDay)){
        i = 0;
      }
      daysSelection = days.slice(i,i+7);
      selectedDay = NaN;
      reDraw();
    },
    selectDay: function(i){
      i = typeof i !== 'undefined' ? i : selectedDay;
      if (isNaN(selectedDay)){
        i = 0;
      }
      daysSelection = days.slice(i,i+1);
      selectedDay = NaN;
      reDraw();
    },
    slideSelection: function(i){
      // get start of selection index
      var index = getIndexOfDate(daysSelection[0].date),
      length = daysSelection.length;
      // slide selection by i
      var start, end;
      if ( i > 0){
        // slide to the right (positive direction in time)
        start = Math.min((i+index),days.length-1);
        end = index + length + i;
      }else{
        start = Math.max((index+i),0);
        end = Math.max((index + length) + i, 0);
      }
      daysSelection = days.slice(start,end);
      reDraw();
    },
    collapse: function(){
      $tooltip.removeClass('visible-tooltip');
      selectedDay = NaN;
      render();
      $(svgContainer).toggle('slow');
      $('#'+control.id+'-buttons').toggle('50');
      var $cc = $('#'+control.id);
      if($cc.hasClass('collapsed')){
        $(collapseBtn).rotate({angle: 180, animateTo:0});
        $cc.removeClass('collapsed');
      }else{
        $(collapseBtn).rotate({angle: 0, animateTo:180});
        $cc.addClass('collapsed');
      }
    }
  }
};
