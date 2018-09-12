/*

 JQuery Leaflet Pop Up v 0.9.1
 Copyright © 2014 Artem Loginov
 http://loginov.biz/

 License:
 GNU General Public License 2 - http://opensource.org/licenses/GPL-2.0

*/

(function($) {

    'use strict';

    var LeafletPopup = (function(window, undefined) {

        var leaflet = {

            settings: {},
            defaultSettings: {

                url: false,
                content: false,                         // text/html string or function, who will return text/html string, or false (boolean)
                contentType: false,                     // string: "html", "function", "image", "iframe", "url", "hash"

                animationStyleOfBox: 'fade',            // animation style of popup box: "fade", "scale", "drop", "drop3d"
                animationStyleOfOverlay: 'fade',        // animation style of overlay: "fade", "scale"
                animationStyleOfChange: 'fade',         // animation style of change content: "fade", "slide"
                animateSpeed: 400,

                boxVerticalGutters: 50,                 // number of pixels
                boxHorizontalGutters: 50,               // number of pixels
                boxWidth: 800,                          // number of pixels or string 'auto',

                closeBtnClass: '',
                closeBtnLocation: 'overlay',            // 'overlay', 'box',

                directionBtnClass: ['', ''],

                checkCookies: false,
                cookies: {
                    key: 'jquery.leaflet',
                    value: 'locked',
                    expires: 1,
                    path: '/'
                },

                namespace: 'b-leaflet',                  // css-prefix for popup layout

                overlay: true,
                overlayBlur: false,
                overlayCloseEvent: true,
                overlayOpacity: 0.5,
                overlayShowSpeed: 400,

                scrollMode: 'outer',                    // 'outer' - common scroll mode, 'inner' - popup is fixed behind content
                scrollLocker: null,

                // Callbacks
                beforeLoad: function() {  },            // this - popup box jquery object
                afterLoad: function() {  },             // this - popup box jquery object

                beforeClose: function() {  },           // this - popup container jquery object
                afterClose: function() {  }             // global context

            },

            states: {
                isBuilt: false,
                scroll: 0,
                scrollBarWidth: 18,
                direction: 1
            },
            elements: {},
            group: {}

        };

        function App($element, options, method) {

            // Cashing
            leaflet.elements.body = $('body');
            leaflet.elements.document = $('html');

            leaflet.elements.link = $element;

            // Get settings
            this.settings = $.extend(leaflet.settings, leaflet.defaultSettings, options);

            this.settings.closeBtnLocation = this.settings.overlay ? this.settings.closeBtnLocation : 'box';
            this.settings.url = this.settings.url || $element.attr('href') || $element.data('href') || '/';

            // Content type
            if (!this.settings.contentType) {

                this.setContentType();

            }

            // Set states
            this.states = {};
            this.states.pfx = helpers.getPfx();
            this.states.loadingTimeout = null;
            this.states.scroll = document.documentElement.scrollTop || document.body.scrollTop;
            this.states.scrollBarWidth = helpers.getScrollBarWidth();

            // Set document classes prefix
            this.docClassPfx = 'm-leaflet-';

            switch (method) {

                default:

                    return $.error('Method "' +  param + '" is not defined in LeafletPopup');

                case 'init':

                    // Init popup
                    this.init();

                    break;

                case 'show':

                    if (!(this.settings.checkCookies && helpers.cookies.get(this.settings.cookies.key) == this.settings.cookies.value)) {

                        // Init popup
                        this.init();
                        helpers.cookies.set(this.settings.cookies);

                    }

                    break;

                case 'hide':

                    // Hide popup
                    this.hideLayout();

                    break;

                case 'destroy':

                    leaflet.elements.body.off('click.leafletOpen', $element.selector);

                    break;

            }

        }

        App.prototype.init = function() {

            if (!leaflet.states.isBuilt) {

                // Build layout
                this.buildLayout();

                // Popup box show
                this.boxShow();

            } else {

                // Popup box change
                this.boxChange();

            }

        };

        App.prototype.configureDocClasses = function() {

            var docClasses = this.docClassPfx + 'on ' + this.docClassPfx + 'loading ';

            // Box transition style
            docClasses += this.docClassPfx + this.settings.animationStyleOfBox + '-transition ';

            // Leaflet mode
            docClasses += this.docClassPfx + this.settings.scrollMode + '-mode ';

            // Overlay switch
            docClasses += this.settings.overlay ? this.docClassPfx + 'overlay ' : '';

            return docClasses;

        };

        App.prototype.removeDocClasses = function() {

            var mask = this.docClassPfx + '*';

            leaflet.elements.document.removeClass(function(index, classStr) {

                var replace = mask.replace(/\*/g, '\\S+');
                return (classStr.match(new RegExp('\\b' + replace + '', 'g')) || []).join(' ');

            });

        };

        App.prototype.setContentType = function() {

            if (!!this.settings.content) {

                switch (typeof leaflet.settings.content) {

                    default:
                    case 'string':

                        this.settings.contentType = 'html';

                        break;

                    case 'function':

                        this.settings.contentType = 'function';

                        break;

                    case 'boolean':

                        this.settings.contentType = 'iframe';

                        break;

                }

            } else {

                var isImage = /\.(gif|png|jp(e|g|eg)|bmp|ico|webp|jxr|svg)((#|\?).*)?$/i.test(this.settings.url),
                    hasHash = !!this.settings.url.match(/#/gi),
                    remoteHash = this.settings.url.indexOf('#') != 0;

                if (isImage) {

                    this.settings.contentType = 'image';

                }

                if (hasHash && !remoteHash) {

                    this.settings.contentType = 'hash';

                }

                if (hasHash && remoteHash) {

                    this.settings.contentType = 'hashUrl';

                }

                if (!isImage && !hasHash) {

                    this.settings.contentType = 'url';

                }

            }

        };

        App.prototype.buildLayout = function() {

            // Create popUp markup
            var $leaflet = $('<div class="' + leaflet.settings.namespace + '"></div>'),
                $leafletWrapper = $('<div class="' + leaflet.settings.namespace + '_inner"></div>').css({ padding: leaflet.settings.boxVerticalGutters + 'px ' + leaflet.settings.boxHorizontalGutters + 'px' }).appendTo($leaflet),

                $leafletPerspective = $('<div class="' + leaflet.settings.namespace + '_perspective"></div>').css({ maxWidth: leaflet.settings.boxWidth }).appendTo($leafletWrapper),

                $leafletBox = $('<div class="' + leaflet.settings.namespace + '_box"></div>').css({ width: 'auto', maxWidth: leaflet.settings.boxWidth }).appendTo($leafletPerspective),
                $leafletBoxContent = $('<div class="' + leaflet.settings.namespace + '_box_content"></div>').appendTo($leafletBox),

                $leafletOverlay = $('<div class="' + leaflet.settings.namespace + '_overlay"></div>').appendTo($leafletWrapper),
                $leafletCloseBtn = $('<div class="' + leaflet.settings.namespace + '_close ' + leaflet.settings.closeBtnClass + '"></div>').appendTo(this.settings.closeBtnLocation == 'box' ? $leafletBox : $leafletWrapper),

                $leafletLocker = $('<div class="' + leaflet.settings.namespace + '_locker"></div>');

            // Group
            this.groupSources();

            if (leaflet.group.length) {

                var $leafletPrevBtn = $('<div class="' + leaflet.settings.namespace + '_direction ' + leaflet.settings.namespace + '_prev ' + leaflet.settings.directionBtnClass[0] + '"></div>').appendTo(this.settings.closeBtnLocation == 'box' ? $leafletBox : $leafletWrapper),
                    $leafletNextBtn = $('<div class="' + leaflet.settings.namespace + '_direction ' + leaflet.settings.namespace + '_next ' + leaflet.settings.directionBtnClass[1] + '"></div>').appendTo(this.settings.closeBtnLocation == 'box' ? $leafletBox : $leafletWrapper);

            }

            // Transition settings
            $leaflet
                .css(leaflet.pfx + 'transition-duration', leaflet.settings.animateSpeed + 'ms')
                .css('transition-duration', leaflet.settings.animateSpeed + 'ms');

            $leafletBox
                .css(leaflet.pfx + 'transition-duration', leaflet.settings.animateSpeed + 'ms')
                .css('transition-duration', leaflet.settings.animateSpeed + 'ms');

            $leafletBoxContent
                .css(leaflet.pfx + 'transition-duration', leaflet.settings.animateSpeed + 'ms')
                .css('transition-duration', leaflet.settings.animateSpeed + 'ms');

            $leafletOverlay
                .css(leaflet.pfx + 'transition-duration', leaflet.settings.overlayShowSpeed + 'ms')
                .css('transition-duration', leaflet.settings.overlayShowSpeed + 'ms');

            // Add document classes
            leaflet.elements.document.addClass(this.configureDocClasses());

            // Set leaflet data
            $leaflet.data('leafletSettings', {
                animationStyleOfBox: this.settings.animationStyleOfBox,
                animationStyleOfOverlay: this.settings.animationStyleOfOverlay,
                animationStyleOfChange: this.settings.animationStyleOfChange,
                scrollLocker: this.settings.scrollLocker,
                scrollMode: this.settings.scrollMode
            });

            // Caching jquery objects
            leaflet.elements.main = $leaflet;
            leaflet.elements.perspective = $leafletPerspective;
            leaflet.elements.wrapper = $leafletWrapper;
            leaflet.elements.box =  $leafletBox;
            leaflet.elements.close = $leafletCloseBtn;
            leaflet.elements.prev = $leafletPrevBtn;
            leaflet.elements.next = $leafletNextBtn;
            leaflet.elements.content = $leafletBoxContent;
            leaflet.elements.overlay = $leafletOverlay;
            leaflet.elements.locker = !!this.settings.scrollLocker ? this.settings.scrollLocker : $leafletLocker;

            // Set layout mode
            this.setLayoutMode();

            // Bind events
            this.bindCloseEvents();
            this.bindChangeEvents();
            this.bindResizeEvents();

            // Append markup
            leaflet.elements.body.prepend($leaflet);

            // Show overlay with micro delay
            setTimeout($.proxy(function() {

                this.overlayShow();

            }, this), 0);

            // Switch state
            leaflet.states.isBuilt = true;

        };

        App.prototype.hideLayout = function() {

            // Action before closing popup
            if(!!this.settings.beforeClose) {

                this.settings.beforeClose.call(leaflet.elements.main);

            }

            this.overlayHide();

            // Hide popup box and destroy layout
            this.boxHide(function() {

                // Unset locker
                this.unsetLayoutMode();

                // Destroy layout
                leaflet.elements.main.remove();

                // Clear document classes
                this.removeDocClasses();

                // Switch state
                leaflet.states.isBuilt = false;

                // Action after closing popup
                if(!!this.settings.afterClose) {

                    this.settings.afterClose();

                }

            });

        };

        App.prototype.setLayoutMode = function() {

            if (this.settings.scrollMode == 'outer') {

                if (!!leaflet.elements.main.data('leafletSettings').scrollLocker) {

                    leaflet.elements.main.data('leafletSettings').scrollLocker
                        .addClass(this.settings.namespace + '_locker')
                        .css({ marginTop: -this.states.scroll });

                } else {

                    leaflet.elements.body.wrapInner(leaflet.elements.locker.css({ marginTop: -this.states.scroll }));

                }

            }

        };

        App.prototype.unsetLayoutMode = function() {

            if (this.settings.scrollMode == 'outer') {

                var $locker = !!this.settings.scrollLocker ? this.settings.scrollLocker : leaflet.elements.locker;

                // Normalize locker
                $locker
                    .css({ marginTop: '' })
                    .removeClass(this.settings.namespace + '_locker');

                // Unwrap locker
                if (!leaflet.elements.main.data('leafletSettings').scrollLocker) {

                    helpers.unwrap($('body'), '.' + this.settings.namespace + '_locker');

                }

                // Return normal scroll
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                window.scrollBy(0, this.states.scroll);

            }

        };

        App.prototype.groupSources = function() {

            leaflet.group = $('[data-group="' + leaflet.elements.link.data('group') + '"]').filter(function() {

                return !!$(this).data('leaflet');

            });

        };

        App.prototype.bindCloseEvents = function() {

            leaflet.elements.close
                .add(this.settings.overlayCloseEvent ? leaflet.elements.overlay : {})
                .bind('click.leafletClose', $.proxy(function() {

                    this.hideLayout();

                }, this));

        };

        App.prototype.bindResizeEvents = function() {

            $(window).bind('resize.leafletResize', $.proxy(function() {

                if (leaflet.states.isBuilt) {

                    leaflet.elements.box
                        .css(this.states.pfx + 'transition-property', 'top, margin, height, transform, opacity')
                        .css('transition-property', 'top, margin, height, transform, opacity');

                    this.boxPosition();

                }

            }, this));

        };

        App.prototype.bindChangeEvents = function() {

            $(leaflet.elements.prev)
                .bind('click.leafletChange', $.proxy(function() {

                    leaflet.states.direction = -1;
                    this.changeEventHandler();

                }, this));

            $(leaflet.elements.next)
                .bind('click.leafletChange', $.proxy(function() {

                    leaflet.states.direction = 1;
                    this.changeEventHandler();

                }, this));

        };

        App.prototype.changeEventHandler = function() {

            var currentIndex = leaflet.group.index(leaflet.elements.link),
                targetIndex = currentIndex + leaflet.states.direction;

            targetIndex = (targetIndex + 1) > leaflet.group.length ? 0 : targetIndex < 0 ? (leaflet.group.length - 1) : targetIndex;

            leaflet.group.eq(targetIndex).trigger('click.leafletOpen');

        };

        App.prototype.overlayShow = function() {

            leaflet.elements.overlay
                .css(this.states.pfx + 'opacity', this.settings.overlayOpacity)
                .css('opacity', this.settings.overlayOpacity)
                .css('visibility', 'visible');

            if (this.settings.overlayBlur) {

                leaflet.elements.locker

                    .css(this.states.pfx + 'transition', this.states.pfx + 'filter ' + this.settings.overlayShowSpeed + 'ms ease')
                    .css('transition', this.states.pfx + 'filter ' + this.settings.overlayShowSpeed + 'ms ease')

                    .css(this.states.pfx + 'filter', 'blur(3px)')
                    .css('filter', 'blur(3px)');

            }

        };

        App.prototype.overlayHide = function() {

            leaflet.elements.overlay
                .add(leaflet.elements.close)
                .add(leaflet.elements.prev)
                .add(leaflet.elements.next)

                .css(leaflet.pfx + 'transition-duration', leaflet.settings.animateSpeed + 'ms')
                .css('transition-duration', leaflet.settings.animateSpeed + 'ms')

                .css(this.states.pfx + 'opacity', 0)
                .css('opacity', 0)
                .css('visibility', 'hidden');

            if (this.settings.overlayBlur) {

                leaflet.elements.locker
                    .css(this.states.pfx + 'filter', '')
                    .css('filter', '');

            }

        };

        App.prototype.getContent = function(callback) {

            // Action before loading of content
            if(!!this.settings.beforeLoad) {

                this.settings.beforeLoad.call(leaflet.elements.main, this.states.scroll);

            }

            // Classes
            leaflet.elements.box
                .removeClass($.proxy(function(index, classStr) {

                    var replace = this.docClassPfx + 'type-*'.replace(/\*/g, '\\S+');
                    return (classStr.match(new RegExp('\\b' + replace + '', 'g')) || []).join(' ');

                }, this))
                .addClass(this.docClassPfx + 'type-' + this.settings.contentType);

            switch (this.settings.contentType) {

                default:
                case 'html':
                case 'hash':
                case 'function':

                    var content = this.settings.contentType == 'html' ? this.settings.content : this.settings.contentType == 'function' ? this.settings.content() : $(this.settings.url).clone(true, true)

                    leaflet.elements.content
                        .empty().html(content);

                    setTimeout(function() {

                        callback();

                    }, 0);

                    break;

                case 'image':

                    var img = $('<img src="' + this.settings.url + '" alt="" />');

                    img.on('load', function() {

                        callback();

                    });

                    leaflet.elements.content
                        .empty().append(img);

                    break;

                case 'iframe':

                    var iframe = $('<iframe src="' + this.settings.url + '" frameborder="0" allowfullscreen></iframe>');

                    iframe.on('load', function() {

                        callback();

                    });

                    setTimeout(function(){

                        leaflet.elements.content
                            .empty().append(iframe);

                    }, this.settings.overlayShowSpeed);

                    break;

                case 'url':
                case 'hashUrl':

                    var url = this.settings.contentType == 'hashUrl' ? this.settings.url.split('#')[0] + ' #' + this.settings.url.split('#')[1] : this.settings.url;

                    leaflet.elements.content
                        .load(url, function() {

                            callback();

                        });

                    break;

            }

        };

        App.prototype.boxPosition = function() {

            var viewPortHeight = $(window).height(),
                viewPortInnerHeight = viewPortHeight - (this.settings.boxVerticalGutters * 2),

                boxVerticalPadding = leaflet.elements.box.outerHeight() - leaflet.elements.box.height(),
                contentHeightMax = viewPortInnerHeight - boxVerticalPadding;

            leaflet.elements.box.css({ maxHeight: (this.settings.scrollMode == 'outer') ? 'none' : contentHeightMax });

            leaflet.elements.content.css({ maxHeight: 'none' });
            leaflet.elements.content.css({ maxHeight: '' });

        };

        App.prototype.boxShow = function() {

            // Get content
            this.getContent($.proxy(function() {

                // Action when content is loaded
                if(!!this.settings.afterLoad) {

                    this.settings.afterLoad.call(leaflet.elements.box, this.states.scroll);

                }

                this.boxPosition();
                this.boxTransitionsIn[leaflet.elements.main.data('leafletSettings').animationStyleOfBox].call(this);

            }, this));

        };

        App.prototype.boxHide = function(callback) {

            this.boxTransitionsOut[leaflet.elements.main.data('leafletSettings').animationStyleOfBox].call(this);

            setTimeout($.proxy(function() {

                callback.call(this);

            }, this), this.settings.animateSpeed);

        };

        App.prototype.boxChange = function() {

            switch (leaflet.elements.main.data('leafletSettings').animationStyleOfChange) {

                default:
                case 'fade':

                    leaflet.elements.document.toggleClass(this.docClassPfx + 'loading', true);

                    // Set transition properties
                    leaflet.elements.box
                        .css(this.states.pfx + 'transition-property', 'top, margin, height, transform, opacity')
                        .css('transition-property', 'top, margin, height, transform, opacity');

                    // Hide text block
                    leaflet.elements.content.css({ overflow: 'hidden', opacity: 0 });

                    // Fix box height
                    leaflet.elements.box
                        .css({
                            height: leaflet.elements.box.height()
                        });

                    setTimeout($.proxy(function() {

                        // Action when content is loaded
                        if(!!this.settings.afterLoad) {

                            this.settings.afterLoad.call(leaflet.elements.box);

                        }

                        // Get content
                        this.getContent($.proxy(function() {

                            leaflet.elements.box
                                .css({
                                    height: leaflet.elements.content.height()
                                });

                            setTimeout($.proxy(function() {

                                leaflet.elements.box.css({ height: '' });

                                // Show content block
                                leaflet.elements.content.css({ overflow: '', opacity: '' });

                                // Loading class
                                clearTimeout(leaflet.loadingTimeout);
                                leaflet.elements.document.toggleClass(this.docClassPfx + 'loading', false);

                                this.boxPosition();

                            }, this), this.settings.animateSpeed);


                        }, this));

                    }, this), leaflet.settings.animateSpeed);

                    break;

                case 'slide':

                    leaflet.elements.document.toggleClass(this.docClassPfx + 'loading', true);

                    leaflet.elements.box
                        .css(this.states.pfx + 'transform', 'translate(' + (-300 * leaflet.states.direction) + 'px,0)')
                        .css('transform', 'translate(' + (-300 * leaflet.states.direction) + 'px,0)')
                        .css(this.states.pfx + 'opacity', 0)
                        .css('opacity', 0);

                    setTimeout($.proxy(function() {

                        leaflet.elements.box
                            .css(this.states.pfx + 'transition-property', 'zoom')
                            .css('transition-property', 'zoom')
                            .css(this.states.pfx + 'transform', 'translate(' + (300 * leaflet.states.direction) + 'px,0)')
                            .css('transform', 'translate(' + (300 * leaflet.states.direction) + 'px,0)');

                        setTimeout($.proxy(function() {

                            this.getContent($.proxy(function() {

                                // Action when content is loaded
                                if(!!this.settings.afterLoad) {

                                    this.settings.afterLoad.call(leaflet.elements.box);

                                }

                                leaflet.elements.box
                                    .css(this.states.pfx + 'transition-property', '')
                                    .css('transition-property', '')
                                    .css(this.states.pfx + 'transform', 'translate(0,0)')
                                    .css('transform', 'translate(0,0)')
                                    .css(this.states.pfx + 'opacity', 1)
                                    .css('opacity', 1);

                                // Loading class
                                clearTimeout(leaflet.loadingTimeout);
                                leaflet.elements.document.toggleClass(this.docClassPfx + 'loading', false);

                            }, this));

                        }, this), this.settings.animateSpeed / 1.5);

                    }, this), this.settings.animateSpeed / 1.5);

                    break;

            }

        };


        // Box transition styles
        App.prototype.boxTransitionsIn = {

            fade: function() {

                leaflet.elements.box
                    .css('visibility', 'visible')
                    .css(this.states.pfx + 'opacity', 1)
                    .css('opacity', 1);

                clearTimeout(this.states.loadingTimeout);
                leaflet.elements.document.toggleClass(this.docClassPfx + 'loading', false);

            },

            scale: function() {

                leaflet.elements.box
                    .css(leaflet.pfx + 'transform', 'scale(1, 1)')
                    .css('transform', 'scale(1, 1)');

                this.boxTransitionsIn.fade.call(this);

            },

            superScale: function() {

                leaflet.elements.box
                    .css(leaflet.pfx + 'transform', 'scale(1, 1)')
                    .css('transform', 'scale(1, 1)');

                this.boxTransitionsIn.fade.call(this);

            },

            drop: function() {

                leaflet.elements.box
                    .css(leaflet.pfx + 'transform', 'translate(0, 0)')
                    .css('transform', 'translate(0, 0)');

                this.boxTransitionsIn.fade.call(this);

            },

            drop3d: function() {

                leaflet.elements.box
                    .css(leaflet.pfx + 'transform', 'translate3d(0, 0, 0) rotateX(0deg)')
                    .css('transform', 'translate3d(0, 0, 0) rotateX(0deg)');

                this.boxTransitionsIn.fade.call(this);

            },

            flip3d: function() {

                leaflet.elements.box
                    .css(this.states.pfx + 'transform', 'rotateY(0deg)')
                    .css('transform', 'rotateY(0deg)');

                this.boxTransitionsIn.fade.call(this);

            },

            flip3dVertical: function() {

                leaflet.elements.box
                    .css(leaflet.pfx + 'transform', 'rotateX(0deg)')
                    .css('transform', 'rotateX(0deg)');

                this.boxTransitionsIn.fade.call(this);

            },

            newspaper: function() {

                leaflet.elements.box
                    .css(leaflet.pfx + 'transform', 'scale(1, 1) rotate(0deg)')
                    .css('transform', 'scale(1, 1) rotate(0deg)');

                this.boxTransitionsIn.fade.call(this);

            },

            sideFall: function() {

                leaflet.elements.box
                    .css(leaflet.pfx + 'transform', 'translate(0) translateZ(0) rotate(0deg)')
                    .css('transform', 'translate(0) translateZ(0) rotate(0deg)');

                this.boxTransitionsIn.fade.call(this);

            }

        };

        App.prototype.boxTransitionsOut = {

            fade: function() {

                leaflet.elements.box
                    .css('visibility', '')
                    .css(this.states.pfx + 'opacity', '')
                    .css('opacity', '')
                    .css(this.states.pfx + 'transform', '')
                    .css('transform', '');

            },

            scale: function() {

                this.boxTransitionsOut.fade.call(this);

            },

            superScale: function() {

                this.boxTransitionsOut.fade.call(this);

            },

            drop: function() {

                this.boxTransitionsOut.fade.call(this);

            },

            drop3d: function() {

                this.boxTransitionsOut.fade.call(this);

            },

            flip3d: function() {

                this.boxTransitionsOut.fade.call(this);

            },

            flip3dVertical: function() {

                this.boxTransitionsOut.fade.call(this);

            },

            newspaper: function() {

                this.boxTransitionsOut.fade.call(this);

            },

            sideFall: function() {

                this.boxTransitionsOut.fade.call(this);

            }

        };


        // Helpers
        var helpers = {

            getPfx: function() {

                var element = document.createElement('div'),
                    propsArray = ['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'],
                    pfx = false;

                $.each(propsArray, function(key, val) {

                    if (element.style[propsArray[key]] !== undefined) {

                        pfx = '-' + (propsArray[key].replace('Perspective','').toLowerCase()) + '-';
                        return false;

                    }

                });

                return pfx;

            },

            getScrollBarWidth: function() {

                var $element = $('<div class="b-scrollBar-test"></div>').css({ position: 'absolute', left: -99999, top: -99999, overflowY: 'scroll', width: 50, height: 50, visibility: 'hidden' });

                $('body').append($element);

                var scrollBarWidth = $element[0].offsetWidth - $element[0].clientWidth;

                $element.remove();

                return scrollBarWidth;

            },

            unwrap: function($this, selector) {

                return $this.each(function() {
                    var t = this,
                        c = (typeof selector !== 'undefined') ? $(t).find(selector) : $(t).children().first();
                    if (c.length === 1) {
                        c.contents().appendTo(t);
                        c.remove();
                    }
                });

            },

            cookies: {

                set: function(options) {

                    var now = new Date,
                        cookies = options.key + '=' + options.value;

                    now.setDate(now.getDate() + 1);

                    cookies += options.expires ? '; expires=' + now.toUTCString() : '';
                    cookies += options.path ? '; path=' + options.path : '';

                    return document.cookie = cookies;

                },

                get: function(key) {

                    var matches = document.cookie.match(new RegExp(
                        "(?:^|; )" + key.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
                    ));

                    return matches ? decodeURIComponent(matches[1]) : false;

                },

                remove: function(key) {

                    leaflet.helpers.cookies.set({ key: key, value: '', expires: -1 })

                }

            }

        };

        return {
            App: App
        };

    })(window);

    $.fn.leafLetPopUp = function(param) {

        var $body = $('body'),
            selector = this.selector;

        if (typeof param === 'object' || !param) {

            $(selector).data('leaflet', true);

            $body.on('click.leafletOpen', selector, function(e) {

                e.preventDefault();

                new LeafletPopup.App($(this), param || {}, 'init');

            });

            return this;

        } else {

            new LeafletPopup.App($(this), Array.prototype.slice.call(arguments, 1)[0] || {}, param);
            return this;

        }

    };

})(jQuery);