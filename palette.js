var Palette = (function() {
    
    var palette = {}, undefined, doc = document, currentColor;
    
    // Quick reference variables
    var push = Array.prototype.push,
        slice = Array.prototype.slice,
        hasOwnProperty = Object.prototype.hasOwnProperty;
    
    // Native implementations
    var nativeForEach = Array.prototype.forEach,
        nativeMap = Array.prototype.map;
    
    // Establish the object that gets returned to break out of a loop iteration.
    var breaker = {};
        
    // Initial configuration
    var options = {
        change: noop,
        toggle: noop,
        paletteArray: [
            ['#fff', '#000']
        ]
    }
    
    // Set up default markup.
    var markupInput = [
            "<div class='color-container'>",
            "<div class='color-preview'></div>",
            "</div>"
        ].join(''),
        // no need to use a function, only for educational purposes
        markupPalette = function() {
            return [
                "<div class='palette-container'>",
                "</div>"
            ].join('');
        };
        
    /*
     * private methods
     */
        
    // @see https://developer.mozilla.org/en-US/docs/DOM/Node.replaceChild
    function replace(el, markup) {
        var newNode = html2dom(markup);
        el.parentNode.replaceChild(newNode, el);
        return newNode;
    }
    
    // this function is not cross browser compatible due to issues of IE with 
    // innerHTML
    function html2dom(markup) {
        var tmpDiv = doc.createElement('div');
        tmpDiv.innerHTML = markup;
            
        return tmpDiv.firstChild;
    }
    
    // find left-bottom coordinates of the element
    function findOffset(el) {
        var el_l = el_t = 0, el_h = el.offsetHeight;
        do {
                el_l += el.offsetLeft;
                el_t += el.offsetTop;
        } while (el = el.offsetParent);
        return [el_l, el_t + el_h];
    }
    
    // show/hide the palette
    function toggle(paletteTool, picker, position) {
        paletteTool.style.display = (paletteTool.style.display == 'block') ? 'none' : 'block';
        paletteTool.style.position = "absolute";
        paletteTool.style.top = position[1] + "px";
        paletteTool.style.left = position[0] + "px";
        
        var parentDiv = picker.parentNode;
        parentDiv.insertBefore(paletteTool, picker.nextSibling);
    }
    
    // generate a row of colors
    function paletteTemplate(p) {
        var html = [];
        for (var i = 0; i < p.length; i++) {
            html.push('<span data-color="' + p[i] + '" style="background-color:' + p[i] + ';"></span>');
        }
        return "<div class='palette-row'>" + html.join('') + "</div>";
    }
    
    // draw the palette
    function drawPalette() {
        var paletteTool = html2dom(markupPalette());
        
        utils.map(options.paletteArray, function (p, i) {
            paletteTool.appendChild(html2dom(paletteTemplate(p)));
        });   
        
        return paletteTool;
    }
    
    // which element is clicked
    // @see http://www.quirksmode.org/js/events_properties.html
    function srcElement(e) {
        var targ;
	if (!e) 
            var e = window.event;
	if (e.target) 
            targ = e.target;
	else if (e.srcElement) 
            targ = e.srcElement;
	if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;
        return targ;
    }
    
    // retrieve the data-* value
    function getColorValue(el) {
        return el.getAttribute('data-color');
    }
    
    // Use this empty function to pass around a function that will do nothing.
    function noop() {
        return 'noop';
    }
    
    /*
     * public methods
     */
    
    // initialize the palette
    palette.init = function(el, op) {
        utils.extend(options, op);
        var picker = replace(el, markupInput);
        var paletteTool = drawPalette();
        
        var toggleSignal = new Signal();
        var changeSignal = new Signal();

        toggleSignal.add(function() {
            var pos = findOffset(picker);
            toggle(paletteTool, picker, pos);
        });
        
        picker.onclick = function(e) {
            toggleSignal.dispatch();
        }
        
        console.log(options.change());
        
        if(options.change() === 'noop') {
            changeSignal.add(function(){
                alert('Selected color: ' + currentColor);
            });
        } else {
            changeSignal.add(options.change);
        }
        
        // delegate the events of selecting a color
        utils.delegate(paletteTool, 'click', function(e) {
            var source = srcElement(e);
            if(source.nodeName == 'SPAN') {
                currentColor = getColorValue(source);
                changeSignal.dispatch();
            }
        });
    }
    
    // the currently selected color
    palette.currentColor = function() {
        return currentColor;
    }
    
    // 10x to underscore.js
    var utils = {
        // each(list, iterator, [context])
        // Iterates over a list of elements, yielding each in turn to an iterator 
        // function. The iterator is bound to the context object, if one is passed.
        each: function(obj, iterator, context) {
            if (obj == null) return;
            if (nativeForEach && obj.forEach === nativeForEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (iterator.call(context, obj[i], i, obj) === breaker) return;
                }
            } else {
                for (var key in obj) {
                    if (this.has(obj, key)) {
                        if (iterator.call(context, obj[key], key, obj) === breaker) return;
                    }
                }
            }
        },
        
        // extend(destination, *sources) 
        // Copy all of the properties in the source objects over to the destination 
        // object, and return the destination object.
        extend: function(obj) {
            this.each(slice.call(arguments, 1), function(source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            });
            return obj;
        },
        
        // Produces a new array of values by mapping each value in list through 
        // a transformation function (iterator).
        map: function(obj, iterator, context) {
            var results = [];
            if (obj == null) return results;
            if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
            this.each(obj, function(value, index, list) {
                results[results.length] = iterator.call(context, value, index, list);
            });
            return results;
        },

        // If an object has a given property directly on itself
        has: function(obj, key) {
            return hasOwnProperty.call(obj, key);
        },
        
        // Delegate an event (just need it for a click event)
        delegate: function(obj, event, callback) {
            if (obj.addEventListener)
                obj.addEventListener(event, callback);
            else if (obj.attachEvent)
                obj.attachEvent('on' + event, callback);
        }
    }
    
    // let's add some event handlers
    function Signal() {
        this.listeners = [];
    }

    Signal.prototype =  {
        
        isRegistered: function(callback) {
            if(this.listeners.length == 0)
                return false;
            for(var index in this.listeners)
                if(this.listeners[index].callback == callback)
                    return true;
            return false;
        },
        add: function(callback) {
            if(!callback || typeof callback != 'function') {
                throw new Error('Invalid callback');
                return;
            }
            if(this.isRegistered(callback))
                return;
            this.listeners.push({callback: callback, once: false});
        },
        addOnce: function(callback) {
            if(!callback || typeof callback != 'function') {
                throw new Error('Invalid callback');
                return;
            }
            if(this.isRegistered(callback))
                return;
            this.listeners.push({callback: callback, once: true});
        },
        dispatch: function() {
            if(this.listeners.length == 0)
                return;
            var index = 0, count = this.listeners.length, listener;
            for(; index < count; index++) {
                listener = this.listeners[index];
                listener.callback.apply(null, arguments);
                if(!listener.once)
                    continue;
                this.listeners.splice(index, 1);
                index--; count--;
            }
        },
        remove: function(callback) {
            if(this.listeners.length ==0)
                return;
            var index, listener;
            for(index in this.listeners) {
                listener = this.listeners[index];
                if(listener.callback != callback)
                    continue;
                this.listeners.splice(index, 1);
                break;
            }
        },
        removeAll: function() {
            this.listeners = [];
        },
        toString: function() {
            return "[Signal]";
        }
    }
    
    // export
    return palette;
    
}).call(this);

window.Palette || ( window.Palette = {} );