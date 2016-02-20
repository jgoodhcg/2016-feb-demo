
var banner = document.getElementById('banner'),
bx, by, bstart, bend;
// touch
banner.addEventListener('touchstart', function(e){
  bx = e.touches[0].clientX;
  by = e.touches[0].clientY;
  bstart = e.timeStamp;
});
banner.addEventListener('touchend', function(e){
  bend = e.timeStamp;
  ripple(bx,by,bend - bstart);
});
// mouse
banner.addEventListener('mousedown', function(e){
  bx = e.clientX;
  by = e.clientY;
  bstart = e.timeStamp;
});
banner.addEventListener('mouseup', function(e){
  bend = e.timeStamp;
  ripple(bx,by,bend - bstart);
});

$links = $('.link-img');
$links.hover(swapPic);


var $pic = $('#profile-pic');
$pic.hover(swapPic);
$pic.on('tap', function(e){
  e.preventDefault();
  swapPic();
  setTimeout(swapPic, 2000);
  return false;
});
var $pCollapse = $('.project-collapse')
$pCollapse.on('tap', function(e){
  e.preventDefault();
  collapse(e);
  return false;
});

function collapse(e){
  console.log("collapsing");
  // collapse content
  var $collapseBtn = $('#'+e.target.id),
  $cc = $collapseBtn.parent();
  $cc.siblings().toggle('100');
  // rotate collapse buttons
  if($cc.hasClass('collapsed')){
    $collapseBtn.rotate({angle: 180, animateTo:0});
    $cc.removeClass('collapsed');
  }else{
    $collapseBtn.rotate({angle: 0, animateTo:180});
    $cc.addClass('collapsed');
  }
}

function swapPic(e){
    var $pic = $(this);
    console.log("swapping pic");
    var tmp = $pic.attr('src');
    $pic.attr('src', $pic.attr('data-swap'));
    $pic.attr('data-swap', tmp);
    if(e !== undefined){
      e.preventDefault();
      return false;
    }

}

function ripple(x,y,d){
  console.log('adding ripple '+x+' '+y+' '+d);
  bannerModule.addRipple(x,y,d);
}


// instantiate timesheet content
var w13,
w13a = {
  csv: '/assets/winter2013.csv',
  container: 'w13',
  control: 'w13-control',
  tooltip: 'tooltip',
  day: '/assets/day.svg',
  week: '/assets/week.svg',
  month: '/assets/month.svg',
  all: '/assets/all.svg',
  left: '/assets/left.svg',
  right: '/assets/right.svg',
  up: '/assets/up.svg',
  down: '/assets/down.svg',
  title: 'Winter 2013'
};
var s13,
s13a = {
  csv: '/assets/summer2013.csv',
  container: 's13',
  control: 's13-control',
  tooltip: 'tooltip',
  day: '/assets/day.svg',
  week: '/assets/week.svg',
  month: '/assets/month.svg',
  all: '/assets/all.svg',
  left: '/assets/left.svg',
  right: '/assets/right.svg',
  up: '/assets/up.svg',
  down: '/assets/down.svg',
  title: 'Summer 2013'
};
var f13 ,
f13a = {
  csv: '/assets/fall2013.csv',
  container: 'f13',
  control: 'f13-control',
  tooltip: 'tooltip',
  day: '/assets/day.svg',
  week: '/assets/week.svg',
  month: '/assets/month.svg',
  all: '/assets/all.svg',
  left: '/assets/left.svg',
  right: '/assets/right.svg',
  up: '/assets/up.svg',
  down: '/assets/down.svg',
  title: 'Fall 2013'
};
var w14,
w14a = {
  csv: '/assets/winter2014.csv',
  container: 'w14',
  control: 'w14-control',
  tooltip: 'tooltip',
  day: '/assets/day.svg',
  week: '/assets/week.svg',
  month: '/assets/month.svg',
  all: '/assets/all.svg',
  left: '/assets/left.svg',
  right: '/assets/right.svg',
  up: '/assets/up.svg',
  down: '/assets/down.svg',
  title: 'Winter 2014'
};
var s14 ,
s14a = {
  csv: '/assets/summer2014.csv',
  container: 's14',
  control: 's14-control',
  tooltip: 'tooltip',
  day: '/assets/day.svg',
  week: '/assets/week.svg',
  month: '/assets/month.svg',
  all: '/assets/all.svg',
  left: '/assets/left.svg',
  right: '/assets/right.svg',
  up: '/assets/up.svg',
  down: '/assets/down.svg',
  title: 'Summer 2014'
};
var f14 ,
f14a = {
  csv: '/assets/fall2014.csv',
  container: 'f14',
  control: 'f14-control',
  tooltip: 'tooltip',
  day: '/assets/day.svg',
  week: '/assets/week.svg',
  month: '/assets/month.svg',
  all: '/assets/all.svg',
  left: '/assets/left.svg',
  right: '/assets/right.svg',
  up: '/assets/up.svg',
  down: '/assets/down.svg',
  title: 'Fall 2014'
};
var w15 ,
w15a = {
  csv: '/assets/winter2015.csv',
  container: 'w15',
  control: 'w15-control',
  tooltip: 'tooltip',
  day: '/assets/day.svg',
  week: '/assets/week.svg',
  month: '/assets/month.svg',
  all: '/assets/all.svg',
  left: '/assets/left.svg',
  right: '/assets/right.svg',
  up: '/assets/up.svg',
  down: '/assets/down.svg',
  title: 'Winter 2015'
};
var ex;
var dm ,
dma = {
  csv: '/assets/demo2016.csv',
  container: 'dm',
  control: 'dm-control',
  tooltip: 'tooltip',
  day: '/assets/day.svg',
  week: '/assets/week.svg',
  month: '/assets/month.svg',
  all: '/assets/all.svg',
  left: '/assets/left.svg',
  right: '/assets/right.svg',
  up: '/assets/up.svg',
  down: '/assets/down.svg',
  title: 'Demo Project'
};

$('#side-nav').scrollToFixed({
  marginTop: $('#links').height()/2
});

$('#links').scrollToFixed({
  limit: $('#banner').height()
});

$('button[data-toggle="popover"]').popover({
  html: true,
  trigger: 'focus',
  content: function () {
    var $el = $(this);
    return '<a href="'+$el.data('pop')+'" data-lightbox="code" class="nounderline" data-title="'+$el.data('ttle')+'"><img class="img-responsive" src="'+$el.data('pop')+'"/></a>';
  }
});

$('[data-toggle="tooltip"]').tooltip();


$(window).load(function(){
  var h = $(banner).height() + $('#link-bar').height()*2;
  $('body').scrollspy({target: '#side-nav', offset: h*0.7});
  // excr data
  ex = excrChart();
  // load timesheet content
  w13 = stimesheet();
  w13.makeChart(w13a);
  s13 = stimesheet();
  s13.makeChart(s13a);
  f13 = stimesheet();
  f13.makeChart(f13a);
  w14 = stimesheet();
  w14.makeChart(w14a);
  s14 = stimesheet();
  s14.makeChart(s14a);
  f14 = stimesheet();
  f14.makeChart(f14a);
  w15 = stimesheet();
  w15.makeChart(w15a);
  dm = stimesheet();
  dm.makeChart(dma);

  $('#preloader').fadeOut('slow',function(){$(this).remove();});
});

$(window).resize(function(){
  console.log("resizing...");
  $('#excr-chart').empty();
  $('#excr-chart-container').find('.tooltip').remove();
  ex = excrChart();
  bannerModule.reDraw();
  w13.reDraw();
  s13.reDraw();
  f13.reDraw();
  w14.reDraw();
  f14.reDraw();
  s14.reDraw();
  w15.reDraw();
  dm.reDraw();
});
