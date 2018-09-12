$(document).ready(function(){

    // UI init
    ui.init();

    // Modules init
    modules.hashNav();
    modules.video('intro-video');

    modules.spoilers({
        selector: '.js-spoiler'
    });

    modules.tabs({
        selector: '.js-tabs'
    });

    // Plugins init
    plugins.counterUp();
    plugins.wayPoint();

    plugins.parallax();

    plugins.countDown();
    plugins.popup();

    plugins.carousel();
    plugins.sliders();

    // Forms
    forms.init('body');

});

var ui = (function(window, undefined) {

    'use strict';

    function pageLoad() {

        $('html')
            .addClass(helpers.mobile() ? 'm-touch' : 'm-desktop');

        $(window)
            .on('load', function() {

                $('html').addClass('m-loaded');
                $('.b-loader').addClass('b-loader__complete', true);

                // Load GM API
                GoogleMap.loadAPI();

            });

    }

    function headerState() {

        var $header = $('.b-header__float'),

            hasScreen = $('#intro').length > 0,
            threshold = 10;

        processing();

        $(window).bind('scroll.headerState resize.headerState', function() {

            processing();

        });

        function processing() {

            var $locker = $('.b-leaflet_locker'),
                scroll = $locker.length ? Math.abs(parseInt($locker.css('margin-top')), 10) : document.documentElement.scrollTop || document.body.scrollTop;

            $header.toggleClass('b-header__transparent', hasScreen && scroll < threshold);

        }

    }

    function navigation() {

        var $toggle = $('.js-nav'),
            $header = $('#header'),

            $locker = $('.b-leaflet_locker'),
            threshold = 10;

        $toggle.bind('click', function() {

            var scroll = $locker.length ? Math.abs(parseInt($locker.css('margin-top')), 10) : document.documentElement.scrollTop || document.body.scrollTop;

            $header
                .toggleClass('b-header__transparent', $header.hasClass('b-header__showNav') && scroll < threshold)
                .toggleClass('b-header__showNav');

        });

    }

    function pricingToggle() {

        var $switcher = $('.b-pricing_switcher_box input'),
            $plans = $('.b-pricing_plan');

        $switcher.bind('change', function() {

            $plans.toggleClass('b-pricing_plan__switched', $(this).prop('checked'));

        });

    }

    function purchase() {

        $('[data-ticket]')
            .on('click', function() {

                // Scroll to
                $('html, body')
                    .stop()
                    .animate({
                        scrollTop: $($(this).attr('href')).offset().top - 70
                    }, 1500, 'easeInOutExpo');

                // Select pricing plan
                $($(this).attr('href')).find('select option[value="' + $(this).data('ticket') + '"]').prop('selected', true);

                // Select ticket validity
                $($(this).attr('href')).find('select option[value="' + $(this).data('validity') + '"]').prop('selected', true);

                // Update uniform plugin
                $.uniform.update();

            });

    }

    function purchaseSuccess() {

        var queryString = location.search,
            queryParams = {};

        if (!!queryString) {

            var variables = (queryString.substr(1)).split('&');

            for (var q = 0; q < variables.length; q++) {

                var param = variables[q].split('=');
                queryParams[param[0]] = param[1];

            }

        }

        if (queryParams['paypal'] == 'success') {

            $(window).leafLetPopUp('show', {
                url: 'assets/php/success.php',
                animationStyleOfBox: 'flip3d',
                animationStyleOfChange: 'slide',
                boxWidth: 500,
                boxHorizontalGutters: 15,
                closeBtnClass: 'i-icon i-ion-ios-close-outline',
                closeBtnLocation: 'overlay',
                directionBtnClass: ['i-icon i-ion-ios-arrow-back', 'i-icon i-ion-ios-arrow-forward'],
                overlayOpacity: 0.75,
                afterLoad: function() {

                    $('.b-header_nav a').removeClass('active');

                }
            });

        }

    }

    function targetBlank() {

        $('a[data-target="_blank"]')
            .on('click', function() {

                return !window.open($(this).attr('href'));

            });

    }

    return {
        init: function() {

            // Loader
            pageLoad();

            // Header state
            headerState();

            // Navigation
            navigation();

            // Toggle of pricing
            pricingToggle();

            // Buy now action
            purchase();

            // Purchase success
            purchaseSuccess();

            // Target "blank" links
            targetBlank();

        }
    };

})(window);

var helpers = (function(window, undefined) {

    'use strict';

    function pixelsRatio() {

        return 'devicePixelRatio' in window && window.devicePixelRatio > 1;

    }

    function screen() {

        var deviceScreen = $(window).width();

        if (deviceScreen < 480) {

            return 'xs';

        }

        else if (deviceScreen >= 480 && deviceScreen < 768)
        {

            return 'sm';

        }

        else if (deviceScreen >= 768 && deviceScreen < 970)
        {

            return 'md';

        }

        else if (deviceScreen >= 970)
        {

            return 'lg';

        }

    }

    function mobile() {

        var uaTest = {

            android: function() {
                return navigator.userAgent.match(/Android/i);
            },

            blackBerry: function() {
                return navigator.userAgent.match(/BlackBerry/i);
            },

            iOS: function() {
                return navigator.userAgent.match(/iPhone|iPad|iPod/i);
            },

            opera: function() {
                return navigator.userAgent.match(/Opera Mini/i);
            },

            windows: function() {
                return navigator.userAgent.match(/IEMobile/i);
            }

        };

        return (uaTest.android() || uaTest.blackBerry() || uaTest.iOS() || uaTest.opera() || uaTest.windows())

    }

    return {
        mobile: mobile,
        pixelsRatio: pixelsRatio,
        screen: screen
    };

})(window);
