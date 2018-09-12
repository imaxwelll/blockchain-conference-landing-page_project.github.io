/*

 Copyright (c) 2015 Loginov Artem http://loginov.biz
 Dual licensed under the MIT license and GPL license

*/

var modules = (function(window, undefined) {

    'use strict';

    function hashNav() {

        var $anchor = $('a[href^="#"]:not([class*="js-spoiler"] a, [class*="js-tabs"] a)'),
            $doc = $('html, body');

        $anchor.on('click', function(e) {

            var url = $(this).attr('href');

            if (url.length > 1) {

                e.preventDefault();

                if ($(url).length) {

                    $doc
                        .stop()
                        .animate({
                            scrollTop: $(url).offset().top - 70
                        }, 1500, 'easeInOutExpo');

                }

            }

        });

    }

    function spoilers(options) {

        $(options.selector).each(function() {

            var $spoiler = $(this),

                $body = $spoiler.find(options.selector + '-text'),
                $toggle = $spoiler.find(options.selector + '-toggle');

            $spoiler.not('.opened').find(options.selector + '-text').hide();

            $toggle
                .on('click.spoiler', function(e) {

                    e.preventDefault();

                    var item = $(this).closest(options.selector),
                        state = item.hasClass('opened') && item.find(options.selector + '-text').is(':visible');

                    if (!state) {

                        spoilerOpen.call(item, options.selector);

                    } else {

                        spoilerClose.call(item, options.selector);

                    }

                    // Close neighbors items
                    if (item.data('closeNeighbors')) {

                        item.siblings(options.selector).each(function() {
                            spoilerClose.call($(this), options.selector);
                        });

                    }

                });

        });

        function spoilerClose(sel) {

            this.toggleClass('opened', false);

            this.find(sel + '-toggle').html(this.find(sel + '-toggle').data('closed') || this.find(sel + '-toggle').html());
            this.find(sel + '-text').slideUp({ duration: 300, easing: 'easeOutQuart' });

        }

        function spoilerOpen(sel) {

            this.toggleClass('opened', true);

            this.find(sel + '-toggle').html(this.find(sel + '-toggle').data('opened') || this.find(sel + '-toggle').html());
            this.find(sel + '-text').slideDown({ duration: 300, easing: 'easeOutQuart' });

        }

    }

    function tabs(options) {

        $(options.selector).each(function(){

            var $wg = $(this),
                $wrapper = $(this).find(options.selector + '-wrapper').filter(function() { return $wg[0] == $(this).closest(options.selector)[0]; }),
                $currentLink = $(this).find(options.selector + '-toggle a.current');

            if(!$currentLink.length) {
                $(this).find(options.selector + '-toggle a:first').addClass('current');
            }

            var hash = $(this).find(options.selector + '-toggle a.current').attr('href'),

                $pages = $wrapper.find(options.selector + '-page').filter(function() { return $wrapper[0] == $(this).closest(options.selector + '-wrapper')[0]; }),
                $currentPage = $wrapper.find(options.selector + '-page' + hash).filter(function() { return $wrapper[0] == $(this).closest(options.selector + '-wrapper')[0]; });

            $pages.toggleClass('visible', false);
            $currentPage.toggleClass('visible', true);

            $(this)
                .find(options.selector + '-toggle')
                .filter(function() { return $wg[0] == $(this).closest(options.selector)[0]; })
                .find('a[href*="#"]')
                .click(function(e) {

                    e.preventDefault();

                    $wrapper.css({ height: $currentPage.outerHeight(true) });

                    $(this).closest(options.selector + '-toggle').find('a').removeClass('current');
                    $(this).addClass('current');

                    console.log($pages, $currentPage);

                    $currentPage = $(this).closest(options.selector).find(options.selector + '-page' + $(this).attr('href'));
                    $pages.toggleClass('visible', false);

                    $currentPage.toggleClass('visible', true);

                    $wrapper.animate({ height: $currentPage.outerHeight(true) }, 500, 'easeOutQuart', function() {

                        $(this).css({ height: '' })

                    });

                    if(typeof options.onToggle != 'undefined' && options.onToggle) {
                        options.onToggle($(this), $(this).closest(options.selector).find(options.selector + '-page' + $(this).attr('href')));
                    }

                    return false;

                });

        });

    }

    function video(id) {

        var support = !!document.createElement('video').canPlayType,
            isTouchDevice = 'ontouchstart' in document.documentElement,

            video = document.getElementById(id),

            src, dotIndex, source;

        if (!video) return;
        if (!support || isTouchDevice) {

            video.style.display = 'none';
            video.parentNode.removeChild(video);

        } else {

            setTimeout(function() {

                src = video.getAttribute('data-src');
                dotIndex = src.lastIndexOf('.');

                if (dotIndex != -1) {
                    src = src.substring(0, dotIndex);
                }

                source = document.createElement('source');

                if (_supportsWebmVideo(video)) {

                    source.src = src + '.webm';
                    source.type = 'video/webm; codecs="vp8, vorbis';

                } else if (_supportsMp4Video(video)) {

                    source.src = src + '.mp4';
                    source.type = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2';

                } else if (_supportsOggVideo(video)) {

                    source.src = src + '.ogv';
                    source.type = 'video/ogg; codecs="theora, vorbis';

                }

                video.appendChild(source);

                video.load();
                video.play();

            }, 0);

        }

        function _supportsWebmVideo(video) {
            return video.canPlayType('video/webm; codecs="vp8, vorbis"');
        }
        function _supportsMp4Video(video) {
            return video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
        }
        function _supportsOggVideo(video) {
            return video.canPlayType('video/ogg; codecs="theora, vorbis"');
        }

    }

    return {
        hashNav: hashNav,
        spoilers: spoilers,
        tabs: tabs,
        video: video
    };

})(window);
