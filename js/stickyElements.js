import { observeStickyEvents, StickyEvent } from 'sticky-events';
require('intersection-observer');

var StickyElements = {

  createContainer: function(parent) {
    let container = document.createElement('div');
    let cs = window.getComputedStyle(parent, null);

    container.classList.add('sticky-element-container');
    container.style.height = cs.getPropertyValue('height');
    container.style.width = cs.getPropertyValue('width');
    container.style.position = 'relative';
    parent.parentNode.insertBefore(container, parent);
    container.appendChild(parent);
  },

  setDimensions: function(el, value) {
    // Remove the previously set parent height/width so that the browser repaints to the
    // dimensions of the child items that should have now rendered.
    el.style.height = '';
    el.style.width = '';

    // Recompute the needed height/width and set it.
    let cs = window.getComputedStyle(el, null);
    el.parentNode.style.height = cs.getPropertyValue('height');
    el.parentNode.style.width = cs.getPropertyValue('width');

    // Re-add only the sticky height for the parent
    if(value) el.style.height = value + 'px';
  },

  setAllEnds: function() {
    this.config.elements.forEach(element => {
      if(element.type === 'element') {
        element.value = document.querySelector(element[element.type]).getBoundingClientRect().y + window.scrollY;
        element.pvalue = element.parent.getBoundingClientRect().y + window.scrollY;
        let stickyHeight = element.value - element.pvalue;
        element.parent.style.height = stickyHeight + 'px';
      }
    });
  },

  scrollEndHandler: function(event){
    this.setAllEnds();
  },

  reszieEndHandler: function(event){
    clearTimeout(this.resizeDebounce);
    this.resizeDebounce = setTimeout(function(){
      this.setAllEnds();
    }.bind(this), 1000);
  },

  scrollTimeoutHandler: function(event){
    // If all of our timeout handlers have triggered remove the scroll event
    if(this.config.elements.length === 0) window.removeEventListener('scroll', scrollTimeoutHandler, false);

    this.config.elements.forEach(element => {
      let { target, type, top } = element;
      
      if(type === 'timeout') {
        let trigger = (target.parentNode.getBoundingClientRect().y + window.scrollY) - top;
        if(trigger <= window.scrollY) {
          this.stickElement(element);
        }else{
          if(target.classList.contains('is-stuck')) this.unstickElement(element);
        }
      }
    });
  },

  stickElement: function(element) {
    let { target, top, value } = element;
    let cs = window.getComputedStyle(target.parentNode, null);
    
    target.style.width = cs.getPropertyValue('width');
    target.style.top = top + 'px';
    target.style.position = 'fixed';
    target.style.zIndex = '10000';

    target.classList.add('is-stuck');

    if(!element.expire) {
      element.expire = setTimeout(function(){
        this.unstickElement(element);
        this.removeStickyElement(element);
      }.bind(this), value);
    }
  },

  unstickElement: function(element) {
    let { target, oTop, oPos, oZI } = element;

    target.style.top = oTop;
    target.style.position = oPos;
    target.style.zIndex = oZI;

    target.classList.remove('is-stuck');
  },

  removeStickyElement: function(el) {
    this.config.elements.forEach(element => {
      this.config.elements = this.config.elements.filter(e => e !== el);
    });
  },

  checkMediaQueries: function(elements) {
    elements.forEach(element => {
      // Check what media query this should fire for.
      if (element.media_query && window.matchMedia(element.media_query).matches) {
        this.removeStickyElement(element);
      }
    });
  },

  // Iterate over elements
  init: function(options = {}) {
    const defaults = {}
    this.config = Object.assign({}, defaults, options);

    this.checkMediaQueries(this.config.elements);

    this.config.elements.forEach(element => {
      let { sticky_selector, type, top } = element;

      element.target = document.querySelector(sticky_selector);
      if (!element.target) {
          return;
      }
      element.parent = element.target.parentElement;
      // Get the offset if element is the type
      element.value = (type === 'element') ? 
        document.querySelector(element[type]).getBoundingClientRect().y + window.scrollY :
        element[type];
      element.pvalue = element.parent.getBoundingClientRect().y + window.scrollY;

      let { target, parent, value, pvalue } = element;
      target.classList.add('sticky-element');
      
      switch(type) {
        case 'offset':
        case 'element':
          this.createContainer(parent);
          // The sticky height is the difference between the offset to 0 for the target vs
          // the offset to 0 for the parent.
          let stickyHeight = value - pvalue;
          // Add styles to the parent container
          parent.style.height = stickyHeight + 'px';
          parent.style.pointerEvents = 'none';

          // Reinstate pointer events for all children
          Array.from(parent.querySelectorAll('*')).forEach(e => e.style.pointerEvents = 'initial');
          
          // Add styles to the target
          target.style.top = top + 'px';
          target.style.position = '-webkit-sticky'; // For Safari
          target.style.position = 'sticky';
                    
          // Ensure that the body does not have an overflow hidden value by setting it to visible
          document.body.style.overflow = 'visible';

          // Add events for each position:sticky element. Uses the sticky-events class by default. 
          target.classList.add('sticky-events');

          target.addEventListener(StickyEvent.STUCK, (event) => {
            // Make sure the sentinals have position:absolute
            Array.from(document.querySelectorAll('.sticky-events--sentinel')).forEach(s => s.style.position = 'absolute');
            
            // Only add the stuck class if out element is not collapsed such as lazyloaded elements.
            // Otherwise a false positive stuck can be triggered.
            if(event.target.offsetHeight > 0) {
              event.target.classList.add('is-stuck');
            }
          });
         
          target.addEventListener(StickyEvent.UNSTUCK, (event) => {
            // We dont need to worry about the flase positive for removing the class.
            event.target.classList.remove('is-stuck');
          });
            
          break;
        case 'timeout':
          this.createContainer(target);
          element.oPos = target.style.position;
          element.oTop = target.style.top;
          element.oZI = target.style.zIndex;

          window.addEventListener('scroll', this.scrollTimeoutHandler.bind(this), false);
          break;
        default:
          console.log('Invalid type specified.');
      }

      // General target styles we always want.
      target.style.zIndex = '10000';
      target.style.width = '100%';
    });

    // Observe anything with the sticky-events class
    observeStickyEvents();
    
    window.addEventListener('scroll', this.scrollEndHandler.bind(this), false);
    window.addEventListener('resize', this.reszieEndHandler.bind(this), false);
    window.addEventListener('load', function() { 
      window.removeEventListener('scroll', this.scrollEndHandler.bind(this), false);
    }.bind(this));
  }
};

// Custom event for script loaded
let event_init = new CustomEvent('sticky-element:load');
document.dispatchEvent(event_init);

module.exports = StickyElements;