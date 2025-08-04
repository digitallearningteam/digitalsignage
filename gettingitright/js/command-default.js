//learnPro Command Framework (c)

//Module variables
var content; //Content from com/laba_content.xml
var assessment; //Assessment xml from com/lPAssessment.xml
var totalPages; //Total number of pages in the module on load
var currentPageIndex; //User's current page - can be populated by SCORM api bookmark on load
var currentPage; //jQuery object of current page
var furthestPage = 0; //Furthest page user has navigated to in the module
var navAnimation = ""; //Which animation to use to slide in page depending on navigation direction
var headerLoaded = false; //Check if the header elements have finished animating
var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
var audioAnimation;
var accessibilityColour = '';
var accessibilitySize = '';
var skipMenuOverride = false;

/*
 * BUILD MODULE
 */

//Triggered when the script has been loaded via defaults.js
function loadStart() {

    //Load XML - buildModule is called on complete
    loadXML(defaults.XMLsource);

    //Apply skin - loads properties from defaults.js
    applySkin();

    // Initialise SCORM API if not running locally
    if (defaults.OutputType == "SCORM") {
        if (window.location.href.indexOf('127.0.0.1') == -1 && window.location.href.indexOf('localhost') == -1) {
            LPInitialize();
        }
        SetupAccessibility();
    }

    // Set up navigation buttons
    $('.nextButton').on('click', {
        'dir': 'next'
    }, navHandler);
    $('.backButton').on('click', {
        'dir': 'back'
    }, navHandler);
}

//Apply skin - doesn't require any information from xml on defaults.js
function applySkin() {

    //Custom colours
    if (defaults.NavColour1 != '#ffffff') {
        $('head').append('<style type="text/css">.accent-color-text { color: ' + defaults.NavColour1 + ' !important; } .accent-color-border { border-color: ' + defaults.NavColour1 + ' !important; } .accent-color-background { background-color: ' + defaults.NavColour1 + ' !important; }</style>');
    }
    else {
        $('head').append('<style type="text/css">.accent-color-text { color: ' + defaults.NavColour2 + ' !important; } .accent-color-border { border-color: ' + defaults.NavColour2 + ' !important; } .accent-color-background { background-color: ' + defaults.NavColour2 + ' !important; }</style>');
    }

    //Background colour
    $('.ContainerBackground').append('<div id="ProjectBackground" style="background-color:' + defaults.BackgroundColour1 + '; background:linear-gradient(to bottom, ' + defaults.BackgroundColour1 + ', ' + defaults.BackgroundColour2 + ');"></div>');

    //Background image
    if (defaults.Background != 'none') {
        $('#ProjectBackground').append('<img src="' + defaults.Background + '" alt="Background Image" style="display:none" />');
    }

    //Logo image
    $('#projectLogo').attr('src', defaults.Logo);

    //Fonts
    $('body').addClass(defaults.Font + ' size' + defaults.FontSize);

    //Nav bar colour
    $('#navigation').css({
        'background-color': defaults.NavColour1,
        'background': 'linear-gradient(to right, ' + defaults.NavColour1 + ', ' + defaults.NavColour2 + ')'
    });

    //Note bar colour
    $('.open_note_button').css({
        'color': defaults.NavColour1,
    });


    //Change progress container colour if nav bar colour is white otherwise progress bar is invisible
    if (defaults.NavColour2 == '#ffffff') {
        $('.progressBar').css('background', defaults.AccentColour1);
        $('.navButton').css({
            'color': '#000',
            'padding': '5px 8px',
            'background': '' + defaults.AccentColour1 + ''
        });
    } else {
        $('.progressBar').css('background', defaults.HeaderColour1);
    }

    //Show header if not on small screen devices
    if ($(window).width() > 800) {
        $('.HeaderInfo').css('color', defaults.FontColour1);
        $('#header').show().animateCss('slideInDown', function () {
            $('#navigation').show().animateCss('slideInLeft', function () {
                $('.progressSection').fadeIn(300);
            });
            headerLoaded = true;
            setTimeout(AnimatePage, 1000);
        });

    } else {
        $('#header').css('display', '');
        $('#navigation').show().animateCss('slideInLeft');
        headerLoaded = true;
        setTimeout(AnimatePage, 1000);
    }

    //Show background image
    $('.ContainerBackground img').fadeIn(1000);

    //Show accessibility options
    if (defaults.OutputType == "SCORM") {
        $('.FontSettingContainer').fadeIn(1000);
    }

}


//Triggered once the xml has loaded -  starts to build the module content
function buildModule() {

    //Store the total number of pages in the module
    totalPages = $(content).find('page').length;

    //Pre-load all images then remove to increase page load times
    imagePreloader();

    //Get bookmarked location from SCORM api
    if (defaults.OutputType == "SCORM") {
        var pageBookmark = GetBookmark();
        if (pageBookmark) {
            currentPageIndex = parseInt(pageBookmark);

            //Check if opening on last page and reset to beginning
            if (currentPageIndex == (totalPages - 1)) {
                currentPageIndex = 0;
                skipMenuOverride = true;
            }

        } else {
            currentPageIndex = 0;
        }
    }
    else {
        currentPageIndex = 0;
    }

    //Build module navigation menu
    buildMenu();

    //If the menu is visible to the user then build it
    if (defaults.ShowMenu === 'False') {
        $('.ModuleMenu').hide();
        $('.menu-button').hide();
    }

    //Load page
    changePage(currentPageIndex);

    //Show content warning overlay
    if ($(content).find('content[type="video"]').length > 0 || $(content).find('content[type="audio"]').length > 0) {
        $('.PlayerOverlay, .PlayerMessage').fadeIn(300);
        $('.PlayerOverlay').css('background', '#3c3c3c');
        $('.MessageStartButton').delay(1000).fadeIn(1000);
        $('.MessageStartButton').click(function () {
            $('.PlayerOverlay, .PlayerMessage').fadeOut(300);
        });
    }
    else {
        $('.PlayerOverlay, .PlayerMessage').hide();
    }

    //Show content warning for audio/video
    if ($(content).find('content[type="video"]').length > 0 && $(content).find('content[type="audio"]').length > 0) {
        $('.PlayerMessage').append('This module contains audio & video.');
        $('.videoIcon').css('margin-left', '50px');
        $('.videoIcon').animateCss('slideInRight');
        $('.audioIcon').animateCss('slideInLeft');
        //Video
    } else if ($(content).find('content[type="video"]').length > 0) {
        $('.PlayerMessage').append('This module contains video.');
        $('.audioIcon').hide();
        $('.videoIcon').animateCss('slideInRight');
        //Audio
    } else if ($(content).find('content[type="audio"]').length > 0) {
        $('.PlayerMessage').append('This module contains audio.');
        $('.videoIcon').hide();
        $('.audioIcon').animateCss('slideInLeft');
    }
}


//changePage - works out the page type and passes information to the appropriate handler
function changePage(pageNumber) {

    //Remove existing players
    $('.video-js').each(function () {
        var player = $(this).attr('id');
        videojs(player).dispose();
    });

    // Get the node for the currentPage
    currentPage = $(content).find('page')[pageNumber];
    currentPage = $(currentPage);

    //Enable or disable the navigation buttons
    checkNavigation();

    //Update progress bar
    $('.progressBar').css('width', (100 * (currentPageIndex / (totalPages - 1))) + '%');

    //Update section name in nav title
    if (currentPage.attr('section') == 'true')
        $('#projectHeader').html(currentPage.find('sectionTitle').text());
    else
        $('#projectHeader').html(currentPage.find('sectionTitle').text() + ' - ' + currentPage.find('title').text());

    //Set navigation bar text colour
    $('#projectHeader').css('color', defaults.FontColour2);

    //Build and write the content to the page
    buildPage();

    if (defaults.OutputType == "SCORM") {
        //SCORM - Set current location in module
        SetBookmark(pageNumber);

        //SCORM - Check module completion
        if (currentPageIndex === (totalPages - 1)) {
            SetModuleComplete();
        }

        //SCORM - Record that user has visited page
        var pageCount = LPGetValue("cmi.suspend_data") == '' ? 0 : parseInt(LPGetValue("cmi.suspend_data"));
        pageCount++;
        LPSetValue("cmi.suspend_data", pageCount);
    }

    //Apply theme styles
    $('.QuestionContent .accent-color-border').css('border-color', defaults.HeaderColour1);
    $('.QuestionContent .accent-color-text').css('color', defaults.HeaderColour1);

    //Add click event for content block notes
    $('.ContentBlock').off('click').click(function (e) {
        if ($(e.target).hasClass('open_note_button')) {
            var noteId = $(e.target).attr('data-id');
            ShowNote(noteId);
        }
    });

    AnimatePage();
}

//Animate page in
function AnimatePage() {
    //Scroll to top of page
    setTimeout(function () {
        $('body, .PlayerContainer').scrollTop(0);
    }, 100);

    //Don't show animations in IE or for interactions
    var interactions = $('.PlayerContainer').find('.TemplateContent').length;
    if (detectIE() || interactions > 0 || defaults.Animations == "False")
        navAnimation = "none";

    if (headerLoaded == true) {
        if (navAnimation == "next") {
            $('.PlayerContainer').show().animateCss('slideInRight');
        } else if (navAnimation == "back") {
            $('.PlayerContainer').show().animateCss('slideInLeft');
        } else {
            $('.PlayerContainer').fadeIn(500);
        }

        if (defaults.LayoutType == "block")
            BlockTransitions();
    }

    //Show page audio
    if (!$('.AudioContainer').is(':visible')) {
        setTimeout(function () {
            $('.AudioContainer').stop().show().animateCss('slideInRight');
        }, 500);
    }
}


/*
 * NAVIGATION
 */

//Builds the user menu
function buildMenu() {

    var skipMenu = (defaults.SkipMenu == "True" || skipMenuOverride) ? "" : " disabled";
    var sectionCount = 1;

    //Add pages and sections to menu
    $(content).find('page').each(function () {

        var pageId = $(this).attr('id');
        var sectionId = ($(this).attr('sectionId') != null) ? $(this).attr('sectionId') : $(this).attr('id');
        var pageName = $(this).find('title').text();

        //If section
        if ($(this).attr('section') == 'true') {

            //Add section item
            $('.MenuSectionsInner').append('<div class="SectionItem ' + skipMenu + '" data-page-id="' + pageId + '" data-section-id="' + pageId + '"><div class="SectionItemInner"><span class="SectionOrder"><span>' + sectionCount + '</span></span><span class="SectionName"><span class="SectionNameText">' + pageName + '</span></span></div></div>');

            //Add section shortcut to progress bar
            var position = (100 * (sectionId / (totalPages - 1))) - 0.3;
            $('.progressContainer').append('<div class="progressSection ' + skipMenu + '" style="left: ' + position + '%;" data-page-id="' + sectionId + '" title="Section: ' + pageName + '"><i class="fas fa-map-marker accent-color-text"></i></div>');

            //Increment section for order number
            sectionCount++;
        }

        //Add page item
        $('.MenuPagesInner').append('<div class="PageItem ' + skipMenu + '" data-page-id="' + pageId + '" data-section-id="' + sectionId + '"><div class="PageItemInner"><span class="PageName">' + pageName + '</span></div></div>');
    });


    //Expand sections button
    $('.ExpandSectionMenu').off().click(function () {
        var sections = $(this).closest('.MenuSections');
        if (sections.attr('data-open') == 'false') {
            sections.css('width', '100%');
            sections.attr('data-open', 'true');
        } else {
            sections.css('width', '70px');
            sections.attr('data-open', 'false');
        }
    });


    //Change page when section/page is clicked
    $('.PageItem, .SectionItem, .progressSection').on('click', function () {

        //Get new page number
        currentPageIndex = parseInt($(this).attr('data-page-id'));

        //Change page content
        changePage(currentPageIndex);

        MenuSelections();

        //Auto close menu on mobile
        if (mobile && $('.menu-button').hasClass('open')) {
            $('.menu-button').removeClass('open');
            $('.menu-button').find('span').text('OPEN MENU');
            $('.ModuleMenu').show().animateCss('bounceOutRight', function () {
                $('.ModuleMenu').hide();
            });
        }
    });


    //Click to open menu
    $('.menu-button').on('click', function () {
        if ($(this).hasClass('open')) {
            $(this).removeClass('open');
            $(this).find('span').text('OPEN MENU');

            $('.ModuleMenu').show().animateCss('bounceOutRight', function () {
                $('.ModuleMenu').hide();
            });
        } else {
            $(this).addClass('open');
            $(this).find('span').text('CLOSE MENU');
            $('.ModuleMenu').show().animateCss('bounceInRight');
        }
    });


    //Click to close menu
    $('.menu-close').on('click', function () {
        $('.menu-button').removeClass('open');
        $('.menu-button').find('span').text('OPEN MENU');
        $('.ModuleMenu').show().animateCss('bounceOutRight', function () {
            $('.ModuleMenu').hide();
        });
    });


    //Make menu draggable
    if (!mobile)
        $('.ModuleMenu').draggable();


    //Get first selected page
    MenuSelections();
}


//Show current selected section and page in menu
function MenuSelections() {
    var currentPage = $('.PageItem[data-page-id="' + currentPageIndex + '"]');
    var currentSectionId = currentPage.attr('data-section-id');
    var currentSection = $('.SectionItem[data-page-id="' + currentSectionId + '"]');

    //Show pages for current section in page menu
    $('.PageItem').not('[data-section-id="' + currentSectionId + '"]').hide();
    $('.PageItem[data-section-id="' + currentSectionId + '"]').fadeIn();

    //Add selected indicator to section number and page
    $('.SectionItem, .PageItem, .SectionOrder').removeClass('selected accent-color-background');
    currentSection.addClass('selected');
    currentSection.find('.SectionOrder').addClass('accent-color-background');
    currentPage.addClass('selected accent-color-background');

    //Enable menu items once user has navigated passed them
    currentPage.removeClass('disabled');
    currentSection.removeClass('disabled');

    //Fade in progress bar section indicators if user has navigated passed them
    $('.progressSection').each(function () {
        if (currentPageIndex >= $(this).attr('data-page-id')) {
            $(this).addClass('passed');
            $(this).removeClass('disabled');
        } else {
            $(this).removeClass('passed');
        }
    });
}


//navHandler - handles next and back navigation clicks
function navHandler(e) {
    // Prevent link behaviour
    e.preventDefault();

    // If it isnt disabled
    if (!$(e.target).closest('.navButton').hasClass('navDisabled') && $('.PlayerContainer.animated').length == 0) {

        //Animate button
        $(e.target).closest('.navButton').find('i').animateCss('tada');

        // Get direction
        if (e.data.dir === 'next') {
            navAnimation = "next";
            currentPageIndex++;
            if (currentPageIndex > furthestPage) {
                furthestPage = currentPageIndex;
            }
        } else {
            navAnimation = "back";
            currentPageIndex--;
        }

        // Go to that page
        changePage(currentPageIndex);

        //Update selected page in menu
        MenuSelections();
    }
}

//checkNavigation - checks that learner is within navigable range
function checkNavigation() {
    // Enable both buttons
    $('.nextButton, .backButton').removeClass('navDisabled');

    // If first or last page, add display styles
    if (parseInt(currentPageIndex) === 0) {
        $('.backButton').addClass('navDisabled');
    }
    if (parseInt(currentPageIndex) === (totalPages - 1)) {
        $('.nextButton').addClass('navDisabled');
    }
}

//Reset module if no score on assessment summary page
function ResetModule() {
    currentPageIndex = 0;
    skipMenuOverride = true;

    setTimeout(function () {
        $('.PlayerContent').empty();
        changePage(currentPageIndex);
        $('.SectionItem, .PageItem').removeClass('disabled');
    }, 100);
}


/*
 * ASSESSMENT
 */

//Checks whether selected answers are correct then updates SCORM response
function CheckAnswers() {
    if (assessment) {

        //Number of correct answers the user has selected for a question
        var correctCount = 0;

        //Number of attempts a user has had to choose the correct answer
        var attempts = 0;

        //When an answer is selected
        $('.QuestionContent .answer-accordion').off().click(function () {
            var block = $(this).closest('.ContentBlock');
            var header = $(this).find('.answer-header');
            var answer = $(this).find('.answer');
            var questionId = $(answer).attr('data-questionid');
            var answerId = $(answer).attr('data-answerid');

            //Total number of correct answers for this question
            var totalCorrect = $(assessment).find('Question[LABQuestionId="' + questionId + '"]').find('Answer[IsCorrect="True"]').length;

            //Check if answer is correct
            var answerCorrect = $(assessment).find('Question[LABQuestionId="' + questionId + '"]').find('Answer[LABAnswerId="' + answerId + '"]').attr('IsCorrect');

            //If the answer is correct increase correct count
            if (answerCorrect == "True") {
                $(header).css('border-color', '#24a558');
                $(this).addClass('correct');
                correctCount++;
            } else {
                $(header).css('border-color', '#d24444');
            }

            //Increase attempts regardless of answer
            attempts++;

            //Show feedback
            var feedback = $(assessment).find('Question[LABQuestionId="' + questionId + '"]').find('Answer[LABAnswerId="' + answerId + '"]').attr('Feedback');
            var textArea = document.createElement('textarea');
            textArea.innerHTML = feedback.replace('<![CDATA[', '').replace(']]>', '');
            $(this).append('<div class="answer-feedback">' + textArea.value + '</div>');

            //Slide down feedback
            $(this).find('.answer-feedback').slideToggle();
            $(this).addClass('selected');

            //Disable further click events on this answer
            $(this).off();

            //Once all correct answers (or attempts equalling the number of correct answers for assessed modules) are selected end the question
            if ((defaults.ScoringMethod == "Assessed" && attempts == totalCorrect) || correctCount == totalCorrect) {
                $('.answer-accordion:not(.correct)', block).css('opacity', '0.9');
                $('.answer-accordion', block).off();

                //Allow forward navigation if not end of module
                if (parseInt(currentPageIndex) != (totalPages - 1)) {
                    $('.nextButton').removeClass('navDisabled');
                    correctCount = 0;
                    attempts = 0;
                }
            }

            //SCORM
            if (defaults.OutputType == "SCORM") {
                if (CheckAnswerIsComplete(questionId) === false) {
                    AddInteractionResponse(questionId, answerId);
                }
            }
        });


        //Setup free text question
        $('.FreeTextSubmitButton').off().click(function () {
            var feedback = $(this).closest('.QuestionContent').find('.free-text-feedback');
            feedback.slideToggle(300);

            //Allow forward navigation if not end of module
            setTimeout(function () {
                if (parseInt(currentPageIndex) != (totalPages - 1)) {
                    $('.nextButton').removeClass('navDisabled');
                }
            }, 1000);
        });
    }
}


/*
 * ACCESSIBILITY OPTIONS
 */
function SetupAccessibility() {
    $('.AccessibilityButton').css('background', 'linear-gradient(45deg, ' + defaults.NavColour1 + ', ' + defaults.NavColour2 + ')');

    $(".FontSettingContainerFooter ").draggable();
    var isDragging = false;
    $(".AccessibilityButton")
        .mousedown(function () {
            $(window).mousemove(function () {
                isDragging = true;
                $(window).unbind("mousemove");
            });
        })
        .mouseup(function () {
            var wasDragging = isDragging;
            isDragging = false;
            $(window).unbind("mousemove");
            if (!wasDragging) {
                $('.FontSettingContainer').toggleClass('selected');
            }
        });

    //Font size
    $('.FontSmallButton').off().click(function (e) {
        $('.PlayerContainer').removeClass('FontExtraLargeSetting').removeClass('FontLargeSetting');
        $('.TemplateContent iframe').contents().find('.interaction-container').removeClass('FontExtraLargeSetting').removeClass('FontLargeSetting');
        $('.TemplateContent iframe').contents().find('body').removeClass(defaults.Font + ' size' + defaults.FontSize);
        accessibilitySize = 'FontSmallButton';
    });
    $('.FontMediumButton').off().click(function (e) {
        $('.PlayerContainer').removeClass('FontExtraLargeSetting').addClass('FontLargeSetting');
        $('.TemplateContent iframe').contents().find('.interaction-container').removeClass('FontExtraLargeSetting').addClass('FontLargeSetting');
        $('.TemplateContent iframe').contents().find('body').removeClass(defaults.Font + ' size' + defaults.FontSize);
        accessibilitySize = 'FontMediumButton';
    });
    $('.FontLargeButton').off().click(function (e) {
        $('.PlayerContainer').removeClass('FontLargeSetting').addClass('FontExtraLargeSetting');
        $('.TemplateContent iframe').contents().find('.interaction-container').removeClass('FontLargeSetting').addClass('FontExtraLargeSetting');
        $('.TemplateContent iframe').contents().find('body').removeClass(defaults.Font + ' size' + defaults.FontSize);
        accessibilitySize = 'accessibilitySize';
    });

    //Contrast colours
    $('.FontStandardButton').off().click(function (e) {
        $('.PlayerContainer').removeClass('FontBlackSetting').removeClass('FontBlueSetting').removeClass('FontGreySetting').removeClass('FontYellowSetting').addClass('FontBlackSetting');
        $('.TemplateContent iframe').contents().find('.interaction-container').removeClass('FontBlackSetting').removeClass('FontBlueSetting').removeClass('FontGreySetting').removeClass('FontYellowSetting').addClass('FontBlackSetting');
        accessibilityColour = 'FontStandardButton';
    });
    $('.FontBlueButton').off().click(function (e) {
        $('.PlayerContainer').removeClass('FontBlackSetting').removeClass('FontBlueSetting').removeClass('FontGreySetting').removeClass('FontYellowSetting').addClass('FontBlueSetting');
        $('.TemplateContent iframe').contents().find('.interaction-container').removeClass('FontBlackSetting').removeClass('FontBlueSetting').removeClass('FontGreySetting').removeClass('FontYellowSetting').addClass('FontBlueSetting');
        accessibilityColour = 'FontBlueButton';
    });
    $('.FontGreyButton').off().click(function (e) {
        $('.PlayerContainer').removeClass('FontBlackSetting').removeClass('FontBlueSetting').removeClass('FontGreySetting').removeClass('FontYellowSetting').addClass('FontGreySetting');
        $('.TemplateContent iframe').contents().find('.interaction-container').removeClass('FontBlackSetting').removeClass('FontBlueSetting').removeClass('FontGreySetting').removeClass('FontYellowSetting').addClass('FontGreySetting');
        accessibilityColour = 'FontGreyButton';
    });
    $('.FontYellowButton').off().click(function (e) {
        $('.PlayerContainer').removeClass('FontBlackSetting').removeClass('FontBlueSetting').removeClass('FontGreySetting').removeClass('FontYellowSetting').addClass('FontYellowSetting');
        $('.TemplateContent iframe').contents().find('.interaction-container').removeClass('FontBlackSetting').removeClass('FontBlueSetting').removeClass('FontGreySetting').removeClass('FontYellowSetting').addClass('FontYellowSetting');
        accessibilityColour = 'FontYellowButton';
    });

    //Reset
    $('.FontResetButton').off().click(function (e) {
        $('.PlayerContainer').removeClass('FontExtraLargeSetting').removeClass('FontLargeSetting').removeClass('FontBlackSetting').removeClass('FontBlueSetting').removeClass('FontGreySetting').removeClass('FontYellowSetting');
        $('.TemplateContent iframe').contents().find('.interaction-container').removeClass('FontExtraLargeSetting').removeClass('FontLargeSetting').removeClass('FontBlackSetting').removeClass('FontBlueSetting').removeClass('FontGreySetting').removeClass('FontYellowSetting');
        $('.TemplateContent iframe').contents().find('body').addClass(defaults.Font + ' size' + defaults.FontSize);
        accessibilitySize = '';
        accessibilityColour = '';
    });

    //Print
    $('.AccessibilityPrintButton').off().click(function (e) {
        $('.PlayerContainer').hide();
        var output = '';

        //Loop through each page
        $(content).find('page').each(function () {

            //Create page element
            output += '<div id="Page_' + $(this).attr('id') + '" class="PrintPage">';

            //Loop through page content and add to page
            $(this).find('content').each(function () {
                switch ($(this).attr('type')) {
                    case ('text'):
                        var textContent = $(this).find('text');
                        var text = $(textContent).text();
                        output += '<div class="ContentBlock TextContent">' + htmlUnescape(text) + '</div>';
                        break;
                    case ('image'):
                        var imageContent = $(this).find('image');
                        var src = $(imageContent).text();
                        output += '<div class="ContentBlock ImageContent"><img src="' + src + '" /></div>';
                        break;
                    case ('question'):
                        var questionHtml = $(this).find('question').text();
                        output += '<div class="ContentBlock QuestionContent">' + htmlUnescape(questionHtml) + '</div>';
                        break;
                    case ('template'):
                        var interactionContent = $(this).find('interaction');
                        var src = $(interactionContent).text();
                        output += '<div class="ContentBlock TemplateContent"><iframe src="' + src + '" frameborder="0" scrolling="no" width="100%" data-navcolour="' + defaults.NavColour1 + '"></iframe></div>';
                        break;
                }
            });

            //Close page div
            output += '</div>';
        });

        //Open new window with printable version
        var newWin = window.open('', 'Print-Window');
        newWin.document.open();
        newWin.document.write('<html><head><title>' + defaults.Name + ' - Print</title><link rel="stylesheet" type="text/css" href="css/print.css" /><link rel="stylesheet" href="https://use.typekit.net/pyw6rip.css"/></head><body><div class="PrintSettings"></div>' + output + '<script src="js/jquery-1.9.1.min.js" type="text/javascript"></script><script src="js/iframeResizer.min.js" type="text/javascript"></script><script src="js/print.js" type="text/javascript"></script></body></html>');
        newWin.document.close();
        $('.PlayerContainer').show();
    });

    //Navigation keys
    $(document).keydown(function (e) {
        switch (e.which) {
            case 37: // left
                $(".backButton").trigger("click");
                break;

            case 38: // up
                break;

            case 39: // right
                $(".nextButton").trigger("click");
                break;

            case 40: // down
                break;

            default: return; // exit this handler for other keys
        }
        e.preventDefault(); // prevent the default action (scroll / move caret)
    });
}



/*
 * UTILITY
 */

var isLoading = false;

function ShowLoading() {
    if (!isLoading) {
        $('.LoadingContainer').show();
        $('.LoadingImage').fadeIn(300);
        isLoading = true;
    }
}

function HideLoading() {
    $('.LoadingContainer').fadeOut(300);
    $('.LoadingImage').fadeOut(300);
    isLoading = false;
}

function EndModule() {
    ShowLoading();

    //SCORM
    if (defaults.OutputType == "SCORM")
        LPFinish();
}

function htmlUnescape(value) {
    var textArea = document.createElement('textarea');
    textArea.innerHTML = value;
    return textArea.value;
}

//Image Preloader - Loads all of the images and then deletes them. This will put it on the cache of the user and increase image loading
function imagePreloader() {
    var createdImages = [];

    //Add index of definition for IE8 compatibility
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (elt /*, from*/) {
            var len = this.length >>> 0;
            var from = Number(arguments[1]) || 0;
            from = (from < 0) ? Math.ceil(from) : Math.floor(from);
            if (from < 0)
                from += len;

            for (; from < len; from++) {
                if (from in this &&
                    this[from] === elt)
                    return from;
            }
            return -1;
        };
    }

    //For each page add background images and content images to image preload element
    for (i = 0; i < totalPages + 1; i++) {
        var tempPage = $(content).find('page')[i];
        var $blocks = $(tempPage).find('block');

        //Get image content block images
        $blocks.each(function () {
            var $block = $(this);
            if ($(this).attr('contentType') == 'image') {
                var imageSource = $block.find('imageSrc').text();
                if (typeof imageSource != typeof undefined && imageSource != false) {
                    createdImages.push(imageSource);
                    $('#imagePreloader').append('<img src="' + imageSource + '" />');
                }
            }
        });

        //Get background images
        var backgroundColour = $(tempPage).attr('BackgroundColour');
        if (typeof backgroundColour == typeof undefined || backgroundColour == false) {
            var backgroundSrc = $(tempPage).find('src').text();
            if (createdImages.indexOf(backgroundSrc) == -1 && typeof backgroundSrc != typeof undefined && backgroundSrc != false) {
                createdImages.push(backgroundSrc);
                $('#imagePreloader').append('<img src="' + backgroundSrc + '" />');
            }
        }
    }

    //Remove the element, the images will now be cached by the browser
    $('#imagePreloader').remove();
}

function loadXML(src) {
    $.ajax(src, {
        success: function (response) {
            content = response;
            buildModule();
        },
        error: function (xhr, thrownError) {
            alert('ERROR: ' + xhr.status);
            alert(thrownError.message);
        }
    });

    $.ajax("com/lPAssessment.xml", {
        success: function (response) {
            assessment = response;
            CheckAnswers();
        },
        error: function (xhr, thrownError) {
            alert('ERROR: ' + xhr.status);
            alert(thrownError.message);
        }
    });
}



function ShowNote(noteId) {
    //Add pages and sections to menu
    $(content).find("contentNote[id='" + noteId + "']").each(function () {
        $('#NoteHeaderText').html($(this).find('notetitle').text());
        var stuff = $(this).find('noteText').text();
        stuff = stuff.replace(/&lt;/g, '<');
        stuff = stuff.replace(/&gt;/g, '>');
        stuff = stuff.replace(/&#39;/g, '\'');

        
        $('#NoteText').html(stuff);
    });

    $('#NotePanel').fadeIn();
}

function HideNote() {
    $('#NotePanel').fadeOut();
}

/*
 * detect IE
 * returns version of IE or false, if browser is not Internet Explorer
 */
function detectIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
}


/*
 * PLUGINS
 */
(function ($) {

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

})(jQuery);