describe('slidekick', function () {
	'use strict';

	var called, $container;

	beforeEach(function () {
		called = false;
		$container = $('<div></div>').css({
			'left': '0px',
			'top': '0px',
			'height': '500px',
			'width': '500px'
		});
	});

	describe('construction', function () {
		it('should be defined on the $.fn namespace', function () {
			expect($.fn.slidekick).toBeDefined();
		});

		it('should return an instance of itself', function () {
			expect($container.slidekick().constructor).toBe($.fn.slidekick);
		});

		it('should maintain a reference to its jQuery wrapped container element', function () {
			expect($container.slidekick().$container).toBe($container);
		});

		it('should support an options property that\'s accessible on the slidekick', function () {
			expect($container.slidekick().options).toBeDefined();
		});

		it('should support the passing of options through the constructor', function () {
			expect($container.slidekick({
				option: true
			}).options.option).toBe(true);
		});

		it('should determine transform style', function () {
			expect($.fn.slidekick.transform).toBeDefined();
		});

		it('should determine transition-duration style', function () {
			expect($.fn.slidekick.transitionDuration).toBeDefined();
		});

		it('should set transition to false when there is no transform support', function () {
			var old = $.fn.slidekick.transform;
			$.fn.slidekick.transform = undefined;
			spyOn($.fn.slidekick, 'usejQuerySlide').andReturn(false);

			expect($container.slidekick({
				transitions: true
			}).options.transitions).toBe(false);

			$.fn.slidekick.transform = old;
		});


		it('should set transition to true for IE9', function () {
			var old = $.fn.slidekick.transform;
			$.fn.slidekick.transform = undefined;

			var old_ie9 = $.fn.slidekick.ie9;
			$.fn.slidekick.ie9 = true;

			expect($container.slidekick({
				transitions: true
			}).options.transitions).toBe(true);

			$.fn.slidekick.ie9 = old_ie9;

			$.fn.slidekick.transform = old;
		});

		it('should set transition to true for Safari 5', function () {
			var old = $.fn.slidekick.transform;
			$.fn.slidekick.transform = undefined;

			var old_safari5 = $.fn.slidekick.safari5Plus;
			$.fn.slidekick.safari5Plus = true;

			expect($container.slidekick({
				transitions: true
			}).options.transitions).toBe(true);

			$.fn.slidekick.safari5Plus = old_safari5;

			$.fn.slidekick.transform = old;
		});

		it('should use transitions and jqueryslide for Firefox 19+', function () {
			var oldTransform = $.fn.slidekick.transform;
			$.fn.slidekick.transform = undefined;

			var old_fireFox19Plus = $.fn.slidekick.fireFox19Plus;
			$.fn.slidekick.fireFox19Plus = true;

			expect($container.slidekick({
				transitions: true
			}).options.transitions).toBe(true);
			expect($.fn.slidekick.usejQuerySlide()).toBe(true);

			$.fn.slidekick.fireFox19Plus = old_fireFox19Plus;
			$.fn.slidekick.transform = oldTransform;
		});

		it('should use transitions and jqueryslide for Chrome 26+', function () {
			var oldTransform = $.fn.slidekick.transform;
			$.fn.slidekick.transform = undefined;

			var old_chrome26Plus = $.fn.slidekick.chrome26Plus;
			$.fn.slidekick.chrome26Plus = true;

			expect($container.slidekick({
				transitions: true
			}).options.transitions).toBe(true);
			expect($.fn.slidekick.usejQuerySlide()).toBe(true);

			$.fn.slidekick.chrome26Plus = old_chrome26Plus;
			$.fn.slidekick.transform = oldTransform;
		});

		it('should set the containers overflow to hidden', function () {
			expect($container.slidekick().$container.css('overflow')).toBe('hidden');
		});

		it('should set the containers position to relative', function () {
			expect($container.slidekick().$container.css('position')).toBe('relative');
		});

		it('should apply any buffer classes from options', function () {
			var slidekick = $container.slidekick({
				buffer: {
					classes: 'myClass myOtherClass'
				}
			});

			for (var i = 0; i < slidekick.$buffers.length; i++) {
				expect(slidekick.$buffers[i].hasClass('myClass')).toBe(true);
				expect(slidekick.$buffers[i].hasClass('myOtherClass')).toBe(true);
			}
		});

		it('should call scrollLeft(0) when container scrolls (this is a hack for WebKit based browsers)', function () {
			$.fn.scrollLeft = jasmine.createSpy();
			$container.slidekick().$container.scroll();

			expect($.fn.scrollLeft).toHaveBeenCalledWith(0);
		});

		it("uses jQuery for animation if forcejQuery option is true", function () {
			spyOn($.fn, "animate");

			var mockView = {
				$el: $("<div></div>")
			};

			var slidekick = $container.slidekick({
				forcejQuery: true,
				transitions: true,
				pageNavigator: {
					next: function () {
						slidekick.to(slidekick.at() + 1);
					}
				}
			});
			slidekick.add(50);
			slidekick.to(0);
			spyOn(slidekick, "get").andReturn(mockView);

			slidekick.next();

			expect($.fn.animate).toHaveBeenCalledWith({
				left: slidekick.$slider.x
			}, slidekick.options.duration, jasmine.any(Function));
		});
	});

	describe('accessibility', function () {
		beforeEach(function () {
			jasmine.Clock.useMock();
		});

		function buildThreeBuffers(slidekick) {
			slidekick.add(3);
			slidekick.to(0);
			slidekick.$buffers[0].css('display', 'inline');
			slidekick.$buffers[1].css('display', 'block');
			slidekick.$buffers[2].css('display', 'inline');
		}

		it('should update buffers to display all three before sliding, when autoChangeVisibility is turned on', function () {
			var slidekick = $container.slidekick({
				transitions: true,
				duration: 20,
				pageNavigator: {
					next: function () {
						slidekick.to(slidekick.at() + 1);
					}
				},
				autoChangeVisibility: true
			});
			buildThreeBuffers(slidekick);

			slidekick.next();

			expect(slidekick.$buffers[0].css('display')).toBe('block');
			expect(slidekick.$buffers[1].css('display')).toBe('block');
			expect(slidekick.$buffers[2].css('display')).toBe('block');
		});

		it('should update buffers to only display middle view, when triple buffered, when autoChangeVisibility is turned on', function () {
			var slidekick = $container.slidekick({
				transitions: true,
				duration: 0,
				pageNavigator: {
					next: function () {
						slidekick.to(slidekick.at() + 1);
					}
				},
				autoChangeVisibility: true
			});
			buildThreeBuffers(slidekick);

			slidekick.next();

			jasmine.Clock.tick(1);
			expect(slidekick.$buffers[0].css('display')).toBe('none');
			expect(slidekick.$buffers[1].css('display')).toBe('block');
			expect(slidekick.$buffers[2].css('display')).toBe('none');
		});

		it('should not update buffers visibility if autoChangeVisibility is turned off', function () {
			var slidekick = $container.slidekick({
				transitions: true,
				duration: 0,
				pageNavigator: {
					next: function () {
						slidekick.to(slidekick.at() + 1);
					}
				},
				autoChangeVisibility: false
			});
			buildThreeBuffers(slidekick);
			slidekick.$buffers[2].css('display', 'inline-block');

			slidekick.next();

			expect(slidekick.$buffers[0].css('display')).toBe('block');
			expect(slidekick.$buffers[1].css('display')).toBe('inline-block');

			jasmine.Clock.tick(1);
			expect(slidekick.$buffers[0].css('display')).toBe('block');
			expect(slidekick.$buffers[1].css('display')).toBe('inline-block');
		});

		describe('setSideBuffersVisible', function () {

			it('makes all three buffers visible when passing true', function () {
				var slidekick = $container.slidekick();
				buildThreeBuffers(slidekick);

				slidekick.setSideBuffersVisible(true);

				expect(slidekick.$buffers[0].css('display')).toBe('block');
				expect(slidekick.$buffers[1].css('display')).toBe('block');
				expect(slidekick.$buffers[2].css('display')).toBe('block');
			});

			it('sets the buffer display to none/block/none when passing false', function () {
				var slidekick = $container.slidekick();
				buildThreeBuffers(slidekick);

				slidekick.setSideBuffersVisible(false);

				expect(slidekick.$buffers[0].css('display')).toBe('none');
				expect(slidekick.$buffers[1].css('display')).toBe('block');
				expect(slidekick.$buffers[2].css('display')).toBe('none');
			});
		});
	});

	describe('swiping on mobile', function () {
		var slidekick;

		beforeEach(function () {
			slidekick = $container.slidekick({
				swipe: {
					enabled: true,
					toleranceX: 100
				}
			});

		});

		describe('when hiding the scroll bars is enabled', function () {

			beforeEach(function () {
				slidekick = $container.slidekick({
					swipe: {
						enabled: true,
						toleranceX: 100
					},
					skipScroll: false
				});
				spyOn($.fn, 'css');
			});

			it("should hide the scroll bars on touch down", function () {
				var event = {
					originalEvent: {
						touches: [{
							pageX: 100,
							pageY: 101
						}]
					}
				};
				slidekick.down(event);

				expect($.fn.css).toHaveBeenCalledWith('overflow', 'hidden');
			});
		});

		describe('when hiding the scroll bars is not enabled', function () {

			beforeEach(function () {
				slidekick = $container.slidekick({
					swipe: {
						enabled: true,
						toleranceX: 100
					},
					skipScroll: true
				});
				spyOn($.fn, 'css');
			});

			it("should not hide the scroll bars on touch down", function () {
				var event = {
					originalEvent: {
						touches: [{
							pageX: 100,
							pageY: 101
						}]
					}
				};
				slidekick.down(event);

				expect($.fn.css).not.toHaveBeenCalledWith('overflow', 'hidden');
			});
		});

		describe('touch down event', function () {

			beforeEach(function () {
				var event = {
					originalEvent: {
						touches: [{
							pageX: 100,
							pageY: 101
						}]
					}
				};
				spyOn($.fn, 'css');
				slidekick.down(event);
			});

			it('it should set its startX', function () {
				expect(slidekick.$slider.startX).toBe(100);
			});

			it('it should set its startY', function () {
				expect(slidekick.$slider.startY).toBe(101);
			});

			it('should make the slidekick be running', function () {
				expect(slidekick.running).toBe(true);
			});

			it('adjusts the buffers', function () {
				expect($.fn.css).toHaveBeenCalledWith('left', '-100%');
				expect($.fn.css).toHaveBeenCalledWith('left', '0%');
				expect($.fn.css).toHaveBeenCalledWith('left', '100%');
			});
		});

		describe('touch move event', function () {
			var event;

			beforeEach(function () {
				event = {
					originalEvent: {
						touches: [{
							pageX: 100,
							pageY: 101
						}]
					},
					preventDefault: function () {}
				};
				spyOn(slidekick.$slider, 'css');
				slidekick.initiated = true;
			});

			it('should not set translation when not initiated', function () {
				slidekick.initiated = false;
				slidekick.move(event);

				expect(slidekick.$slider.css).not.toHaveBeenCalled();
			});

			it('should not set translation when have not moved enough steps', function () {
				slidekick.currentXPosition = 101;
				slidekick.currentYPosition = 102;
				slidekick.horizontalSteps = 0;
				slidekick.verticalSteps = 0;

				slidekick.move(event);

				expect(slidekick.$slider.css).not.toHaveBeenCalled();
			});

			it('should not set initiated to false when have not moved enough steps', function () {
				slidekick.currentXPosition = 101;
				slidekick.currentYPosition = 102;
				slidekick.horizontalSteps = 0;
				slidekick.verticalSteps = 0;

				slidekick.move(event);

				expect(slidekick.initiated).toBe(true);
			});

			it('should not set translation when has moved more vertically than horizontally', function () {
				slidekick.currentXPosition = 101;
				slidekick.currentYPosition = 202;
				slidekick.horizontalSteps = 0;
				slidekick.verticalSteps = 0;

				slidekick.move(event);

				expect(slidekick.$slider.css).not.toHaveBeenCalled();
			});

			it('should set translation to delta', function () {
				slidekick.currentXPosition = 201;
				slidekick.currentYPosition = 102;
				slidekick.horizontalSteps = 0;
				slidekick.verticalSteps = 0;

				slidekick.move(event);

				expect(slidekick.$slider.css).toHaveBeenCalled();
			});
		});

		describe('touch up event', function () {
			var event;

			beforeEach(function () {
				event = {
					originalEvent: {
						changedTouches: [{
							pageX: 1000,
							pageY: 1000
						}]
					}
				};
				spyOn(slidekick.$slider, 'css');
				spyOn(slidekick, 'prev');
				spyOn(slidekick, 'next');
				slidekick.initiated = true;
			});

			it('should not change page when not initiated', function () {
				slidekick.initiated = false;
				slidekick.up(event);

				expect(slidekick.prev).not.toHaveBeenCalled();
				expect(slidekick.next).not.toHaveBeenCalled();
			});

			it('should not change page when move more vertical than horizontal', function () {
				slidekick.$slider.startX = 800;
				slidekick.$slider.startY = 500;
				slidekick.up(event);

				expect(slidekick.prev).not.toHaveBeenCalled();
				expect(slidekick.next).not.toHaveBeenCalled();
			});

			it('should not change page when move less than tolerance', function () {
				slidekick.$slider.startX = 910;
				slidekick.$slider.startY = 990;
				slidekick.up(event);

				expect(slidekick.prev).not.toHaveBeenCalled();
				expect(slidekick.next).not.toHaveBeenCalled();
			});

			it('should go to next page when slide right to left', function () {
				slidekick.$slider.startX = 1200;
				slidekick.$slider.startY = 990;
				slidekick.up(event);

				expect(slidekick.prev).not.toHaveBeenCalled();
				expect(slidekick.next).toHaveBeenCalled();
			});

			it('should go to prev page when slide left to right', function () {
				slidekick.$slider.startX = 800;
				slidekick.$slider.startY = 990;
				slidekick.up(event);

				expect(slidekick.prev).toHaveBeenCalled();
				expect(slidekick.next).not.toHaveBeenCalled();
			});

			it('should reset translation when page was not changed', function () {
				slidekick.$slider.startX = 910;
				slidekick.$slider.startY = 990;
				slidekick.up(event);

				expect(slidekick.$slider.css).toHaveBeenCalled();
			});

			it('should not reset the translation when page has changed', function () {
				slidekick.$slider.startX = 800;
				slidekick.$slider.startY = 990;

				slidekick.prev.andCallFake(function () {
					slidekick.$slider.x = 1;
				});

				slidekick.up(event);

				expect(slidekick.prev).toHaveBeenCalled();
				expect(slidekick.$slider.css).not.toHaveBeenCalledWith(slidekick.transform, jasmine.any(String));
			});
		});
	});

	describe('manipulation', function () {

		var slidekick;

		beforeEach(function () {
			var pageNavigatorMock = {
				prev: function () {
					slidekick.to(slidekick.at() - 1);
				},
				next: function () {
					slidekick.to(slidekick.at() + 1);
				},
				to: function (page) {
					slidekick.to(page);
				}
			};
			slidekick = $container.slidekick({
				transitions: false,
				pageNavigator: pageNavigatorMock
			});
		});

		function createViews(count) {
			for (var i = 0; i < count; i++) {
				slidekick.add($('<span>' + i + '</span>'), i);
			}
		}

		it('should be able to return the active buffer for a single buffer slidekick', function () {
			expect(slidekick.activeBuffer()).toBe(slidekick.$buffers[0]);
		});

		it('should support an "on" method that delegates to the containers "on" method with a slidekick specific prefix', function () {
			$container.on = jasmine.createSpy();
			var callback = function () {};

			slidekick.on('event', callback);

			expect($container.on).toHaveBeenCalledWith('slidekick-event', callback);
		});

		it('should return the slidekick when calling "on"', function () {
			expect(slidekick.on('event', function () {})).toBe(slidekick);
		});

		describe('view', function () {

			it('should support an "add" method that will return a newly added slidekick.View', function () {
				var view = slidekick.add();

				expect(view.constructor).toBe($.fn.slidekick.View);
			});

			it('should support a number as an argument to "add" if multiple empty pages are desired and it will return an array of them', function () {
				var views = slidekick.add(5);

				expect(views.length).toBe(5);
				expect(slidekick.size()).toBe(5);
				expect(views[0].constructor).toBe($.fn.slidekick.View);
			});

			it('should accept an el and data parameter and set those on the view', function () {
				var $el = $('<span></span>');
				var view = slidekick.add($el, 'test');

				expect(view.$el).toBe($el);
				expect(view.data).toBe('test');
			});

			describe('manipulation', function () {

				it('should support a "size" method which returns the number of views that are currently managed', function () {
					createViews(3);

					expect(slidekick.size()).toBe(3);
				});

				it('should support a "get" method that will return previously created views', function () {
					createViews(2);

					expect(slidekick.get(0).data).toBe(0);
					expect(slidekick.get(1).data).toBe(1);
				});

				it('should support a "remove" method that will remove a view at a given location', function () {
					createViews(10);

					slidekick.remove(4);

					expect(slidekick.size()).toBe(9);
					expect(slidekick.get(9)).not.toBeDefined();
				});

				it('should return a reference to the slidekick from "remove" method calls for function chaining', function () {
					createViews(1);

					expect(slidekick.remove(0)).toBe(slidekick);
				});

				it('should support a "to" method capable of setting the current view and an "at" that returns the currently selected view index', function () {
					createViews(2);

					slidekick.to(1);

					expect(slidekick.at()).toBe(1);
				});

				it('should return the slidekick when "to" is called', function () {
					createViews(2);

					expect(slidekick.to(1)).toBe(slidekick);
				});

				it('should render the current view in a buffer div inside of the slidekick container', function () {
					createViews(1);

					slidekick.to(0);

					expect(slidekick.$container.html()).toBe(slidekick.$buffers[0].parent().html());
					expect(slidekick.$buffers[0].html()).toBe(slidekick.get(0).$el.parent().html());
				});

				it('should empty the buffer if you attempt to switch to a view that has no $el', function () {
					createViews(2);
					slidekick.$buffers[0].html('junk');
					slidekick.get(1).$el = undefined;

					slidekick.to(1);

					expect(slidekick.$buffers[0].html()).toBe('');
				});
			});
		});

		describe('pagination', function () {

			beforeEach(function () {
				createViews(3);
				slidekick.to(1);
			});

			it('should support a "next" method that transitions to current + 1', function () {
				slidekick.next();

				expect(slidekick.at()).toBe(2);
				expect(slidekick.get(slidekick.at()).data).toBe(2);
			});

			it('should be able to wrap around to the beginning if "next" is called when at max index', function () {
				slidekick.to(2);

				slidekick.next();

				expect(slidekick.at()).toBe(0);
				expect(slidekick.get(slidekick.at()).data).toBe(0);
			});

			it('should support a "prev" method that transitions to current - 1', function () {
				slidekick.prev();

				expect(slidekick.at()).toBe(0);
				expect(slidekick.get(slidekick.at()).data).toBe(0);
			});

			it('should be able to wrap around to the beginning if "next" is called when at max index', function () {
				slidekick.to(0);

				slidekick.prev();

				expect(slidekick.at()).toBe(2);
				expect(slidekick.get(slidekick.at()).data).toBe(2);
			});

			describe('options', function () {

				it('should provide a "loop" option that\'s defaulted to true', function () {
					expect(slidekick.options.loop).toBe(true);
				});

				it('should provide a "transitions" option that\'s defaulted to true', function () {
					expect($container.slidekick().options.transitions).toBe(true);
				});

				describe('looping', function () {

					beforeEach(function () {
						slidekick.options.loop = false;
					});

					it('should not loop from the end to the beginning when "loop" is set to false', function () {
						slidekick.to(2);

						slidekick.next();

						expect(slidekick.at()).toBe(2);
					});

					it('should not loop from the beginning to the end when "loop" is set to false', function () {
						slidekick.to(0);

						slidekick.prev();

						expect(slidekick.at()).toBe(0);
					});

				});

				describe('{transitions:true}', function () {


					beforeEach(function () {
						spyOn($.fn, 'css').andCallThrough();
						spyOn($.fn, 'append').andCallThrough();

						slidekick = $container.empty().slidekick({
							transitions: true
						});

						createViews(3);

						slidekick.to(0);
					});

					it('should be able to return the active buffer for a triple buffer slidekick', function () {
						expect(slidekick.activeBuffer()).toBe(slidekick.$buffers[1]);
					});

					it('should define a $slider element and attach that to the slidekick', function () {
						expect(slidekick.$slider.is('div')).toBe(true);
					});

					it('should append the $slider to the $container', function () {
						expect($.fn.append).toHaveBeenCalledWith(slidekick.$slider);
						var calls = $.fn.append.calls;
						for (var i = 0; i < calls.length; i++) {
							if (calls[i].object === slidekick.$container) {
								called = true;
							}
						}
						expect(called).toBe(true);
					});

					it('should put three buffers inside the slider', function () {
						for (var i = 0; i < 3; i++) {
							slidekick.$buffers[i].addClass('buffer');
						}
						expect(slidekick.$slider.children('.buffer').size()).toBe(3);
					});

					it('should utilize the second buffer for the current view', function () {
						expect(slidekick.$buffers[1].html()).toBe('<span>0</span>');
					});

					it('should load the previous and next view into the other buffers', function () {
						expect(slidekick.$buffers[0].html()).toBe('<span>2</span>');
						expect(slidekick.$buffers[2].html()).toBe('<span>1</span>');
					});

					it('should wrap around when looping is enabled and we are at the max view', function () {
						slidekick.to(2);

						expect(slidekick.$buffers[0].html()).toBe('<span>1</span>');
						expect(slidekick.$buffers[1].html()).toBe('<span>2</span>');
						expect(slidekick.$buffers[2].html()).toBe('<span>0</span>');
					});

					it('should leave left end blank if looping is disabled', function () {
						slidekick = $container.slidekick({
							loop: false,
							transitions: true
						});
						createViews(3);

						slidekick.to(0);

						expect(slidekick.$buffers[0].html()).toBe('');
						expect(slidekick.$buffers[1].html()).toBe('<span>0</span>');
						expect(slidekick.$buffers[2].html()).toBe('<span>1</span>');
					});

					it('should leave right end blank if looping is disabled', function () {
						slidekick = $container.slidekick({
							loop: false,
							transitions: true
						});
						createViews(3);

						slidekick.to(2);

						expect(slidekick.$buffers[0].html()).toBe('<span>1</span>');
						expect(slidekick.$buffers[1].html()).toBe('<span>2</span>');
						expect(slidekick.$buffers[2].html()).toBe('');
					});

					it('should set the "left" style on all three buffers to -100%, 0 and 100% respectively', function () {
						for (var i = -1; i < 2; i++) {
							expect($.fn.css).toHaveBeenCalledWith('left', i * 100 + '%');
						}
					});

					it('should set the overflow to hidden when sliding and transitions are used', function () {
						slidekick.to(1);
						expect($.fn.css).toHaveBeenCalledWith('overflow', 'hidden');
					});

					it('should set the overflow to hidden when sliding and transisitons are not used', function () {
						slidekick = $container.empty().slidekick({
							transitions: false
						});
						createViews(3);
						slidekick.to(0);
						slidekick.to(1);

						expect($.fn.css).not.toHaveBeenCalledWith('overflow', 'hidden');
					});

					it("does not allow swapping buffers when an animation is in progress", function () {
						slidekick.to(2);
						slidekick.to(1);

						expect(slidekick.$buffers[0].html()).toBe('<span>1</span>');
						expect(slidekick.$buffers[1].html()).toBe('<span>2</span>');
						expect(slidekick.$buffers[2].html()).toBe('<span>0</span>');
					});

					describe("stopping transitions", function () {

						it("allows the buffers to be swapped after a stop", function () {
							slidekick.to(2);
							slidekick.stop();
							slidekick.to(1);

							expect(slidekick.$buffers[0].html()).toBe('<span>0</span>');
							expect(slidekick.$buffers[1].html()).toBe('<span>1</span>');
							expect(slidekick.$buffers[2].html()).toBe('<span>2</span>');
						});

						it("stops the jQuery animation explicitly", function () {
							spyOn($.fn, "stop");

							slidekick.stop();

							expect($.fn.stop).toHaveBeenCalled();
						});
					});
				});


				describe('IE9 and Safari5', function () {

					var old;
					var old_ie9;

					beforeEach(function () {
						spyOn($.fn, 'animate').andCallThrough();
						spyOn($.fn, 'append').andCallThrough();

						old = $.fn.slidekick.transform;
						$.fn.slidekick.transform = undefined;

						old_ie9 = $.fn.slidekick.ie9;
						$.fn.slidekick.ie9 = true;

						slidekick = $container.empty().slidekick();

						createViews(3);

						slidekick.to(0);
					});

					afterEach(function () {
						$.fn.slidekick.transform = old;
						$.fn.slidekick.ie9 = old_ie9;
					});

					it('should animate on the slider when the to method is used', function () {
						slidekick.to(1);

						expect($.fn.animate).toHaveBeenCalled();
					});
				});

				describe('{transitions:false}', function () {

					it('should create a single buffer to work with', function () {
						expect(slidekick.$buffers.length).toBe(1);
					});

					it('should not create a slider', function () {
						expect(slidekick.$slider).not.toBeDefined();
					});

				});
			});

			describe('callbacks', function () {
				var callback;

				beforeEach(function () {
					callback = jasmine.createSpy();
				});

				it('should support the registration of a "show" callback that gets called when the view is visible', function () {
					slidekick.on('show', callback);

					slidekick.to(0);

					expect(callback).toHaveBeenCalled();
					expect(callback).toHaveBeenCalledWith(jasmine.any($.Event), slidekick.get(0), 0);
				});

				it('should support a "buffer" event that will be called on the view as it\'s being loaded into a buffer', function () {
					var buffer = function (event, view, index) {
						expect(slidekick.at()).toBe(1);
						expect(callback).not.toHaveBeenCalled();
						expect(view).toBe(slidekick.get(0));
						expect(index).toBe(0);
						called = true;
					};
					slidekick.on('buffer', buffer);
					slidekick.on('show', callback);

					slidekick.to(0);

					expect(called).toBe(true);
				});

				it('shouldn\'t call "buffer" or "show" when attempting to go to a view that\'s already loaded', function () {
					var buffer = jasmine.createSpy();
					slidekick.on('buffer', buffer).on('change', callback);

					slidekick.to(1);

					expect(buffer).not.toHaveBeenCalled();
					expect(callback).not.toHaveBeenCalled();
				});

				it('should call "hide" when a view is no longer going to be visible', function () {
					slidekick.on('hide', callback);

					slidekick.to(2);

					expect(callback).toHaveBeenCalledWith(jasmine.any($.Event), slidekick.get(1), 1);
				});

				it('should call "animationend" when animation is done', function () {
					slidekick.on('animationend', callback);

					slidekick.to(2);

					expect(callback).toHaveBeenCalledWith(jasmine.any($.Event), slidekick.get(2), 2);
				});
			});
		});

	});
});