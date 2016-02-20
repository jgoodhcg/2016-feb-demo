var focus = (function(){
  var $elems = $('.focus-able'),
  $inFocus = focus();

  $('.focus-able').initialize(function(){
    $elems = $('.focus-able');
  });

  $(window).scroll(function(){
    $inFocus = focus();
  });

  function focus(){
    var midline = window.screen.availHeight/2 + window.scrollY,
    $notFocused = $(),
    $focused = $('focus');

    $elems.each(function(i, el){
      $el = $(el);
      if($el.offset().top + $el.height() > midline){
        // bottom is below midline
        if($el.offset().top < midline){
          // top is above midline
          $el.addClass('focus');
          $focused = $el;
        }else{
          $notFocused.push($el);
        }
      }else{
        $notFocused.push($el);
      }

    });

    if($focused.length >= 1){
      $notFocused.each(function(i,e){
        $(e).removeClass('focus');
      })
      return $focused;
    }else{
      return false;
    }
  }



  return {
    focus: focus,
    focused: $inFocus
  };

})()
