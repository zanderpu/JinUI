/** 
* JinUI V0.0.1 
* By Puter
* https://zanderpu.github.com/JinUI
 */
;(function () {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/


	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}


		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};


	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};


	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};


	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};


	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};


	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};


	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};


	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};


	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};


	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};


	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};


	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};


	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};


	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};


	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};


	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};


	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};


	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());

;(function(){}(
	window.onload = function(){
		new FastClick(document.body);
	}
));
/*===========================
jinui js
===========================*/
var jinui = {
	close:function(index){
		$(index).remove();
	}
};

window.jinui = jinui;

/*===========================
calendar
===========================*/
+ function($) {
    "use strict";

    var format = function(d) {
        return d*1 < 10 ? "0"+d*1 : d*1;
    };

    var Calendar = function (params) {
        var c = this;
        params = params || {};
        for (var def in $.fn.calendar.defaults) {
            if (typeof params[def] === 'undefined') {
                params[def] = $.fn.calendar.defaults[def];
            }
        }
        c.params = params;



        // Format date
        function formatDate(date) {
            date = new Date(date);
            var year = date.getFullYear();
            var month = date.getMonth();
            var month1 = month + 1;
            var day = date.getDate();
            var weekDay = date.getDay();
            return c.params.dateFormat
                .replace(/yyyy/g, year)
                .replace(/yy/g, (year + '').substring(2))
                .replace(/mm/g, month1 < 10 ? '0' + month1 : month1)
                .replace(/m/g, month1)
                .replace(/MM/g, c.params.monthNames[month])
                .replace(/M/g, c.params.monthNamesShort[month])
                .replace(/dd/g, day < 10 ? '0' + day : day)
                .replace(/d/g, day)
                .replace(/DD/g, c.params.dayNames[weekDay])
                .replace(/D/g, c.params.dayNamesShort[weekDay]);
        }

        //获取某一个月多少天
        function getMonth(year,month){
            return 32-new Date(year,month,32).getDate();
        }

        //生成月份html
        function monthHTML(year,month){
            $(c.year).html(c.currentYear);
            $(c.month).html(c.params.monthNames[c.currentMonth]);
            $(c.day).html(format(c.currentDay)+'日');


            var totalDay = getMonth(year,month);//当月总天数
            var prevDtotalday = getMonth(month,month-1);//上月总天数

            var firstDayDate = new Date();
            firstDayDate.setFullYear(year,month,1);
            var firstDay = firstDayDate.getDay()===0 ? 6 : firstDayDate.getDay()-1;//当月第一天星期
            
            //插入第一行
            var totalrun=0;
            var alldays = [];
            var i=0;
            var tdnum=1;

            for(i=0;i<firstDay;i++){//上一月
                tdnum = prevDtotalday - firstDay;
                tdnum = tdnum+i+1;
                totalrun = totalrun+1;
                alldays.push('<span class="jinui_calendar_day othermonth">'+ tdnum +'</span>');
            }
            tdnum=1;
            for(i=tdnum-1;i<totalDay;i++){//当前月
                var nowDate = new Date();
                var valueDate = new Date(c.params.value);

                if(c.params.markDays.indexOf(tdnum)>-1){
                    alldays.push('<span class="jinui_calendar_day ">'+ tdnum +'</span><span class="jinui_calendar_badge"></span>');
                }else if(valueDate.getFullYear()==nowDate.getFullYear() && valueDate.getMonth()==month && valueDate.getDate()==tdnum){
                    alldays.push('<span class="jinui_calendar_day active">'+ tdnum +'</span>');
                }else if(c.currentYear==nowDate.getFullYear() && month==nowDate.getMonth() && tdnum==nowDate.getDate()){
                    alldays.push('<span class="jinui_calendar_day today">'+ tdnum +'</span>');
                }else{
                    alldays.push('<span class="jinui_calendar_day">'+ tdnum +'</span>');
                }

                
                
                totalrun = totalrun+1;
                tdnum++;
            }
            tdnum=1;
            for(i=totalrun;i<42;i++){//下一月
                alldays.push('<span class="jinui_calendar_day othermonth">'+ tdnum +'</span>');
                tdnum++;
            }

            var trobj = '<table class="jinui_calendar_table"><tr>';
            for(i=0;i<alldays.length;i++){
                if(i%7 === 0){
                    trobj = i===0 ? '<table class="jinui_calendar_table" width="'+ c.width +'"><tr>' : trobj + '</tr><tr>';
                }
                trobj += '<td>'+alldays[i]+'</td>';
                
            }
            trobj += '</tr></table>';
            return trobj;
            
        }

        //设置日期
        function setDate(date){
            var dateObj = new Date(date);
            var setYear = dateObj.getFullYear();
            var setMonth = dateObj.getMonth();
            var setDay = dateObj.getDate();
            if(setYear != c.currentYear || setMonth != c.currentMonth){
                c.initMonthHtml(date);
            }else{
                if(setDay != c.currentDay){
                    c.currentDay = setDay;
                    $(c.day).html(format(c.currentDay)+'日');
                }
            }
            c.params.currentValue = date;
            
        }

        //添加事件
        c.event = function(){
            var calendarWarp = $(c.container).find('.jinui_calendar_inner');
            $(calendarWarp).css({
                '-webkit-transform': 'translatex(-'+ c.width +'px)',
                'transform':'translatex(-'+ c.width +'px)'
            });

            var startX,left,startTime;
            $(calendarWarp)[0].addEventListener('touchstart',function(event){
                var touch = event.targetTouches[0];
                startX = touch.pageX;
                left = 0;
                startTime = new Date();
                //event.preventDefault();
            }); 
            $(calendarWarp)[0].addEventListener('touchmove',function(event){
                
                var touch = event.targetTouches[0];
                var translatex = 320;
                left = touch.pageX - startX;
                translatex = translatex-left;
                if(Math.abs(left) < 10 && new Date() - startTime < 200){
                    return;
                }
                $(calendarWarp).css({
                    '-webkit-transform': 'translatex(-'+ translatex +'px)',
                    'transform':'translatex(-'+ translatex +'px)'
                });
                event.preventDefault();
            });
            $(calendarWarp)[0].addEventListener('touchend',function(event){

                if(Math.abs(left) > 100){
                    if(left>0){
                        c.currentMonth = c.currentMonth - 1;
                        if(c.currentMonth<0){
                            c.currentYear--;
                            c.currentMonth = 11;
                        }
                        $(monthHTML(c.currentYear,c.currentMonth-1)).prependTo($(c.container).find('.jinui_calendar_inner'));
                        $($(calendarWarp).find('.jinui_calendar_table')[3]).remove();

                    }else{
                        c.currentMonth = c.currentMonth + 1;
                        if(c.currentMonth>11){
                            c.currentYear++;
                            c.currentMonth = 0;
                        }
                        $(monthHTML(c.currentYear,c.currentMonth+1)).appendTo($(c.container).find('.jinui_calendar_inner'));

                        $($(calendarWarp).find('.jinui_calendar_table')[0]).remove();
                    }

                    c.params.currentValue = c.currentYear + '-' + format(c.currentMonth+1) + '-' + format(c.currentDay);
                    c.params.onMonthChange.call(c,formatDate(c.params.currentValue));
                }
                $(calendarWarp).css({
                    '-webkit-transform': 'translatex(-'+ c.width +'px)',
                    'transform':'translatex(-'+ c.width +'px)'
                });
                //event.preventDefault();
            });
    
            $(c.container).find('.jinui_calendar_warp').on('click', '.jinui_calendar_day', function(event) {
                event.preventDefault();
                if($(this).hasClass('othermonth') || $(this).hasClass('disable')){
                    return;
                }
                $(c.container).find('.active').removeClass('active');
                $(this).toggleClass('active');
                setDate(c.currentYear + '-' + format(c.currentMonth+1) + '-' + format($(this).text()));
                c.params.value = c.params.currentValue;
                c.params.onClickDay.call(c,c.params.value);

                if(!c.params.inline){
                    $(c.params.input).val(c.params.value);
                    c.close();
                }
            });



            //上一年
            $(c.container).find('.jinui_calendar_year_prev').bind('click', function(event) {
                var month = c.currentMonth + 1,year = c.currentYear;
                year--;
                setDate(year + '-' + format(month) + '-' + format(c.currentDay));
            });

            //下一年
            $(c.container).find('.jinui_calendar_year_next').bind('click', function(event) {
                var month = c.currentMonth + 1,year = c.currentYear;
                year++;
                setDate(year + '-' + format(month) + '-' + format(c.currentDay));
            });

            //上一个月
            $(c.container).find('.jinui_calendar_month_prev').bind('click', function(event) {
                var month = c.currentMonth + 1,year = c.currentYear;
                if(month<2){
                    year--;
                    month = 12;
                }else{
                    month--;
                }
                setDate(year + '-' + format(month) + '-' + format(c.currentDay));
            });

            //下一个月
            $(c.container).find('.jinui_calendar_month_next').bind('click', function(event) {
                var month = c.currentMonth + 1,year = c.currentYear;
                if(month>11){
                    year++;
                    month = 1;
                }else{
                    month++;
                }
                setDate(year + '-' + format(month) + '-' + format(c.currentDay));
            });

            window.onresize=function(){
                $($(document.body).data('calendar')).each(function(index,el){
                    $(el).calendar('resize');
                });
            };


            if(c.params.inline === false){
                $(c.params.container).bind('click', function(event) {
                    
                });
            }

            //点击遮罩关闭
            $(c.container).find('.jinui_mask').bind('click', function(event) {
                c.close();
            });

            $(c.params.input).bind('click', function(event) {
                c.show();
            });
            
        };

        //初始化html代码
        c.initMonthHtml = function(date){
            date = new Date(date);
            c.currentYear = date.getFullYear();
            c.currentMonth = date.getMonth();
            c.currentDay = date.getDate();

            $(c.year).html(c.currentYear);
            $(c.month).html(c.params.monthNames[c.currentMonth]);
            $(c.day).html(c.currentDay+'日');

            
            $(c.container).find('.jinui_calendar_inner').html('');
            $(monthHTML(c.currentYear,c.currentMonth-1)).appendTo($(c.container).find('.jinui_calendar_inner'));
            $(monthHTML(c.currentYear,c.currentMonth)).appendTo($(c.container).find('.jinui_calendar_inner'));
            $(monthHTML(c.currentYear,c.currentMonth+1)).appendTo($(c.container).find('.jinui_calendar_inner'));

            
        };

        //初始化框架
        c.init = function(){
            var hdHtml;
            if(c.params.inline){//内联
                hdHtml = '<div class="jinui_calendar_hd"><div class="jinui_calendar_yearmonth"><div class="jinui_calendar_year"><span class="jinui_calendar_title jinui_calendar_year_text"></span></div><div class="jinui_calendar_month"><span class="jinui_calendar_title jinui_calendar_month_text"></span></div></div><div class="jinui_calendar_title_day"><a href="javascript:;" class="jinui_calendar_link jinui_calendar_month_prev"><i class="jinui_icon jinui_icon_chevron_left"></i></a><span class="jinui_calendar_title jinui_calendar_day_text"></span><a href="javascript:;" class="jinui_calendar_link jinui_calendar_month_next"><i class="jinui_icon jinui_icon_chevron_right"></i></a></div></div>';
            }else{
                hdHtml = '<div class="jinui_calendar_hd"><div class="jinui_calendar_year"><a href="javascript:;" class="jinui_calendar_link jinui_calendar_year_prev"><i class="jinui_icon jinui_icon_chevron_left"></i></a><span class="jinui_calendar_title jinui_calendar_year_text"></span><a href="javascript:;" class="jinui_calendar_link jinui_calendar_year_next"><i class="jinui_icon jinui_icon_chevron_right"></i></a></div><div class="jinui_calendar_month"><a href="javascript:;" class="jinui_calendar_link jinui_calendar_month_prev"><i class="jinui_icon jinui_icon_chevron_left"></i></a><span class="jinui_calendar_title jinui_calendar_month_text"></span><a href="javascript:;" class="jinui_calendar_link jinui_calendar_month_next"><i class="jinui_icon jinui_icon_chevron_right"></i></a></div></div>';
            }
            var bdHtml = '<div class="jinui_calendar_bd">';
            var dayHtml = '<table class="jinui_calendar_table" width="100%" border="0"><thead><tr>';
            if(c.params.firstDay===0){
                var first = c.params.dayNames[0];
                c.params.dayNames[0] = c.params.dayNames[6];
                c.params.dayNames[6] = first;
            }
            for(var v in c.params.dayNames){
                dayHtml += '<th>'+ c.params.dayNames[v] +'</th>';
            }
            dayHtml += '</tr></thead></table>';

            bdHtml += dayHtml+ '<div class="jinui_calendar_warp"><div class="jinui_calendar_inner"></div></div></div>';

            var classSkin = '';
            switch(c.params.theme){
                case 'info':
                    classSkin = 'jinui_calendar_info';
                    break;
                case 'success':
                    classSkin = 'jinui_calendar_success';
                    break;
                case 'danger':
                    classSkin = 'jinui_calendar_danger';
                    break;
                case 'primary':
                    classSkin = 'jinui_calendar_primary';
                    break;
                case 'warning':
                    classSkin = 'jinui_calendar_warning';
                    break;
                default:
                    classSkin = '';
                    break;
            }
            if(c.params.inline){//内联
                c.container = $('<div class="jinui_calendar jinui_calendar_inline '+ classSkin +'">'+ hdHtml + bdHtml +'</div>').appendTo(c.params.container);
            }else{
                c.container = $('<div class="jinui_calendar '+ classSkin +'"><div class="jinui_mask"></div><div class="jinui_calendar_dialog">'+ hdHtml + bdHtml +'</div></div>').appendTo(document.body);
            }
            
            c.year = $(c.container).find('.jinui_calendar_year_text');
            c.month = $(c.container).find('.jinui_calendar_month_text');
            c.day = $(c.container).find('.jinui_calendar_day_text');

            c.width = $(c.container).find('.jinui_calendar_bd').width();
            $(c.container).find('.jinui_calendar_warp').width(c.width);
            $(c.container).find('.jinui_calendar_inner').width(c.width*3);


            setDate(c.params.currentValue);
            c.event();
        };

        

        c.init();

        c.setDate = function(date){
            setDate(date);
        };

        c.setMarkDays = function(days){
            $('.jinui_calendar_badge').remove();
            if(typeof days == typeof []){
                $($(c.container).find('.jinui_calendar_table')[2]).find('.jinui_calendar_day:not(.othermonth)').each(function(index,el){
                    if(days.indexOf($(el).text()*1)>-1){
                        $('<span class="jinui_calendar_badge"></span>').insertAfter($(el));
                    }
                });
            }else if(typeof days == typeof 0){
                $($(c.container).find('.jinui_calendar_table')[2]).find('.jinui_calendar_day:not(.othermonth)').each(function(index,el){
                    if(days == $(el).text()*1){
                        $('<span class="jinui_calendar_badge"></span>').insertAfter($(el));
                        return false;
                    }
                });
            }
        };

        c.resize = function(){
            c.width = $(c.container).find('.jinui_calendar_bd').width();
            $(c.container).find('.jinui_calendar_warp').width(c.width);
            $(c.container).find('.jinui_calendar_inner').width(c.width*3);

            $(c.container).find('.jinui_calendar_inner').css({
                '-webkit-transform': 'translatex(-'+ c.width +'px)',
                'transform':'translatex(-'+ c.width +'px)'
            });

            c.initMonthHtml(c.params.currentValue);
        };

        c.close = function(){
            $(c.container).find('.jinui_calendar_dialog').removeClass('jinui_animation_open').addClass('jinui_animation_close');
            setTimeout(function(){
                $(c.container).hide();
            },200);
        };

        c.show = function(){
            $(c.container).show();
            c.resize();
            if($(c.params.input).val() !== ''){
                setDate($(c.params.input).val());
            }else{
                setDate(new Date());
            }
            $(c.container).find('.jinui_calendar_dialog').removeClass('jinui_animation_close').addClass('jinui_animation_open');
        };

        c.setDay = function(date){//选中天

        };

        if(!c.params.inline){//内联
            if(c.params.hasDefault){
                $(c.params.input).val(formatDate(c.params.value));
            }
            $(c.params.input).attr('readonly','readonly');
            $(c.container).hide();
        }
        
        c.params.onInit.call(c,formatDate(c.params.currentValue));
        return c;
    };
    
    
    

    $.fn.calendar = function(params, args) {
        params = params || {};
        return this.each(function() {
            var $this = $(this);
            if (!$this[0]) return;
            var p = {};
            if ($this[0].tagName.toUpperCase() === "INPUT") {
                p.input = $this;
            } else {
                p.container = $this;
            }

            var calendar = $this.data("calendar");


            if (!calendar) {
                p.value = params.value || $this.val();
                //默认显示今天
                
                if (!p.value) {
                    var today = new Date();
                    p.currentValue = today.getFullYear() + "-" + format(today.getMonth() + 1) + "-" + format(today.getDate());
                }else{
                    p.hasDefault = true;
                    var temp = p.value.replace(/-/g, "/");
                    p.value = temp.split('/')[0]+ '-' +format(temp.split('/')[1])+ '-' +format(temp.split('/')[2]);
                    console.log(p.value);
                    p.currentValue = p.value;
                }
                if(params.input){
                    params.inline = false;
                }
                calendar = $this.data("calendar", new Calendar($.extend(p, params)));

                //保存所有日历对象
                var allCalendars = $(document.body).data('calendar') ? $(document.body).data('calendar') : [];
                allCalendars.push($this);
                $(document.body).data('calendar',allCalendars);
            }

            if (typeof params === typeof "a") {
                calendar[params].call(calendar, args);
            }
        });
    };


    $.fn.calendar.defaults = {
        monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        monthNamesShort: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        dayNames: ['一', '二', '三', '四', '五', '六','日'],
        dayNamesShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        firstDay: 1, //第一天是周日还是周一 0周日 1周一
        inline:false,//内联
        dateFormat: 'yyyy-mm-dd',
        minDate: null,
        maxDate: null,
        theme:'',//主题
        markDays:[],//需要标记的天
        hasDefault:false,//显示默认值
        value:'',//默认值
        onClickDay:function(date){},//点击天
        onMonthChange:function(date){},//月改变
        onInit:function(date){},//初始化成功
        
    };


}($);
/*===========================
dialog
===========================*/
+ function($) {
    "use strict";

    var default_opts = {
    	title:'',
    	content:'',
    	btn:[],
    	background:'#fff',
    	skin:'',
        btns:[],
    	shade:true,
    	shadeClose:false,
    };

    jinui.modal = function(options){
    	var opts = $.extend({},default_opts, options);

    	var _html = '<div class="jinui_dialog">';

    	if(opts.shade){
    		_html += '<div class="jinui_mask"></div>';
    	}

    	_html += '<div class="jinui_dialog_inner"><div class="jinui_dialog_bd">'+ opts.content +'</div></div></div>';

    	var obj = $(_html).appendTo(document.body);
    	$(obj).find('.jinui_dialog_inner').css({
    		background:opts.background
    	});
    	$(obj).addClass(opts.skin);


    	$(obj).delegate('[jinui-dialog-btn="close"]', 'click', function(event) {
    		$(obj).remove();
    	});

    	if(opts.shadeClose){
    		$(obj).delegate('.jinui_mask', 'click', function(event) {
	    		$(obj).remove();
	    	});
    	}
    };

    jinui.dialog = function(options){
        var opts = $.extend({},default_opts, options);

        var _html = '<div class="jinui_dialog jinui_dialog_confirm"><div class="jinui_mask"></div><div class="jinui_dialog_inner"><div class="jinui_dialog_hd"><strong class="jinui_dialog_title">'+ opts.title +'</strong></div><div class="jinui_dialog_bd">'+ opts.content +'</div><div class="jinui_dialog_ft"></div></div></div>';

        var obj = $(_html).appendTo(document.body);
        $(obj).addClass(opts.skin);


        for(var i=0;i<opts.btns.length;i++){
            opts.btns[i].style = opts.btns[i].style==='' ? 'default' : opts.btns[i].style;
            var btnHtml = '<a href="javascript:;" class="jinui_dialog_btn '+ opts.btns[i].style +'">'+ opts.btns[i].text +'</a>';
            var fn = opts.btns[i].handle;
            $(btnHtml).appendTo($(obj).find('.jinui_dialog_ft')).bind('click', function(event) {
                fn.call(this);
            });
        }

        return obj;
    };

    jinui.alert = function(title,content,fn){
    	var _html = '<div class="jinui_dialog jinui_dialog_alert"><div class="jinui_mask"></div><div class="jinui_dialog_inner"><div class="jinui_dialog_hd"><strong class="jinui_dialog_title">'+ title +'</strong></div><div class="jinui_dialog_bd">'+ content +'</div><div class="jinui_dialog_ft"><a href="javascript:;" class="jinui_dialog_btn primary">确定</a></div></div></div>';

    	var obj = $(_html).appendTo(document.body);
    	$(obj).delegate('.jinui_dialog_btn.primary', 'click', function(event) {
    		$(obj).remove();
    		fn ? fn.call(this) : '';
    	});
    	return obj;
    };

    jinui.confirm = function(title,content,fn){
    	var _html = '<div class="jinui_dialog jinui_dialog_confirm"><div class="jinui_mask"></div><div class="jinui_dialog_inner"><div class="jinui_dialog_hd"><strong class="jinui_dialog_title">'+ title +'</strong></div><div class="jinui_dialog_bd">'+ content +'</div><div class="jinui_dialog_ft"><a href="javascript:;" class="jinui_dialog_btn default">取消</a><a href="javascript:;" class="jinui_dialog_btn primary">确定</a></div></div></div>';

    	var obj = $(_html).appendTo(document.body);
    	$(obj).delegate('.jinui_dialog_btn.primary', 'click', function(event) {
    		$(obj).remove();
    		fn ? fn.call(this,true) : '';
    	});
    	$(obj).delegate('.jinui_dialog_btn.default', 'click', function(event) {
    		$(obj).remove();
    		fn ? fn.call(this,false) : '';
    	});
    	return obj;
    };

}($);
/*===========================
picker
===========================*/
+ function($) {
    "use strict";

    var Picker = function(params){
        var p = this;
        params = params || {};
        p.params = $.extend({},$.fn.picker.defaults, params);

        $(p.params.container).bind('click', function(event) {
            event.stopPropagation();
            p.open();
        }).attr('readonly',true);

        function initHtml(){//初始化html
            

            var _html = '<div class="jinui_picker jinui_animation_open"><div class="jinui_picker_container"><div class="jinui_picker_hd"><h1 class="jinui_picker_title">'+ p.params.title +'</h1><a href="javascript:;" class="jinui_picker_btn">确定</a></div><div class="jinui_picker_bd"><div class="jinui_picker_cols"></div><div class="jinui_picker_highlight"></div></div></div></div>';
            p.pickerHTML = $(_html).appendTo(document.body);
            p.pickerColsHTML = p.pickerHTML.find('.jinui_picker_cols');

            $(p.pickerHTML).data('picker',p);

            var _colshtml = '';
            for(var i in p.params.cols){
                _colshtml += '<div class="jinui_picker_col"><div class="jinui_picker_items">';
                for(var j in p.params.cols[i]){
                    var _val = p.params.cols[i][j].value ? p.params.cols[i][j].value : p.params.cols[i][j].text;
                    var _colhtml = '<div class="jinui_picker_item" data-picker-value="'+ _val +'">'+ p.params.cols[i][j].text +'</div>';
                    _colshtml += _colhtml;
                }
                _colshtml += '</div></div>';
            }
            
            p.pickerColsHTML.html(_colshtml);
            setValue();
            initEvent();
        }

        function initEvent(){//初始化事件


            $(p.pickerHTML).bind('touchmove', function(event) {
                event.preventDefault();
            });
            $(p.pickerHTML).bind('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
            });

            var startY,moveY,translatey,nowSelected;
            $('.jinui_picker_items').bind('touchstart', function(event) {
                var $this = $(this);
                var touch = event.targetTouches[0];
                startY = touch.pageY;
                moveY = 0;
                translatey = $this.attr('translatey') ? $this.attr('translatey')*1 : 102;
            });
            $('.jinui_picker_items').bind('touchmove', function(event) {
                var $this = $(this);
                var touch = event.targetTouches[0];
                moveY = touch.pageY - startY;
                
                var top = translatey + moveY;

                $this.css({
                    '-webkit-transform': 'translateY('+ top +'px)',
                    'transform':'translateY('+ top +'px)',
                    'transition-duration':'0ms'
                });

                var _top = translatey + Math.round(moveY/34)*34;

                nowSelected = _top>102 ? 0 : Math.abs(Math.round((_top-102)/34));//判断是否超过顶部
                var bottom = 136-$this.find('.jinui_picker_item').length*34;
                nowSelected = _top < bottom ? $this.find('.jinui_picker_item').length-1 : nowSelected;//判断是否超过底部

                $this.find('.jinui_picker_selected').removeClass('jinui_picker_selected');
                $($this.find('.jinui_picker_item')[nowSelected]).addClass('jinui_picker_selected');

                //console.log($($this.find('.jinui_picker_item')[nowSelected]).attr('data-picker-value'));
                //console.log($($this.find('.jinui_picker_item')[nowSelected]).html());

                changeVal();
            });

            $('.jinui_picker_items').bind('touchend', function(event) {
                var $this = $(this);
                translatey = translatey + Math.round(moveY/34)*34;
                translatey = translatey>102 ? 102 : translatey;

                var bottom = 136-$this.find('.jinui_picker_item').length*34;//获取最底部距离
                translatey = translatey < bottom ? bottom : translatey;//判断是否超过最底部

                $this.css({
                    '-webkit-transform': 'translatey('+ translatey +'px)',
                    'transform':'translatey('+ translatey +'px)',
                    'transition-duration':''
                });
                $this.attr('translatey',translatey);
            });

            $(document.body).bind('click', function(event) {
                p.close();
            });

            $(p.pickerHTML).find('.jinui_picker_btn').bind('click', function(event) {
                p.close();
            });

            return p;
        }

        function setValue(value){
            var val = value || $(p.params.container).val().split(' ');

            $(p.pickerHTML).find('.jinui_picker_selected').removeClass('jinui_picker_selected');

            $(p.pickerHTML).find('.jinui_picker_col').each(function(i, el) {
                $(el).find('.jinui_picker_item').each(function(j, elem) {
                    var _this = $(elem);
                    if(val[i]){
                        if(_this.html() == val[i]){
                            var top=102-j*34;
                            _this.addClass('jinui_picker_selected');

                            $(el).find('.jinui_picker_items').css({
                                '-webkit-transform': 'translateY('+ top +'px)',
                                'transform':'translateY('+ top +'px)',
                                'transition-duration':'0ms'
                            }).attr('translatey',top);

                            return false;
                        }
                    }else{
                        j===0 ? _this.addClass('jinui_picker_selected') : '';
                    }
                });
                
            });

            $(p.params.container).val(getValue().texts.join(' '));
            
        }

        function getValue(){
            var vals = [],texts=[],result=[],cols=[];
            $(p.pickerHTML).find('.jinui_picker_selected').each(function(index, el) {
                var text = $(el).text();
                var value = $(el).attr('data-picker-value');

                texts.push(text);
                vals.push(value);

                result.push({
                    text:text,
                    value:value
                });

                $(p.params.cols[index]).each(function(j, el) {
                    if(el.text == text){
                        cols.push(p.params.cols[index][j]);
                        return false;
                    }
                });
            });

            return {
                texts:texts,
                vals:vals,
                result:result,
                cols:cols
            };
        }

        var oldValue='';
        function changeVal(){
            $(p.params.container).val(getValue().texts.join(' '));
            if(oldValue != getValue().vals.join(' ')){
                p.params.onChange(p,getValue().texts.join(' '),getValue().vals.join(' '));
                oldValue = getValue().vals.join(' ');
            }
            event.preventDefault();
        }



        p.open = function(){
            if(!p.pickerHTML){
                $('.jinui_picker').length>0 ? $('.jinui_picker').data('picker').close() : '';
                initHtml();
            }
        };

        p.close = function(){
            p.params.onClose.call(p,getValue().result);
            $(p.pickerHTML).removeClass('jinui_animation_open').addClass('jinui_animation_close');
            setTimeout(function(){
                $(p.pickerHTML).remove();
                p.pickerHTML = null;
            },300);
        };

        //获取值
        p.getValue = function(){
            return getValue().cols;
        };

        //设置值
        p.setValue = function(value){
            if(value){
                $(p.params.container).val(value);
            }
        };

        p.updateCols = function(){
            console.log(p.params.cols);

            for(var i in p.params.cols){
                var _colshtml = '';
                var nowObj = $(p.pickerHTML).find('.jinui_picker_items')[i];
                for(var j in p.params.cols[i]){
                    var _val = p.params.cols[i][j].value ? p.params.cols[i][j].value : p.params.cols[i][j].text;
                    var _colhtml = '<div class="jinui_picker_item" data-picker-value="'+ _val +'">'+ p.params.cols[i][j].text +'</div>';
                    _colshtml += _colhtml;
                }
                $(nowObj).html(_colshtml);
            }
            setValue();

        };


        
    };

    $.fn.picker = function(params, args) {
        params = params || {};
        if(typeof params == typeof 'str'){
            var picker = $(this).data('picker');
            return picker[params].call(picker, args) || $(this);
        }
        return this.each(function() {
            var $this = $(this);
            if (!$this[0]) return;

            var picker = $this.data('picker');
            if(picker){
                picker[params].call(picker, args);
            }else{
                params.container = this;
                $this.data('picker',new Picker(params));
            }
            
        });
    };


    $.fn.picker.defaults = {
        title:'',
        cols:[],
        onChange:function(){},
        onClose:function(){}
    };


}($);
/*===========================
swiper
===========================*/
+ function($) {
    "use strict";

    var Swiper=function(params){
        var s = this;
        params = params || {};
        s.params = $.extend({},$.fn.swiper.defaults, params);
        s.index = 0;

        //console.log(s.params);

        function initHtml(){//初始化html
            s.containerHTML = $(s.params.container).find('.jinui_swiper_container');
            var _slideHTML = $(s.params.container).find('.jinui_swiper_slide');

            if(s.params.pagination){
                var _paginationhtml = s.params.pageposition != '' ? '<div class="jinui_swiper_pagination jinui_swiper_'+ s.params.pageposition +'">' : '<div class="jinui_swiper_pagination">';
                for(var i=0;i<_slideHTML.length;i++){
                    _paginationhtml += '<div class="jinui_swiper_page"></div>';
                }
                _paginationhtml += '</div>';

               s.pagHTML = $(_paginationhtml).appendTo($(s.params.container));
            }

            s.maxIndex = $(s.params.container).find('.jinui_swiper_slide').length-1;
            if(s.params.loop){
                var firstslide = $($(s.params.container).find('.jinui_swiper_slide')[0]).clone();
                var lastslide = $($(s.params.container).find('.jinui_swiper_slide').last()).clone();
                $(firstslide).appendTo($(s.params.container).find('.jinui_swiper_container'));
                $(lastslide).prependTo($(s.params.container).find('.jinui_swiper_container'));
                s.maxIndex = $(s.params.container).find('.jinui_swiper_slide').length-3;
            }

        }

        //水平滑动
        function initEvent(){
            if(!s.params.slide){
                return;
            }
            var startX,left;
            $(s.containerHTML).bind('touchstart', function(event) {
                var touch = event.targetTouches[0];
                startX = touch.pageX;
                left = 0;
            });
            $(s.containerHTML).bind('touchmove', function(event) {
                clearInterval(autoInterval);
                var $this = $(this);
                var touch = event.targetTouches[0];
                left = touch.pageX - startX;
                setSwiperLeftTop($this, (s.translatex + left),'0ms');

                event.preventDefault();
            });
            $(s.containerHTML).bind('touchend', function(event) {
                var $this = $(this),goIndex;
                if(left> 80 || left > (s.slideDistance/2)){//右滑
                    left = s.slideDistance;
                    goIndex = s.index-1;
                }else if(left < -80 || (left<0 && Math.abs(left) > (s.slideDistance/2))){//左滑
                    left = s.slideDistance*-1;
                    goIndex = s.index+1;
                }else{
                    left = 0;
                    goIndex = s.index;
                }

                go(goIndex);
                //是否继续循环滚动
                if(s.params.loop && s.params.auto){
                    startAuto();
                }
            });
        }

        //垂直滑动
        function initEventVertical(){
            if(!s.params.slide){
                return;
            }
            var startY,top;
            $(s.containerHTML).bind('touchstart', function(event) {
                var touch = event.targetTouches[0];
                startY = touch.pageY;
                top = 0;
            });
            $(s.containerHTML).bind('touchmove', function(event) {
                clearInterval(autoInterval);
                var $this = $(this);
                var touch = event.targetTouches[0];
                top = touch.pageY - startY;

                setSwiperLeftTop($this, (s.translatex + top),'0ms');

                event.preventDefault();
            });
            $(s.containerHTML).bind('touchend', function(event) {
                var $this = $(this),goIndex;
                if(top> 80 || top > (s.slideDistance/2)){//右滑
                    top = s.slideDistance;
                    goIndex = s.index-1;
                }else if(top < -80 || (top<0 && Math.abs(top) > (s.slideDistance/2))){//左滑
                    top = s.slideDistance*-1;
                    goIndex = s.index+1;
                }else{
                    top = 0;
                    goIndex = s.index;
                }

                go(goIndex);
                //是否继续循环滚动
                if(s.params.loop && s.params.auto){
                    startAuto();
                }
            });
        }

        function resize(){
            var itemLength = $(s.params.container).find('.jinui_swiper_slide').length;
            if(s.params.orientation==='horizontal'){//横向
                s.slideDistance = $(s.params.container).width();
                $(s.params.container).find('.jinui_swiper_slide').css({
                    'float':'left'
                });
                $(s.containerHTML).width(itemLength*s.slideDistance);
                $(s.params.container).find('.jinui_swiper_slide').width(s.slideDistance);
            }else if(s.params.orientation==='vertical'){//垂直
                s.slideDistance = $(s.params.container).find('.jinui_swiper_slide').height();
                $(s.containerHTML).height(itemLength*s.slideDistance);
                $(s.params.container).height(s.slideDistance);
            }

            resizePage();
            go(s.index);
        }

        //设置分页显示位置
        function resizePage(){
            if(s.params.pagination && s.params.pageposition.indexOf('center')>0){

                if(s.params.pageposition.indexOf('left')<0 && s.params.pageposition.indexOf('right')<0){
                    s.pagHTML.css({
                        'margin-left':s.pagHTML.width()/2*-1
                    });
                }else{
                    s.pagHTML.css({
                        'margin-top':s.pagHTML.height()/2*-1
                    });
                } 
                
            }
        }

        function go(i){

            var goIndex = i;
            

            if(s.params.loop){
                s.translatex = (goIndex*s.slideDistance+s.slideDistance)*-1;
                setSwiperLeftTop($(s.containerHTML), s.translatex,'300ms');

                if(goIndex>s.maxIndex){
                    goIndex = 0;
                    setTimeout(function(){
                        s.translatex = s.slideDistance*-1;
                        setSwiperLeftTop($(s.containerHTML), s.translatex,'0ms');
                    },300);
                }

                if(goIndex<0){
                    goIndex = s.maxIndex;
                    setTimeout(function(){
                        s.translatex = s.slideDistance*-1*(s.maxIndex+1);
                        setSwiperLeftTop($(s.containerHTML), s.translatex,'0ms');
                    },300);
                }

            }else{

                goIndex = goIndex>s.maxIndex ? s.maxIndex : goIndex;
                goIndex = goIndex<0 ? 0 : goIndex;
                s.translatex = (goIndex*s.slideDistance)*-1;

                setSwiperLeftTop($(s.containerHTML), s.translatex,'300ms');
            }

            if(s.params.pagination){//选中当前页
                $(s.params.container).find('.jinui_swiper_pagination .active').removeClass('active');
                $($(s.params.container).find('.jinui_swiper_page')[goIndex]).addClass('active');
            }

            if(s.index != goIndex){
                s.params.onChange.call(s,goIndex);
                s.params.onEnter.call(s,goIndex);
                s.params.onLeave.call(s,s.index);
            }
            s.index = goIndex;


        }

        /**
         * 滚动
         * @param {[type]} obj  [description]
         * @param {[type]} left [description]
         * @param {[type]} time [description]
         */
        function setSwiperLeftTop(obj,distance,time){
            if(s.params.orientation==='horizontal'){//横向
                $(obj).css({
                    '-webkit-transform': 'translateX('+ distance +'px)',
                    'transform':'translateX('+ distance +'px)',
                    'transition-duration':time
                });
            }else if(s.params.orientation==='vertical'){//垂直
                $(obj).css({
                    '-webkit-transform': 'translateY('+ distance +'px)',
                    'transform':'translateY('+ distance +'px)',
                    'transition-duration':time
                });
            }
        }


        var autoInterval;
        function startAuto(){
            autoInterval = setInterval(function(){
                go(s.index+1);
            },s.params.autotime);
        }

        //跳转到某项
        s.go = function(index){
            go(index);
        };

        window.onresize = function(){
            resize();
        };


        initHtml();
        if(s.params.orientation==='horizontal'){//横向
            initEvent();
        }else if(s.params.orientation==='vertical'){//垂直
            initEventVertical();
        }

        resize();
        //go(0);

        if(s.params.loop && s.params.auto){
            startAuto();
        }
    };



    $.fn.swiper = function(params, args) {
        params = params || {};
        if(typeof params == typeof 'str'){
            var swiper = $(this).data('swiper');
            return swiper[params].call(swiper, args) || $(this);
        }
        return this.each(function() {
            var $this = $(this);
            if (!$this[0]) return;

            var swiper = $this.data('swiper');
            if(swiper){
                swiper[params].call(swiper, args);
            }else{
                params.container = this;
                $this.data('swiper',new Swiper(params));
            }            
        });
    };


    $.fn.swiper.defaults = {
        loop:true,//是否循环滚动
        slide:true,//是否允许手动滑动
        auto:true,//自动滚动
        autotime:4000,//自动滚动时间间隔
        orientation:'horizontal',//滑动方向 横向 horizontal  垂直 vertical 垂直方向的时候一定要设置jinui_swiper_slide高度
        pagination:true,//是否显示页码标记
        pageposition:'bottomcenter',//当前页标记位置left、center、right、top、bottom
        onChange:function(index){},//slide改变
        onEnter:function(index){},//进入slide
        onLeave:function(index){},//离开slide
    };

}($);
/*===========================
toast
===========================*/
+ function($) {
    "use strict";

    var default_opts = {
    	content:'已完成',
    	type:0,//0完成，1错误，2，纯文本
    	time:800,//自动关闭时间ms
        toptip:'',//tips 纯文本提示，顶部 info,success,danger,primary,warning
    };

    jinui.toast = function(options) {
    	var opts = $.extend({},default_opts, options);

    	var _html = '<div class="jinui_toast"><div class="jinui_mask_transparent"></div><div class="jinui_toast_inner jinui_toast_success"><i class="jinui_icon jinui_icon_success_empty"></i><p class="jinui_toast_content">'+ opts.content +'</p></div></div>';


    	if(opts.type == 1){
    		_html = '<div class="jinui_toast"><div class="jinui_mask_transparent"></div><div class="jinui_toast_inner jinui_toast_warn"><i class="jinui_icon jinui_icon_warn"></i><p class="jinui_toast_content">'+ opts.content +'</p></div></div>';
    	}

    	if(opts.type == 2){
    		_html = '<div class="jinui_toast"><div class="jinui_mask_transparent"></div><div class="jinui_toast_inner jinui_toast_tip"><p class="jinui_toast_content">'+ opts.content +'</p></div></div>';
            if(opts.toptip !== ''){
                if(opts.time<2000){
                    opts.time = 2000;
                }
                switch(opts.toptip){
                    case 'info':
                        _html = '<div class="jinui_toptip bg_info">'+ opts.content +'</div>';
                        break;
                    case 'success':
                        _html = '<div class="jinui_toptip bg_success">'+ opts.content +'</div>';
                        break;
                    case 'danger':
                        _html = '<div class="jinui_toptip bg_danger">'+ opts.content +'</div>';
                        break;
                    case 'primary':
                        _html = '<div class="jinui_toptip bg_primary">'+ opts.content +'</div>';
                        break;
                    case 'warning':
                        _html = '<div class="jinui_toptip bg_warning">'+ opts.content +'</div>';
                        break;
                    default:
                       _html = '<div class="jinui_toptip '+ opts.toptip +'">'+ opts.content +'</div>';
                        break;
                }
            }
    	}

        var obj = $(_html).appendTo(document.body);

    	setTimeout(function(){
            $(obj).remove();
    	},opts.time);

    	return obj;
    };

    jinui.loading = function(text) {
    	var _html = '<div class="jinui_toast jinui_toast_loading_warp"><div class="jinui_mask_transparent"></div><div class="jinui_toast_inner jinui_toast_loading"><div class="jinui_loading"><div class="jinui_loading_leaf jinui_loading_leaf_0"></div><div class="jinui_loading_leaf jinui_loading_leaf_1"></div><div class="jinui_loading_leaf jinui_loading_leaf_2"></div><div class="jinui_loading_leaf jinui_loading_leaf_3"></div><div class="jinui_loading_leaf jinui_loading_leaf_4"></div><div class="jinui_loading_leaf jinui_loading_leaf_5"></div><div class="jinui_loading_leaf jinui_loading_leaf_6"></div><div class="jinui_loading_leaf jinui_loading_leaf_7"></div><div class="jinui_loading_leaf jinui_loading_leaf_8"></div><div class="jinui_loading_leaf jinui_loading_leaf_9"></div><div class="jinui_loading_leaf jinui_loading_leaf_10"></div><div class="jinui_loading_leaf jinui_loading_leaf_11"></div></div><p class="jinui_toast_content">加载中</p></div></div>';

    	var obj = $(_html).appendTo(document.body);
    	return obj;
    };

    jinui.hideLoading = function(){
    	$('.jinui_toast_loading_warp').remove();
    };

    //actionsheet
    jinui.actionsheet = function(options){
        var actionsheet_default_opts = {
            title:'',
            actions:[]
        }
        var opts = $.extend({},actionsheet_default_opts, options);


        var _html = '<div class="jinui_actionsheet"><div class="jinui_mask jinui_mask_animation"></div><div class="jinui_actionsheet_content"><div class="jinui_actionsheet_menu"></div><div class="jinui_actionsheet_cell jinui_actionsheet_cancel">取消</div></div></div>';
        if(opts.title != ''){

            _html = '<div class="jinui_actionsheet"><div class="jinui_mask jinui_mask_animation"></div><div class="jinui_actionsheet_content"><div class="jinui_actionsheet_cell jinui_actionsheet_title"><p>'+ opts.title +'</p></div><div class="jinui_actionsheet_menu"></div><div class="jinui_actionsheet_cell jinui_actionsheet_cancel">取消</div></div></div>';
        }
        var objAction = $(_html).appendTo($(document.body));

        for(var i=0;i<opts.actions.length;i++){
            var classN = opts.actions[i].className ? opts.actions[i].className : '';
            var _cellhtml = '<div class="jinui_actionsheet_cell '+ classN +'">'+ opts.actions[i].text +'</div>';
            var fn = opts.actions[i].handle;

            (function(fn){
                $(_cellhtml).appendTo(objAction.find('.jinui_actionsheet_menu')).bind('click', function(event) {
                    fn.call(this);
                    close();
                });
            })(fn)
            
        }

        

        objAction.find('.jinui_actionsheet_content').addClass('jinui_animation_open');
        objAction.find('.jinui_mask').addClass('jinui_mask_visible').bind('click', function(event) {
            close();
        });

        objAction.find('.jinui_actionsheet_cancel').bind('click', function(event) {
            close();
        });

        var close  = function(){
            $('.jinui_actionsheet').find('.jinui_mask').removeClass('jinui_mask_visible')
            $('.jinui_actionsheet').find('.jinui_actionsheet_content').removeClass('jinui_animation_open').addClass('jinui_animation_close');

            setTimeout(function(){
                $('.jinui_actionsheet').remove();
            },300)
        }

    }

}($);