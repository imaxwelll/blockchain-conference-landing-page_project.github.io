/*

 Copyright (c) 2015 Loginov Artem http://loginov.biz
 Dual licensed under the MIT license and GPL license

*/

var plugins = (function(window, undefined) {

    'use strict';

    function counterUp() {

        if ($.isFunction($.fn.flexslider) && !helpers.mobile()) {

            var $counter = $('.b-counters_item_digits');

            $counter.each(function() {

                $(this).counterUp({
                    time: 1000
                });

            });

        }

    }

    function countDown() {

        var $countdown = $('.b-countdown');

        $countdown.each(function() {

            var $this = $(this),
                target = new Date($countdown.data('startAt'));

            if ($.isFunction($.fn.countDown)) {

                $this.countDown({
                    targetDate: {
                        day: target.getDate(),
                        month: target.getMonth() + 1,
                        year: target.getFullYear(),
                        hour: target.getHours(),
                        min: target.getMinutes(),
                        sec: target.getSeconds()
                    },
                    onComplete: function() {

                        if(typeof window[$this.data('complete')] === 'function') {

                            window[$this.data('complete')].call($this);

                        } else {

                            $this.toggleClass('b-countdown__complete', true);

                        }

                    },
                    omitWeeks: true
                });

            }

        });

    }

    function carousel() {

        if ($.isFunction($.fn.owlCarousel)) {

            var selector = 'b-carousel';

            $('.' + selector).each(function() {

                var $carousel = $(this);

                $carousel.owlCarousel({
                    margin: 0,
                    loop: true,
                    autoplay: $carousel.data('auto') || false,
                    autoplayTimeout: $carousel.data('interval') * 1000 || 10000,
                    mouseDrag: false,
                    touchDrag: true,
                    pullDrag: false,
                    freeDrag: false,
                    dots: false,
                    navText: ['Prev', 'Next'],
                    navClass: ['owl-prev', 'owl-next'],
                    responsive: {
                        0: {
                            items: $carousel.data('xs'),
                            nav: $carousel.find('.b-carousel_item').length >= $carousel.data('xs')
                        },
                        480: {
                            items: $carousel.data('sm'),
                            nav: $carousel.find('.b-carousel_item').length >= $carousel.data('sm')
                        },
                        768: {
                            items: $carousel.data('md'),
                            nav: $carousel.find('.b-carousel_item').length >= $carousel.data('md')
                        },
                        970: {
                            items: $carousel.data('lg'),
                            nav: $carousel.find('.b-carousel_item').length >= $carousel.data('lg')
                        }
                    }
                });

            });

        }

    }

    function sliders() {

        if ($.isFunction($.fn.flexslider)) {

            var selector = 'b-slider';

            $('.' + selector).each( function() {

                var $slider = $(this);

                if ($slider.find('.' + selector + '_inner > div').length > 1) {

                    $slider.flexslider({
                        namespace: selector + '_',
                        selector: '.' + selector + '_inner > div',
                        controlsContainer: $slider.parent(),

                        allowOneSlide: false,

                        animation: $slider.data('animation') || 'slide',
                        animationLoop: true,
                        animationSpeed: $slider.data('speed') || 400,

                        slideshow: $slider.data('auto') || false,
                        slideshowSpeed: $slider.data('interval') * 1000 || 5000,

                        showNearby: $slider.data('showNearby') || false,

                        directionNav: !!$slider.data('arrows') ? $slider.data('arrows') : true,
                        controlNav: $slider.data('control') || false,
                        controlNavLoop: $slider.data('controlLoop') || false,
                        controlNavPlace: $slider.data('controlPlace') || 'after',
                        progressLine: $slider.data('progress') || false,

                        thumbCaptions: $slider.data('controlCaptions') || false,
                        thumbBg: $slider.data('thumbsAsBg') || false,
                        thumbCount: !!$slider.data('thumbsCount') ? $slider.data('thumbsCount').split(',') : [1, 2, 2, 2],

                        pauseOnAction: true,
                        prevText: '',
                        nextText: '',

                        smoothHeight: true,

                        after: function($slider) {

                            if (!$slider.playing && $slider.data('auto')) {
                                $slider.play();
                            }

                        }
                    });

                }

            });

        }

    }

    function parallax() {

        skrollr.init({
            forceHeight: false,
            mobileCheck: function() {

                return false;

            }
        });

    }

    function popup() {

        var $regular = $('.js-popup'),
            $form = $('.js-form'),
            $iframe = $('.js-popup-video');

        $regular.leafLetPopUp({
            animationStyleOfBox: 'scale',
            animationStyleOfChange: 'slide',
            boxWidth: 1000,
            boxHorizontalGutters: 15,
            closeBtnClass: 'i-icon i-ion-ios-close-outline',
            closeBtnLocation: 'overlay',
            directionBtnClass: ['i-icon i-ion-ios-arrow-back', 'i-icon i-ion-ios-arrow-forward'],
            overlayOpacity: 0.75,
            afterLoad: afterLoad
        });

        $form.leafLetPopUp({
            animationStyleOfBox: 'flip3d',
            animationStyleOfChange: 'slide',
            boxWidth: 600,
            boxHorizontalGutters: 15,
            closeBtnClass: 'i-icon i-ion-ios-close-outline',
            closeBtnLocation: 'overlay',
            directionBtnClass: ['i-icon i-ion-ios-arrow-back', 'i-icon i-ion-ios-arrow-forward'],
            overlayOpacity: 0.75,
            afterLoad: afterLoad
        });

        $iframe.leafLetPopUp({
            animationStyleOfBox: 'scale',
            animationStyleOfChange: 'slide',
            boxWidth: 800,
            boxHorizontalGutters: 15,
            content: true,
            closeBtnClass: 'i-icon i-ion-ios-close-outline',
            closeBtnLocation: 'overlay',
            directionBtnClass: ['i-icon i-ion-ios-arrow-back', 'i-icon i-ion-ios-arrow-forward'],
            overlayOpacity: 0.75,
            afterLoad: afterLoad
        });

        // Close trigger
        $('body').on('click', '.js-popup-close', function() {

            $(this).leafLetPopUp('hide');

        });

        function afterLoad() {

            // Deactivate navigation
            $('.b-header_nav a').removeClass('active');

            // Init forms plugins
            forms.init('.b-leaflet_box');

        }

    }

    function wayPoint() {

        var $sections = $('#speakers');

        if (!helpers.mobile()) {

            $sections.each(function() {

                initWP.call($(this).addClass('b-section__wp'), '50%');

            });

        }

        function initWP(offset) {

            this.waypoint('destroy').waypoint($.proxy(function() {

                this.addClass('b-section__show');

            }, this), { offset: offset });

        }

    }

    return {
        carousel: carousel,
        counterUp: counterUp,
        countDown: countDown,
        parallax: parallax,
        popup: popup,
        sliders: sliders,
        wayPoint: wayPoint
    };

})(window);
