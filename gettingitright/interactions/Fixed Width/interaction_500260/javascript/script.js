/*
<!-- Accordion Template Javascript -->
<!-- Tom Kirkman -->
*/

var TOTAL_SECTIONS = 8;
var countCorrect = 0;

// var PLAY_MODE = true;
// $(document).ready(function () {
//     buildLpInteraction();
// });

function buildAccordionInteraction() {
    for (i = 1; i <= TOTAL_SECTIONS; i++) {
        if ($('.Accordion_Header' + i).hasClass('current')) {
            $('.Accordion_Header' + i).removeClass('current');
        }
    }

    if (PLAY_MODE == true) {
        //Build Accordion
        BuildAccordion();
        
        $(".Accordion_Main").css('overflow', 'unset');
        $('.oatTemplateInstructionText').css('width', '');
        $('.Tab_Instruction').text('Click on each of the headings below to reveal more information.');

        //Check if there are any empty fields and remove them if there is
        $('.Accordion_Main h3').each(function () {
            if ($(this).text().replace(/\s+/g, '') === '') {
                for (i = 1; i <= TOTAL_SECTIONS; i++) {
                    if ($(this).hasClass('Accordion_Header' + i)) {
                        $('.Accordion_Header' + i).remove();
                        $('.Panel' + i).remove();
                    }
                }
            }
        });

    } else {
        $(".Accordion_Main").css('overflow', 'hidden');
        $('.Tab_Instruction').text('Add headers and text content to the accordion below. Leave the header text blank to hide a section');
        $('.oatTemplateInstructionText').css('width', '832px');

        BuildAccordion();
    }
}

/* Accordion ----------------------------------------------------------------------------------- */

function BuildAccordion() {

    //  Accordion Panels
    $(".Accordion_Main .Accordion_Panel").show();

    try {
        $(".Accordion_Main").accordion('destroy');
    } catch (e) {

    }

    //Setup accordion
    $(".Accordion_Main").accordion({
        collapsible: true,
        active: false,
        animate: 200,
        heightStyle: "fill",
        icons: false
    });

    //Show tick icon once section has been clicked on
    $(".Accordion_Main h3").on('click', function () {
        if (PLAY_MODE == true) {
            $(this).addClass('SelectedPanel');
        } else {}
    });

    /* For some reason using .accordion() doesn't allow typing spaces into the accordion headers.
       This is a workaround which manually adds a space when typed. */
    $('.Accordion_Input').off();
    $('.Accordion_Input').on('keydown', function (e) {
        var keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == 32) {
            var textBox = $(this);
            var currentPosition = $(textBox)[0].selectionStart;
            var text = $(textBox).val();
            $(textBox).val(text.substring(0, currentPosition) + ' ' + text.substring(currentPosition));
            $(textBox).selectRange(currentPosition + 1, currentPosition + 1);
        }
    });
}


// Sets the position of the curor
$.fn.selectRange = function (start, end) {
    if (end === undefined) {
        end = start;
    }
    return this.each(function () {
        if ('selectionStart' in this) {
            this.selectionStart = start;
            this.selectionEnd = end;
        } else if (this.setSelectionRange) {
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};
