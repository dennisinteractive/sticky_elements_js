var StickyElements = function(options = {}) {
  
  const defaults = {}
  const config = Object.assign({}, defaults, options);

  // First we define which elements are sticky. This can be specified per environment
  var stickyElements = config.elements;

  // throttle functionality - limit executions of scroll
  var tick = false;
  function throttle(fn, params) {
    if (!tick) {
      window.requestAnimationFrame(function() {
        fn(params);
        tick = false;
      });
      tick = true;
    }
  }

  // Perform actions based on scroll position
  var detectSticky = function(item) {
    let { element, value, bounds, type } = item;
    
    //console.log("do");
    // Setting the elements width to a defined value so that it
    // does not resize itself when it becomes Fixed.
    element.style.width = bounds.width + 'px';
    // Make sticky
    if (window.scrollY > bounds.x) {
      elementStick(item.element, item.top, item.bounds);
      //based on action
      switch (type) {
        case 'offset':
          if (window.scrollY > value + bounds.x) {
            elementAbsolute(item);
          }
        break;
        case 'timeout':
          setTimeout(function(){
            window.addEventListener('scroll', function() {
              elementUnStick(element);
            });
          }, value);
          break;
        case 'element':
          let endPos = document.querySelectorAll( value )[0];
          if (window.scrollY > endPos.offsetTop) {
            elementAbsolute(element, bounds.height, left, type, endPos);
          }
          break;
      }
    }
    else {
      // above trigger so make unsticky
      elementUnStick(element);
    }
  }

  var elementStick = function(element, top, bounds) {
    element.style = null;

    element.style.position = 'fixed';
    element.style.zIndex = '100';
    element.style.top = top + 'px';
    element.style.left = bounds.left + 'px';
    element.style.width = bounds.width + 'px';

    showElementPlaceholder(element);
  }

  var elementUnStick = function(element) {
    element.style.position = 'static';

    hideElementPlaceholder(element);
  }

  var elementAbsolute = function(item) {
    let { element, value, bounds, top } = item;
    element.style = null;

    let left = bounds.left - item.parent.bounds.x; // For position absolute minus the parent left

    element.style.position = 'absolute';
    element.style.zIndex = '100';
    element.style.transform = 'translateY(' + (value + bounds.height - top) + 'px)';
    element.style.left = left + 'px';
  }

  function elementPlaceholder(element, bounds) {
    let placeholder = document.createElement('div');
    let cs = window.getComputedStyle(element,null);
    placeholder.classList.add('sticky-element-placeholder');
    placeholder.style.height = cs.getPropertyValue('height');
    placeholder.style.width = cs.getPropertyValue('width');
    placeholder.style.display = 'none';
    element.insertAdjacentElement('beforebegin', placeholder);
  }

  function showElementPlaceholder(element){
    element.previousSibling.style.display = '';
  }

  function hideElementPlaceholder(element) {
    element.previousSibling.style.display = 'none';
  }

  function getElementPlaceholderBounds(element) {
    return element.previousSibling.getBoundingClientRect();
  }

  // Iterate over elements
  var init = function() {
    stickyElements.forEach(function(item){
      item.element = document.querySelector(item.sticky_element);
      item.bounds = item.element.getBoundingClientRect();
      item.value = item[item.type];
      item.parent = item.element.parentElement;
      item.parent.bounds = item.parent.getBoundingClientRect();

      elementPlaceholder(item.element, item.bounds);

      // Add a class to sticky elements to allow for site level styling (if needed).
      item.element.classList.add('sticky-element');

      // Call event listener on each sticky element
      // Scroll Event Listener
      window.addEventListener('scroll', function(){
        throttle(detectSticky, item);
      });
    });
  }

  return {
    config: config,
    init: init
  }
};