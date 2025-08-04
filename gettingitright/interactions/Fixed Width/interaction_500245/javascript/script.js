/*
<!-- Bullets Template Javascript -->
*/

var count;


// $(document).ready(function () {
//     PLAY_MODE = true;
//     buildLpInteraction();
// });

function buildBulletsInteraction() {
    if (PLAY_MODE == true) {

        //Hide bullet point text
        $('.bullet').hide();
        $('.bulletText').hide();
        $('.oatDropDownContainer').hide();
        $('.Tab_Instruction').text('Click anywhere in the interaction to show the next bullet point.');
        $('.PanelContainer').css('height', '450px');

        // Get number of bullets
        var total = $('.ddSelectBullets').children(':selected').attr('value');
        setUpBullets(total);

        //Show first bullet only
        var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        if (!isFirefox) { //firefox publish fix
            var bullet1Colour = $('.bullet1').css('background-color');
            $('.bullet1').css('background-color', 'transparent');
        }
        $('.bullet1').show();

        count = 1;
        $('.PanelContainer').on('click', function () {
            if (count <= total) {
                if (count == 1) {
                    $('.bullet1').css('background-color', bullet1Colour);
                }
                $('.bullet' + count).show();
                var transition = $('.ddSelectTransition').children(':selected').attr('value');
                switch (transition) {
                    case ('Show'):
                        $('.bulletText' + count).show(500);
                        break;
                    case ('FadeIn'):
                        $('.bulletText' + count).fadeIn(500);
                        break;
                    case ('SlideLeft'):
                        $('.bulletText' + count).show('slide', {
                            direction: 'left'
                        }, 500);
                        break;
                    case ('SlideRight'):
                        $('.bulletText' + count).show('slide', {
                            direction: 'right'
                        }, 500);
                        break;
                }
                count++;
            }
        });
    } else {

        $('.Tab_Instruction').text('Add text to reveal for each bullet point, the number of bullets and the transition can be changed using the drop down menus below.');
        $('.bullet').css('padding-top', '6px');

        //Transition change
        $('.ddSelectTransition').change(function () {
            var menu = $(this)
            $(this).children().each(function () {
                if ($(this).attr('value') == menu.children(':selected').attr('value')) {
                    $(this).attr('selected', true);
                } else {
                    $(this).attr('selected', false);
                }
            });
        });

        //When number of bullets changed
        $('.ddSelectBullets').change(function () {

            // Hide the existing layouts
            $('.bullet').hide();

            // Get the last selected item from the drop down. (Defaults to 4)
            var menu = $(this)
            $(this).children().each(function () {
                if ($(this).attr('value') == menu.children(':selected').attr('value')) {
                    $(this).attr('selected', true);
                } else {
                    $(this).attr('selected', false);
                }
            });

            // Get the value of the dropdown and save this as an integer
            var selectedNumber = parseInt($(this).find("option:selected").val());

            setUpBullets(selectedNumber);
            for (var i = 1; i <= selectedNumber; i++) {
                $('.bullet' + i).show();
            }

        }).change();
    }

    //Show different icon in IE, SVG not compatible
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) // If Internet Explorer, return version number
    {
        svgIE();
    }
}

function svgIE() {
    $('.SquareIcon').show();
    $('#circleSVGCont').hide();
}

// Show the correct number of bullets.
function setUpBullets(num) {
    var selectedHeight;
    switch (num) {
        case (1):
            selectedHeight = "428px"
            break;
        case (2):
            selectedHeight = "210px"
            break;
        case (3):
            selectedHeight = "140px"
            break;
        case (4):
            selectedHeight = "104px"
            break;
        case (5):
            selectedHeight = "82px";
            break;
        case (6):
            selectedHeight = "67px";
            break;
        case (7):
            selectedHeight = "57px";
            break;
        case (8):
            selectedHeight = "49px";
            break;
        case (9):
            selectedHeight = "43px";
            break;
        case (10):
            selectedHeight = "38px";
            break;
    }
    // Loop through the bullets and set the height
    for (var i = 1; i <= num; i++) {
        $('.bullet' + i).css("max-height", selectedHeight);
    }
}