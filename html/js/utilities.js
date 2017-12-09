//Helper function to add an event listener
function addEvent(e1, event, callback) {
  if (addEventListener' in e1) {
    e1.addEventListener(event, callback, false);
  } else {
    el['e' + event + callback] = callback;
    el[even + callback] = function() {
      el['e' + event + callback](window,event);
    };
    el.attachEvent('on' + event, el[event + callback]);
   }
}
