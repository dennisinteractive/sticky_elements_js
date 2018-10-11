import { observeStickyEvents, StickyEvent } from 'sticky-events';
require('intersection-observer');

var StickyElements = {

  setContainer: function(element){
    let { target } = element;
    let container = document.createElement('div');
    target.parentNode.insertBefore(container, target);
    container.appendChild(target);
  },

  setParent: function(element) {
    let { parent, type, target } = element;
    let margin;

    element.height = target.offsetHeight;
    element.value = this.setValue(element);
    element.pvalue = this.setParentValue(element);
    // The sticky height is the difference between the offset to 0 for the target vs
    // the offset to 0 for the parent.
    let stickyHeight = element.value - element.pvalue;
    // Add styles to the parent container
    parent.style.height = stickyHeight + 'px';
    parent.style.pointerEvents = 'none';
    if(type === 'element') {
      margin = stickyHeight - element.height;
    }else{
      margin = stickyHeight;
    }
    parent.style.marginBottom = -margin + 'px';
  },

  unsetParent: function(element) {
    let { parent } = element;
    parent.style.height = null;
    parent.style.marginBottom = null;
    parent.style.pointerEvents = null;
  },

  resetParent: function(element) {
    this.unsetParent(element);
    this.setParent(element);
  },

  resetAllParents: function(event) {
    this.config.elements.forEach(element => {
      if(element.type !== "timeout") this.resetParent(element);
    });
  },

  setValue: function(element) {
    let { type } = element;
    return (type === 'element') ? document.querySelector(element[type]).getBoundingClientRect().y + window.scrollY : element[type];
  },

  setParentValue: function(element) {
    let { type, parent } = element;
    return (type === 'element') ? parent.getBoundingClientRect().y + window.scrollY : - element.height;
  },

  reszieEventHandler: function(event){
    clearTimeout(this.resizeDebounce);
    this.resizeDebounce = setTimeout(function(){
      this.resetAllParents();
    }.bind(this), 1000);
  },

  loadEventHandler: function(event){
    this.setTimeoutTriggers();
    this.resetAllParents();
  },
  
  setTimeoutTriggers: function() {
    this.config.elements.forEach(element => {
      if(element.type === "timeout") {
        element.trigger = (element.target.getBoundingClientRect().y + window.scrollY) - element.top;
      }
    });
  },

  scrollTimeoutHandler: function(event){
    // If all of our timeout handlers have triggered remove the scroll event
    if(this.config.elements.length === 0) window.removeEventListener('scroll', scrollTimeoutHandler, false);

    this.config.elements.forEach(element => {
      let { target, type, top } = element;
      if(type === 'timeout') {
        if(element.trigger <= window.scrollY) {
          this.stickElement(element);
        }else{
          if(target.classList.contains('is-stuck')) this.unstickElement(element);
        }
      }
    });
  },

  startTimeout: function(element){
    let { value } = element;
    if(!element.expire) {
      element.expire = setTimeout(function(){
        this.unstickElement(element);
        this.removeStickyElement(element);
      }.bind(this), value);
    }
  },

  stickElement: function(element) {
    let { target, top, type } = element;    
    let actualRight = element.target.getBoundingClientRect().right;
    target.style.top = top + 'px';
    target.style.position = 'fixed';
    target.style.zIndex = '100000';
    target.style.left = '50%';
    target.style.marginLeft = -actualRight + 'px';
    // target.style.marginLeft = '-566px';
    target.classList.add('is-stuck');
    if(type === 'timeout') this.startTimeout(element)
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

      let { target } = element;
      target.classList.add('sticky-element');
      
      if(element.container) this.setContainer(element);
      element.parent = element.target.parentElement;

      switch(type) {
        case 'offset':
        case 'element':
          this.setParent(element);
          // Reinstate pointer events for all children
          Array.from(element.parent.children).forEach(e => e.style.pointerEvents = 'initial');
          
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
          element.oPos = target.style.position;
          element.oTop = target.style.top;
          element.oZI = target.style.zIndex;

          element.value = this.setValue(element);
          element.pvalue = this.setParentValue(element);
         
          let actualWidth = window.getComputedStyle(element.target, null).getPropertyValue('width');
          element.target.style.width = actualWidth;

          this.setTimeoutTriggers();
          if(element.container){
            element.parent.style.height = element.target.offsetHeight + "px";
            element.parent.style.width = element.target.offsetWidth + "px";
            element.parent.style.float = "left";
            // element.target.style.height = element.target.offsetHeight + "px";
            // element.target.style.width = actualWidth + "px";
          }

          window.addEventListener('scroll', this.scrollTimeoutHandler.bind(this), false);
          break;
        default:
          console.log('Invalid type specified.');
      }

      window.addEventListener('resize', this.reszieEventHandler.bind(this), false);
      window.addEventListener('load', this.loadEventHandler.bind(this), false);

      // General target styles we always want.
      target.style.zIndex = '10000';
    });

    // Observe anything with the sticky-events class
    observeStickyEvents();
  }
};

// Custom event for script loaded
let event_init = new CustomEvent('sticky-element:load');
document.dispatchEvent(event_init);

module.exports = StickyElements;