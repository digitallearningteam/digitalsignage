/* Plugins and functions */
(function (window) {
    window.htmlutility = {
        //Converts a string to its html characters completely.
        encode: function (str) {
            var buf = [];

            for (var i = str.length - 1; i >= 0; i--) {
                buf.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
            }

            return buf.join('');
        },
        //Converts an html characterSet into its original character.
        decode: function (str) {
            return str.replace(/&#(\d+);/g, function (match, dec) {
                return String.fromCharCode(dec);
            });
        }
    };
})(window);


(function ($) {

    //Randomises the order of elements
    $.fn.shuffle = function () {
        var allElems = this.get(),
            getRandom = function (max) {
                return Math.floor(Math.random() * max);
            },
            shuffled = $.map(allElems, function () {
                var random = getRandom(allElems.length),
                    randEl = $(allElems[random]).clone(true)[0];
                allElems.splice(random, 1);
                return randEl;
            });

        this.each(function (i) {
            $(this).replaceWith($(shuffled[i]));
        });
        return $(shuffled);
    };

    //Calculates the width of text within an element
    $.fn.textWidth = function () {
        var html_org = $(this).html();
        var html_calc = '<span>' + html_org + '</span>';
        $(this).html(html_calc);
        var width = $(this).find('span:first').width();
        $(this).html(html_org);
        return width;
    };

    //Returns a random element from a selection
    $.fn.random = function () {
        return this.eq(Math.floor(Math.random() * this.length));
    }

    //Allows use of animate css via jquery function
    $.fn.extend({
        animateCss: function (animationName, callback) {
            var animationEnd = (function (el) {
                var animations = {
                    animation: 'animationend',
                    OAnimation: 'oAnimationEnd',
                    MozAnimation: 'mozAnimationEnd',
                    WebkitAnimation: 'webkitAnimationEnd',
                };

                for (var t in animations) {
                    if (el.style[t] !== undefined) {
                        return animations[t];
                    }
                }
            })(document.createElement('div'));

            this.addClass('animated ' + animationName).one(animationEnd, function () {
                $(this).removeClass('animated ' + animationName);

                if (typeof callback === 'function') callback();
            });

            return this;
        },
    });

})(jQuery);


//Show the complete interaction overlay and tells LAB Advanced to allow navigation
function CompleteInteraction(container, delay) {
    setTimeout(function () {
        $('.interaction-complete', container).fadeIn();
        $('.interaction-complete-text').addClass('animated tada');
        $('.nextButton').removeClass('navDisabled');
    }, delay);
}


// Show and Hide feedback box in EDIT MODE -- Add 'feedbackText' to toolbar button
function AddFeedback(container) {

    $('.feedbackText', container).off().on('click', function () {
        if ($('.interaction-complete', container).hasClass('show-feedback')) {
            $('.interaction-complete', container).hide().removeClass('show-feedback');
        } else {
            $('.interaction-complete', container).show().addClass('show-feedback');
        }
    })


    $('.interaction-complete', container).on('click', function () {
        if (PLAY_MODE == true) {
            $('.interaction-complete', container).hide().removeClass('show-feedback');
        }
    })
}


//Initialises any div with ckeditor_interaction class into an inline CKEditor
function SetupCKEditor(container) {
    ResetCKEditor(container);

    var id = (typeof container != 'undefined' && typeof container.attr('id') != 'undefined') ? container.attr('id') + '_' : '';
    var i = 1;

    $('.ckeditor_interaction', container).each(function () {

        if (!$(this).attr('id')) {
            $(this).attr('id', id + 'editor_' + i);
        }

        if (!CKEDITOR.instances[$(this).attr('id')]) {
            $(this).attr('contenteditable', 'true');
            var toolbar = $(this).attr('data-toolbar') ? $(this).attr('data-toolbar') : 'LABA';
            var interactionCK = CKEDITOR.inline($(this).attr('id'), {
                toolbar: toolbar
            });

            //Disable keyboard shortcuts when editing text
            interactionCK.on('focus', function (e) {

            });

            //Re-enable keyboard shortcuts when editor loses focus
            interactionCK.on('blur', function (e) {

            });
        }

        i++;
    });
}


//Removes any initialised ckeditor from divs with ckeditor_interaction class
function ResetCKEditor(container) {
    if (typeof CKEDITOR != 'undefined') {
        $('.ckeditor_interaction', container).each(function () {
            $(this).attr('contenteditable', 'false');
            if (CKEDITOR.instances[$(this).attr('id')]) {
                CKEDITOR.instances[$(this).attr('id')].destroy();
                $(this).removeAttr('id');
            }
        });
    }
}


//Removes content editable when published
function StopContentEdit() {
    $('.ckeditor_interaction').each(function () {
        $(this).attr('contenteditable', 'false');
    });
}