(function(){
  document.addEventListener("DOMContentLoaded", function(event) {

    // First we define which elements are sticky. This can be specified per environment
    var stickyElements = Drupal.settings.sticky_elements.elements;

    // debounce functionality - limit executions of scroll
    function debounce(func, wait = 5, immediate = true) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    };


    // Perform actions based on scroll position
    function detectSticky(
      sElement,
      startPos,
      sOffset,
      height,
      width,
      positionX,
      sTime,
      type,
      typeValue
    ) {
      // console.log('scrollPos: ' + window.scrollY);
      // console.log('startPos: ' + startPos);
      // console.log('sOffset: ' + sOffset);
      // console.log('sTime: ' + sTime);
      // console.log('typeValue: ' + typeValue);
      // Setting the elements width to a defined value so that it
      // does not resize itself when it becomes Fixed.
      sElement.style.width = width + 'px';
      // Make sticky
      if (window.scrollY > startPos) {
        elementStick(sElement, positionX);
        //based on action
        switch (type) {
          case 'offset':
            // console.log('offset type');
            if (window.scrollY > sOffset) {
              // console.log('past offset');
              elementAbsolute(sElement, height, width, type, typeValue);
            }
          break;
          case 'timeout':
            // console.log('timeout');
            setTimeout(function(){
              // console.log('TIME UP');
              window.addEventListener('scroll', function() {
                elementUnStick(sElement);
              });
            }, sTime);
            break;
          case 'element':
            // console.log('element type', sElement, sOffset);
            let endPos = document.querySelectorAll( sOffset )[0];
            // console.log({endPos});
            if (window.scrollY > endPos.offsetTop) {
              // console.log('Element absolute');
              elementAbsolute(sElement, type, endPos, positionX);
            }
            break;
        }
      }
      else {
        // above trigger so make unsticky
        // console.log('scroll position above element');
        elementUnStick(sElement);
      }
    }

    function elementStick(sElement, positionX) {
      sElement.style.position = 'fixed';
      sElement.style.zIndex = '100';
      sElement.style.top = 0;
      sElement.style.left = positionX + 'px';
    }

    function elementUnStick(sElement) {
      sElement.style.position = 'static';
    }

    function elementAbsolute(sElement, type, endPos, positionX) {
      sElement.style.position = 'absolute';
      sElement.style.left = positionX + 'px';

      //conditional top position based on element type
        // element
        if (type == 'element') {
          sElement.style.top = endPos.offsetTop - endPos.clientHeight + sElement.clientHeight + 'px';
        }
        // offset
        if (type == 'offset') {
          sElement.style.top = endPos + 'px';

        }
    }

    // Iterate over elements
    stickyElements.forEach(function(item){
      let type = item['type'];
      // Define the sticky element.
      let sElement = document.querySelectorAll( item['sticky_element'] )[0];
      let startPos = sElement.getBoundingClientRect().top;
      let height = sElement.getBoundingClientRect().height;
      let width = sElement.getBoundingClientRect().width;
      let right = sElement.getBoundingClientRect().right;
      let positionX = right - width;

      // Add a class to sticky elements to allow for site level styling (if needed).
      sElement.classList.add('sticky-element');

      // Call event listener on each sticky element
      let sOffset = item[type];
      let sTime = (item[type]);
      let typeValue = item[type];


      // Scroll Event Listener
      window.addEventListener('scroll', debounce(function(){detectSticky(
        sElement, 
        startPos, 
        sOffset, 
        height, 
        width, 
        positionX, 
        sTime, 
        type, 
        typeValue
      )}));
      return positionX;
    });
  });
})();

