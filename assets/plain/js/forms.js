/*

 Copyright (c) 2015 Loginov Artem http://loginov.biz
 Dual licensed under the MIT license and GPL license

*/

var forms = (function(window, undefined) {

    'use strict';

    function init(namespace) {

        forms.styleControls(namespace + ' input[type="checkbox"], ' + namespace + ' input[type="radio"]', namespace + ' select');
        forms.makePlaceholders(namespace + ' [placeholder]');

        forms.validate(namespace);

    }

    function validate(namespace) {

        $(namespace + ' form').each(function() {

            var $form = $(this);

            if ($.isFunction($.fn.validate) && $form.data('checkup')) {

                $form
                    .validate({
                        onChange: true,
                        eachValidField: function() {

                            formNotifications.hideErrorLabel.call($(this));

                        },
                        eachInvalidField: function(status, options) {

                            var conditional = typeof $(this).data('conditionalType') !== 'undefined' ? formNotifications.labels.conditional[$(this).data('conditionalType')] : formNotifications.labels.conditional.default,
                                pattern = typeof $(this).data('patternType') !== 'undefined' ? formNotifications.labels.pattern[$(this).data('patternType')] : formNotifications.labels.pattern.default,

                                notification = (options.required) ? ((!options.conditional) ? conditional : (!options.pattern) ? pattern : '') : formNotifications.labels.required;

                            formNotifications.showErrorLabel.call($(this), notification, 0);

                        },
                        valid: function(e) {

                            var $form = $(this),
                                $btn = $(this).find('button[type="submit"].b-btn'),

                                validHandler = $(this).data('callback'),
                                xhrSubmit = $(this).data('xhr');

                            if(typeof window[validHandler] === 'function') {

                                e.preventDefault();
                                window[validHandler].call($form);

                                return false;

                            }

                            if(xhrSubmit) {

                                e.preventDefault();

                                $.ajax({
                                    url: $form.attr('action'),
                                    method: $form.attr('method'),
                                    data: $form.serialize(),
                                    dataType: 'json',
                                    beforeSend: function() {

                                        $btn.toggleClass('request');

                                    },
                                    success: function(response) {

                                        $btn.toggleClass('request');
                                        xhrFormHandler.response.call($form, response);

                                    }
                                });

                            }

                        }

                    })
                    .find('input, textarea').on('focus', function() {

                        $(this).closest('.m-error').removeClass('m-error');

                    });

            }

        });

    }

    function styleControls(input, select, file) {

        if ($.isFunction($.fn.uniform)) {

            // Inputs
            $(input).not('.b-pricing_switcher input').uniform();

            // Select
            if(typeof select !== 'undefined') {

                $(select).uniform({
                    selectClass: 'e-select',
                    selectAutoWidth: false
                });

            }

        }

    }

    function makePlaceholders(selector) {

        if ($.isFunction($.fn.placeholder)) {

            $(selector).placeholder();

        }

    }

    return {
        init: init,
        makePlaceholders: makePlaceholders,
        styleControls: styleControls,
        validate: validate
    };

})(window);

// Notifications system
var formNotifications = (function(window, undefined) {

    'use strict';

    var settings = {
        errorClass: 'm-error',
        errorSuffix: '_error'
    };

    var labels = {
        required: 'This is required field',
        conditional: {
            default: 'Input does not coincide',
            credit: 'Invalid credit card number',
            passwords: 'The passwords entered do not match'
        },
        pattern: {
            default: 'Invalid data format',
            email: 'Invalid email address',
            phone: 'Invalid phone number'
        },
        submit: {
            success: 'Thank you. We will contact you shortly.',
            error: 'Error.'
        }
    };

    // Notification alerts
    function showMessage(msg, status, hideForm, callback) {

        var $notice = this.find('.b-form_message').length ? this.find('.b-form_message') : $('<div class="b-form_message"></div>').prependTo(this),
            suffix = status ? 'success' : 'error';

        // Set height
        $notice
            .height($notice.height())
            .html('<div class="b-form_message_inner"><div class="b-form_message_balloon b-form_message_balloon__' + suffix + '">' + msg + '</div></div>');

        $notice
            .toggleClass('b-form_message__show', true)
            .animate({ height: $notice.find('.b-form_message_inner').height(), paddingBottom: hideForm ? 0 : $notice.css('padding-bottom') }, 200, 'easeOutQuart', function() {

                $(this).css({ height: '' });

            });

        if (hideForm) {

            $notice
                .next('form')
                .toggleClass('b-form__hide', true)
                .slideUp({ duration: 300, easing: 'easeOutQuart' });

        }

        // Callback
        if(typeof callback === 'function') {

            callback.call(this);

        }

    }

    function hideMessage() {

        var $notice = this.find('.b-form_message').length ? this.find('.b-form_message') : $('<div class="b-form_message"></div>').prependTo(this);

        $notice
            .slideUp({duration: 300, easing: 'easeOutQuart' });

    }

    // Notification labels
    function showErrorLabel(text, status) {

        var $field = this.closest('.b-form_box_field');
        $field.find('.b-form_box_field' + settings.errorSuffix).remove();

        $field.append('<div class="b-form_box_field' + settings.errorSuffix + '">' + text + '</div>');

        setTimeout(function() {

            $field.addClass(settings.errorClass);

        }, 100);

    }

    function hideErrorLabel() {

        var $field = this.closest('.b-form_box_field');

        $field.removeClass(settings.errorClass);
        $field.find('.b-form_box_field' + settings.errorSuffix).remove();

    }

    return {
        labels: labels,
        showErrorLabel: showErrorLabel,
        showMessage: showMessage,
        hideErrorLabel: hideErrorLabel,
        hideMessage: hideMessage
    };

})(window);


// Regular form handler
var xhrFormHandler = (function(window, undefined) {

    'use strict';

    function response(response) {

        var $form = this,
            message = '';

        // start check
        if (typeof response.fields === 'boolean' && response.fields) {

            if(response.captcha) {

                // Success action
                message = response.msg || formNotifications.labels.submit.success;
                formNotifications.showMessage.call(this.closest('.b-form'), message, true, response.hideForm);

            } else {

                // Captcha error action
                message = response.msg || formNotifications.labels.submit.error;
                captchaHandler.call(this, response);

            }

        } else if (typeof response.fields === 'object') {

            // Get error message string
            var messageStr = ' Некорректно заполнены поля: ';

            $.each(response.fields, function(key, value) {

                var fieldName = $form.find('[name="' + key + '"]').attr('placeholder') || $form.find('[name="' + key + '"]').closest('.b-form_box').find('.b-form_box_title').text().replace(' *', '');

                messageStr += '&laquo;' + fieldName + '&raquo;, ';

            });

            message = response.msg || formNotifications.labels.submit.error + messageStr.substring(0, messageStr.length - 2) + '.';

            // Init handlers
            captchaHandler.call(this, response);

            formNotifications.showMessage.call(this.closest('.b-form'), message, false, false, function(form) {

                highlightFields($form, response.fields);

            });

        } else {

            if ('console' in window) {
                console.log('Invalid response format form handler');
                console.log(response);
            }

        }

    }

    function highlightFields(form, array) {

        $.each(array, function(key, value) {

            formNotifications.showErrorLabel.call(form.find('[name="' + key + '"]'), value, 0);

        });

    }

    function captchaHandler(response) {

        this.find('[name*="captcha"]').val('');
        this.find('img').attr('src', response.captchaImg);

        if(!response.captcha) {

            formNotifications.showErrorLabel.call(this, forms.msg.captcha, 0);

        }

    }

    return {
        response: response
    };

})(window);


// Mail Chimp handler
var mailChimp = function() {

    'use strict';

    var $form = this;

    $.ajax({
        url: $form.attr('action'),
        method: $form.attr('method'),
        data: $form.serialize(),
        dataType: 'json',
        success: function(response) {

            var message;

            if (response.status != 'error') {

                message = '' +
                '<h3>Дякуємо,</h3>' +
                '<p>що підписались на нашу розсилку</p>';

                formNotifications.showMessage.call($form.closest('.b-form'), message, true, true);

            } else {

                message = '' +
                '<h3>Упс</h3>' +
                formNotifications.labels.pattern.email;

                formNotifications.showMessage.call($form.closest('.b-form'), message, false, false);

            }

        }
    });

};
