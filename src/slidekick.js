/* ==========================================================
 * slidekick.js v0.1.0
 * ==========================================================
 * Copyright 2013 Cengage Learning
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */

(function (root, document, $) {
	'use strict';

	var prefix = 'slidekick-';
	var push = [].push;
	var styles = document.createElement('div').style;
	var cssPrefixes = ['-webkit-', '-moz-', '-o-', '-ms-', ''];
	var LEFT = -1,
		CENTER = 0,
		RIGHT = 1;

	var Slidekick = $.fn.slidekick = function (options) {
		if (!this || this.constructor !== Slidekick) {
			return new Slidekick(options, this);
		}

		init(this, options, arguments[arguments.length - 1]);
	};

	var View = Slidekick.View = function ($el, data) {
		this.$el = $el;
		this.data = data;
	};

	$.extend(Slidekick.prototype, {
		add: function ($el, data) {
			if (typeof $el === 'number') {
				var views = createViews($el);
				push.apply(this.views, views);
				return views;
			}
			var view = new View($el, data);
			this.views.push(view);
			return view;
		},

		size: function () {
			return this.views.length;
		},

		get: function (index) {
			return this.views[index];
		},

		remove: function (index) {
			this.views.splice(index, 1);
			return this;
		},

		stop: function () {
			this.running = false;
			this.$slider.stop();
		},

		to: function (index) {
			this._toBuffer(index);

			return this;
		},

		_toBuffer: function (index) {
			if (index === this.selected) {
				return this;
			}
			return this.buffer(this, index);
		},

		at: function () {
			return this.selected;
		},

		prev: function () {
			if (this.at() !== 0) {
				this.options.pageNavigator.prev();
				return;
			}

			if (this.options.loop) {
				this.options.pageNavigator.to(this.size() - 1);
			}
		},

		next: function () {
			if (this.at() !== this.size() - 1) {
				this.options.pageNavigator.next();
				return;
			}

			if (this.options.loop) {
				this.options.pageNavigator.to(0);
			}
		},

		on: function (event, callback) {
			this.$container.on(prefix + event, callback);
			return this;
		},

		activeBuffer: function () {
			if (this.options.transitions) {
				return this.$buffers[1];
			}

			return this.$buffers[0];
		},

		down: function (event) {
			var point = event.originalEvent.touches ? event.originalEvent.touches[0] : event.originalEvent;
			this.$slider.startX = point.pageX;
			this.$slider.startY = point.pageY;

			this.initiated = true;
			this.directionLocked = false;

			this.currentXPosition = point.pageX;
			this.currentYPosition = point.pageY;
			this.horizontalSteps = 0;
			this.verticalSteps = 0;

			setupSlideAnimation(this, 0);
		},

		move: function (event) {
			if (!this.initiated) {
				return;
			}

			var point = event.originalEvent.touches ? event.originalEvent.touches[0] : event.originalEvent,
				delta = point.pageX - this.$slider.startX;

			this.horizontalSteps += Math.abs(point.pageX - this.currentXPosition);
			this.verticalSteps += Math.abs(point.pageY - this.currentYPosition);

			this.currentXPosition = point.pageX;
			this.currentYPosition = point.pageY;

			if (this.horizontalSteps < 10 && this.verticalSteps < 10) {
				return;
			}

			if (!this.directionLocked && this.verticalSteps > this.horizontalSteps) {
				return;
			}

			this.directionLocked = true;
			preventVerticalScrolling(event);

			slideHorizontal(this, this.$slider.x + delta);
		},

		up: function (event) {
			if (!this.initiated) {
				return;
			}

			this.initiated = false;

			cleanUpSlideAnimation(this);

			var point = event.originalEvent.changedTouches ? event.originalEvent.changedTouches[0] : event.originalEvent,
				deltaX = point.pageX - this.$slider.startX,
				absoluteDeltaX = Math.abs(deltaX),
				absoluteDeltaY = Math.abs(point.pageY - this.$slider.startY),
				startingSliderPosition = this.$slider.x;

			if (absoluteDeltaY - absoluteDeltaX < 0 && absoluteDeltaX >= this.options.swipe.toleranceX) {
				changePage(this, deltaX);
			}

			resetSliderWhenNoPageChange(this, startingSliderPosition);
		},

		updateOrientation: function (event) {
			adjustBuffers(this);
		},

		setSideBuffersVisible: function (isVisible) {
			setSideBuffersVisible(this, isVisible);
		}
	});

	function init(slidekick, options, $container) {
		slidekick.$container = $container;
		slidekick.$container.css({
			'overflow': 'hidden',
			'position': 'relative'
		});

		slidekick.$container.on('scroll', function (event) {
			$(this).scrollLeft(0);
		});

		slidekick.selected = undefined;
		slidekick.views = [];
		slidekick.options = $.extend({
			loop: true,
			duration: '800',
			transitions: true,
			skipScroll: false,
			forcejQuery: false,
			buffer: {
				classes: ''
			},
			swipe: {
				enabled: false,
				toleranceX: 100
			},
			autoChangeVisibility: true
		}, options);

		if ((!Slidekick.transform || !Slidekick.transitionDuration) && !Slidekick.usejQuerySlide()) {
			slidekick.options.transitions = false;
		}

		setupProxies(slidekick);
		setupBuffers(slidekick);

		updateVisibilityForKeyboard(slidekick, false);
	}

	function setupSlideAnimation(slidekick, duration) {
		slidekick.running = true;
		adjustBuffers(slidekick);
		toggleScrollBars(slidekick, 'hidden');
		if (duration !== undefined) {
			slidekick.$slider.css(Slidekick.transitionDuration, duration + 'ms');
		}
	}

	function cleanUpSlideAnimation(slidekick) {
		slidekick.running = false;
		toggleScrollBars(slidekick, 'auto');
		slidekick.$slider.css(Slidekick.transitionDuration, '0ms');
	}

	function slideHorizontal(slidekick, x) {
		slidekick.$slider.css(Slidekick.transform, 'translate(' + x + 'px, 0) translateZ(0)');
	}

	function preventVerticalScrolling(event) {
		event.preventDefault();
	}

	function resetSliderWhenNoPageChange(slidekick, startingSliderPosition) {
		if (startingSliderPosition === slidekick.$slider.x) {
			slideHorizontal(slidekick, startingSliderPosition);
		}
	}

	function changePage(slidekick, deltaX) {
		if (sign(deltaX) === RIGHT) {
			slidekick.prev();
		} else {
			slidekick.next();
		}
	}

	function setupProxies(slidekick) {
		slidekick.proxy = {
			down: $.proxy(slidekick.down, slidekick),
			move: $.proxy(slidekick.move, slidekick),
			up: $.proxy(slidekick.up, slidekick)
		};
	}

	function createViews(count) {
		var views = [];

		for (var i = 0; i < count; i++) {
			views.push(new Slidekick.View());
		}

		return views;
	}

	function createSlider(slidekick) {
		slidekick.$slider = $('<div></div>').css({
			position: 'relative',
			top: '0',
			height: '100%',
			width: '100%'
		});

		if (Slidekick.transitionTimingFunction) {
			slidekick.$slider.css(Slidekick.transitionTimingFunction, 'ease-out');
		}

		slidekick.$container.append(slidekick.$slider);
		slidekick.$slider.x = 0;

		if (slidekick.options.swipe.enabled) {
			slidekick.$slider.on(Slidekick.events.down, slidekick.proxy.down);
			slidekick.$slider.on(Slidekick.events.move, slidekick.proxy.move);
			slidekick.$slider.on(Slidekick.events.up, slidekick.proxy.up);
		}

		return slidekick.$slider;
	}

	function appendBuffer(slidekick, appendTo) {
		var $buffer = $('<div></div>').addClass(slidekick.options.buffer.classes);
		appendTo.append($buffer);
		slidekick.$buffers.push($buffer);
		return $buffer;
	}

	function setupTripleBuffer(slidekick) {
		var slider = createSlider(slidekick);

		for (var i = 0; i < 3; i++) {
			appendBuffer(slidekick, slider);
		}

		adjustBuffers(slidekick);

		slidekick.buffer = tripleBuffer;
	}

	function setupSingleBuffer(slidekick) {
		appendBuffer(slidekick, slidekick.$container);

		slidekick.buffer = singleBuffer;
	}

	function setupBuffers(slidekick) {
		slidekick.$buffers = [];

		if (slidekick.options.transitions) {
			setupTripleBuffer(slidekick);
			return;
		}

		setupSingleBuffer(slidekick);
	}

	function loadBuffer(slidekick, $buffer, index) {
		if ($buffer.index === index) {
			return;
		}

		if (index !== undefined) {
			var view = slidekick.get(index);
			slidekick.$container.trigger(prefix + 'buffer', [view, index]);
			if (view.$el) {
				$buffer.index = index;
				$buffer.html(view.$el);
				return;
			}
		}

		$buffer.index = undefined;
		$buffer.empty();
	}

	function loadBuffers(slidekick, index) {
		for (var i = -1; i < 2; i++) {
			loadBuffer(slidekick, slidekick.$buffers[i + 1], relativeIndex(slidekick, index, i));
		}
	}

	function updateSelected(slidekick, index, visibleBuffer) {
		slidekick.$container.trigger(prefix + 'hide', [slidekick.get(slidekick.selected), slidekick.selected]);
		slidekick.selected = index;
		slidekick.$container.trigger(prefix + 'show', [slidekick.get(index), index]);
		slidekick.$container.trigger(prefix + 'animationend', [slidekick.get(index), index]);
	}

	function singleBuffer(slidekick, index) {
		loadBuffer(slidekick, slidekick.$buffers[0], index);
		updateSelected(slidekick, index, 0);
	}

	function toggleScrollBars(slidekick, value) {
		if (slidekick.options.skipScroll) {
			return;
		}

		for (var i = 0; i < slidekick.$buffers.length && slidekick.options.transitions; i++) {
			slidekick.$buffers[i].css('overflow', value);
		}
	}

	function slide(slidekick, index) {
		setupSlideAnimation(slidekick, slidekick.options.duration);
		slideHorizontal(slidekick, slidekick.$slider.x);
		setTimeout(function () {
			cleanUpSlideAnimation(slidekick);
			updateSelected(slidekick, index, 1);
			updateVisibilityForKeyboard(slidekick, false);
		}, slidekick.options.duration);
	}

	function jQuerySlide(slidekick, index) {
		slidekick.running = true;
		adjustBuffers(slidekick);
		toggleScrollBars(slidekick, 'hidden');
		slidekick.$slider.animate({
			left: slidekick.$slider.x
		}, slidekick.options.duration, function () {
			slidekick.running = false;
			toggleScrollBars(slidekick, 'auto');
			updateSelected(slidekick, index, 1);
			updateVisibilityForKeyboard(slidekick, false);
		});

	}

	function sign(number) {
		return number < 0 ? -1 : 1;
	}

	function adjustBuffer(slidekick, direction) {
		var x = slidekick.$slider.x,
			amount = (-1 * sign(x) * Math.abs(x / slidekick.$container.width()) + direction) * 100;

		slidekick.$buffers[direction + 1].css('left', amount + '%');
	}

	function adjustBuffers(slidekick) {
		for (var i = -1; i < 2; i++) {
			adjustBuffer(slidekick, i);
		}
	}

	function relativeIndexLeft(slidekick, index) {
		if (index > 0) {
			return index - 1;
		}

		return slidekick.options.loop ? slidekick.size() - 1 : undefined;
	}

	function relativeIndexRight(slidekick, index) {
		if (index < slidekick.size() - 1) {
			return index + 1;
		}

		return slidekick.options.loop ? 0 : undefined;
	}

	function relativeIndex(slidekick, index, direction) {
		if (direction === LEFT) {
			return relativeIndexLeft(slidekick, index);
		}

		if (direction === RIGHT) {
			return relativeIndexRight(slidekick, index);
		}

		return index;
	}

	function performSlide(slidekick, index) {
		if (Slidekick.usejQuerySlide() || slidekick.options.forcejQuery) {
			return jQuerySlide(slidekick, index);
		}

		return slide(slidekick, index);
	}

	function setBufferDisplay(slidekick, displays) {
		if (!slidekick.options.swipe.enabled && slidekick.options.transitions) {
			for (var index = 0; index < displays.length; index++) {
				slidekick.$buffers[index].css('display', displays[index]);
			}
		}
	}

	function updateVisibilityForKeyboard(slidekick, isBeforeSlide) {
		if (slidekick.options.autoChangeVisibility) {
			setSideBuffersVisible(slidekick, isBeforeSlide);
		}
	}

	function setSideBuffersVisible(slidekick, isVisible) {
		if (isVisible === true) {
			setBufferDisplay(slidekick, ['block', 'block', 'block']);
		} else {
			setBufferDisplay(slidekick, ['none', 'block', 'none']);
		}
	}

	function shiftBuffers(slidekick, index) {
		var distance = slidekick.$container.width(),
			isLeftShift = index - slidekick.selected === 1 || (slidekick.options.loop && index === 0 && slidekick.selected === slidekick.size() - 1);

		updateVisibilityForKeyboard(slidekick, true);

		if (isLeftShift) {
			slidekick.$slider.x -= distance;
			slidekick.$buffers.push(slidekick.$buffers.shift());
			return;
		}

		slidekick.$slider.x += distance;
		slidekick.$buffers.unshift(slidekick.$buffers.pop());
	}

	function shiftSlider(slidekick, index) {
		shiftBuffers(slidekick, index);

		loadBuffers(slidekick, index);

		return performSlide(slidekick, index);
	}

	function repositionBuffers(slidekick, index) {
		loadBuffers(slidekick, index);
		slidekick.running = false;
		updateSelected(slidekick, index, 1);
	}

	function tripleBuffer(slidekick, index) {
		if (slidekick.running) {
			return;
		}

		if (slidekick.selected !== undefined && shouldUseShift(slidekick, index)) {
			return shiftSlider(slidekick, index);
		}

		repositionBuffers(slidekick, index);
	}

	function shouldUseShift(slidekick, index) {
		return (Math.abs(index - slidekick.selected) === 1 || (Math.abs(index - slidekick.selected) === slidekick.size() - 1 && slidekick.options.loop));
	}

	function findEvent() {
		for (var i = 0; i < arguments.length; i++) {
			if ('on' + arguments[i] in window) {
				return arguments[i];
			}
		}
	}

	function findStyle() {
		var suffix;
		for (var i = 0; i < arguments.length; i++) {
			suffix = arguments[i];
			for (var j = 0; j < cssPrefixes.length; j++) {
				var candidate = cssEscape(cssPrefixes[j] + suffix);
				if (candidate in styles) {
					return candidate;
				}
			}
		}
		return false;
	}

	function fireFox19Plus() {
		return (/Firefox[\/\s](19|[2-9][0-9])/).test(root.navigator.userAgent);
	}

	function safari5() {
		return (/(Version\/5)+.*(Safari)+/g).test(root.navigator.userAgent);
	}

	function ie9() {
		return (/(MSIE 9\.0;)/).test(root.navigator.userAgent);
	}

	function chrome26Plus() {
		return (/Chrome[\/\s]([2-9][6-9])/).test(root.navigator.userAgent);
	}

	function cssEscape(style) {
		return style.replace(/-(\w)/g, function _replace(p1, p2) {
			return p2.toUpperCase();
		});
	}

	Slidekick.events = {
		down: findEvent('touchstart', 'mousedown'),
		move: findEvent('touchmove', 'mousemove'),
		up: findEvent('touchend', 'mouseup')
	};

	Slidekick.transform = findStyle('transform');
	Slidekick.transitionDuration = findStyle('transition-duration');
	Slidekick.transitionTimingFunction = findStyle('transition-timing-function');
	Slidekick.ie9 = ie9();
	Slidekick.safari5 = safari5();
	Slidekick.fireFox19Plus = fireFox19Plus();
	Slidekick.chrome26Plus = chrome26Plus();
	Slidekick.usejQuerySlide = function () {
		return this.ie9 || this.safari5 || this.fireFox19Plus || this.chrome26Plus;
	};

})(this, this.document, this.jQuery);