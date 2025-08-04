//learnPro Command Framework (c)

//Module variables
var content; //Content from com/laba_content.xml
var assessment; //Assessment xml from com/lPAssessment.xml
var totalPages; //Total number of pages in the module on load
var currentPageIndex; //User's current page - can be populated by SCORM api bookmark on load
var currentPage; //jQuery object of current page
var furthestPage = 0; //Furthest page user has navigated to in the module
var navAnimation = ''; //Which animation to use to slide in page depending on navigation direction
var headerLoaded = false; //Check if the header elements have finished animating
var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || $(window).width() < 800;
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var localhost = window.location.href.indexOf('127.0.0.1') != -1 || window.location.href.indexOf('localhost') != -1;
var accessibilityColour = '';
var accessibilitySize = '';
var skipMenuOverride = false;
var assessmentBlock;
var bookmarkedLocation;
var BankedQuestionsSet = []; //Object containing random list of questions to ask for each question bank
var PreviousResults;
var questionsUnanswered = false;

/*
 * BUILD MODULE
 */

//Triggered when the script has been loaded via defaults.js
function loadStart() {
    // Initialise LABA Connect module or SCORM API
    if (window.location.host == 'connect.learnprouk.com') {
        //Listen for communication from shell file
        window.addEventListener('message', function (event) {
            if (event.data.action == 'MAIN_LOADED') {
                bookmarkedLocation = event.data.bookmark;
                PreviousResults = event.data.previousResults;

                window.parent.postMessage(
                    {
                        action: 'FRAME_LOADED',
                        assessmentType: defaults.ScoringMethod,
                        bankedQuestionsSet: BankedQuestionsSet,
                    },
                    '*'
                );

                loadModule();
            }

            if (event.data.action == 'CALCULATED_SCORE') {
                var score = event.data.result;
                var interactions = event.data.interactions;
                $('.PlayerContent').append(loadAssessmentPage(assessmentBlock, score, interactions));

                if (defaults.LayoutType == 'block') BlockTransitions();
            }

            if (event.data.action == 'PREVIOUS_RESULTS') {
                PreviousResults = event.data.result;
            }
        });
    } else {
        // Initialise SCORM API if not running locally
        if (defaults.OutputType == 'SCORM' && !localhost) {
            LPInitialize();
            bookmarkedLocation = GetBookmark();
        }
        loadModule();
    }
}

function loadModule() {
    // Set up navigation buttons
    $('.nextButton').on(
        'click',
        {
            dir: 'next',
        },
        navHandler
    );

    $('.backButton').on(
        'click',
        {
            dir: 'back',
        },
        navHandler
    );

    //Load XML - buildModule is called on complete
    loadXML(defaults.XMLsource);

    //Apply skin - loads properties from defaults.js
    applySkin();

    //Setup accessbility tools
    SetupAccessibility();
}

//Apply skin - doesn't require any information from xml on defaults.js
function applySkin() {
    //Custom colours
    if (defaults.NavColour1 != '#ffffff') {
        $('head').append(
            '<style type="text/css">.accent-color-text { color: ' +
            defaults.NavColour1 +
            ' !important; } .accent-color-border { border-color: ' +
            defaults.NavColour1 +
            ' !important; } .accent-color-background { background-color: ' +
            defaults.NavColour1 +
            ' !important; }</style>'
        );
    } else {
        $('head').append(
            '<style type="text/css">.accent-color-text { color: ' +
            defaults.NavColour2 +
            ' !important; } .accent-color-border { border-color: ' +
            defaults.NavColour2 +
            ' !important; } .accent-color-background { background-color: ' +
            defaults.NavColour2 +
            ' !important; }</style>'
        );
    }

    //Custom nav button theme
    $('head').append(
        '<style type="text/css">.CustomNavigationButton { background-image: linear-gradient(to right, ' + defaults.NavColour1 + ', ' + defaults.NavColour2 + '); color: ' + defaults.FontColour2 + '!important }</style>'
    );

    //Background colour
    $('.ContainerBackground').append(
        '<div id="ProjectBackground" style="background-color:' +
        defaults.BackgroundColour1 +
        '; background:linear-gradient(to bottom, ' +
        defaults.BackgroundColour1 +
        ', ' +
        defaults.BackgroundColour2 +
        ');"></div>'
    );

    //Background image
    if (defaults.Background != 'none') {
        var backgroundFit = defaults.BackgroundFit;
        $('#ProjectBackground').append(
            '<img style="object-fit:' + backgroundFit + '" src="' + defaults.Background + '" alt="Background Image" style="display:none" />'
        );
    }

    //Logo image
    $('#projectLogo').attr('src', defaults.Logo);

    //Fonts
    $('body').addClass(defaults.Font + ' size' + defaults.FontSize);

    //Nav bar colour
    $('#navigation').css({
        'background-color': defaults.NavColour1,
        background: 'linear-gradient(to right, ' + defaults.NavColour1 + ', ' + defaults.NavColour2 + ')',
    });

    //Note bar colour
    $('.open_note_button').css({
        color: defaults.NavColour1,
    });

    //Change progress container colour if nav bar colour is white otherwise progress bar is invisible
    if (defaults.NavColour2 == '#ffffff') {
        $('.progressBar').css('background', defaults.AccentColour1);
        $('.navButton').css({
            color: '#000',
            padding: '5px 8px',
            background: '' + defaults.AccentColour1 + '',
        });
    } else {
        $('.progressBar').css('background', defaults.HeaderColour1);
    }

    //Show header if not on small screen devices
    if ($(window).width() > 800) {
        $('.HeaderInfo').css('color', defaults.FontColour1);
        $('#header')
            .show()
            .animateCss('slideInDown', function () {
                $('#navigation')
                    .show()
                    .animateCss('slideInLeft', function () {
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
    if (defaults.OutputType == 'SCORM') {
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
    if (defaults.OutputType == 'SCORM') {
        if (bookmarkedLocation) {
            currentPageIndex = parseInt(bookmarkedLocation);

            //Check if opening on last page and reset to beginning
            if (currentPageIndex == totalPages - 1) {
                ResetModule();
            }
        } else {
            currentPageIndex = 0;
        }
    } else {
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

    //Show accessibility and navigation message
    $('.PlayerOverlay, .PlayerMessage').fadeIn(300);
    $('.MessageStartButton, .AccessibilityMessage, .NavigationMessage').delay(1000).fadeIn(1000);
    $('.PlayerOverlay').css('background', '#3c3c3c');
    setTimeout(function () {
        $('.PlayerOverlay, .PlayerMessage').fadeOut(300);
    }, 10000);
    $('.MessageStartButton').click(function () {
        $('.PlayerOverlay, .PlayerMessage').fadeOut(300);
    });

    //Show content warning for audio/video
    if ($(content).find('content[type="video"]').length > 0 && $(content).find('content[type="audio"]').length > 0) {
        $('.MediaMessage').append('This module contains audio & video.');
        $('.videoIcon').css('margin-left', '50px');
        $('.videoIcon').show().animateCss('slideInRight');
        $('.audioIcon').show().animateCss('slideInLeft');
        //Video
    } else if ($(content).find('content[type="video"]').length > 0) {
        $('.MediaMessage').append('This module contains video.');
        $('.audioIcon').hide();
        $('.videoIcon').show().animateCss('slideInRight');
        //Audio
    } else if ($(content).find('content[type="audio"]').length > 0) {
        $('.MediaMessage').append('This module contains audio.');
        $('.videoIcon').hide();
        $('.audioIcon').show().animateCss('slideInLeft');
    }

    //Setup glossary
    if (defaults.ShowGlossary == 'True') {
        $('.glossary-button span').html(htmlUnescape($(content).find('projectNote').find('noteTitle').text()));
        $('.glossary-button')
            .off()
            .click(function () {
                $('#NoteHeaderText').html(htmlUnescape($(content).find('projectNote').find('noteTitle').text()));
                $('#NoteText').html(htmlUnescape($(content).find('projectNote').find('noteText').text()));
                $('#NotePanel').fadeIn();
            });
    } else {
        $('.glossary-button').next().remove();
        $('.glossary-button').remove();
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
    $('.progressBar').css('width', 100 * (currentPageIndex / (totalPages - 1)) + '%');

    //Update section name in nav title
    if (currentPage.attr('section') == 'true') $('#projectHeader').html(currentPage.find('sectionTitle').text());
    else $('#projectHeader').html(currentPage.find('sectionTitle').text() + ' - ' + currentPage.find('title').text());

    //Set navigation bar text colour
    $('#projectHeader').css('color', defaults.FontColour2);

    //Build and write the content to the page
    buildPage();

    if (defaults.OutputType == 'SCORM') {
        if (window.location.host == 'connect.learnprouk.com') {
            //SCORM - Set current location in module
            window.parent.postMessage(
                {
                    action: 'EXECUTE_FUNCTION',
                    function: 'SetBookmark',
                    parameters: [pageNumber],
                },
                '*'
            );

            //SCORM - Get updated question attempts
            window.parent.postMessage(
                {
                    action: 'EXECUTE_FUNCTION',
                    function: 'GetPreviousQuestionAnswers',
                    return: true,
                },
                '*'
            );

            //SCORM - Set module completion
            if (currentPageIndex === totalPages - 1) {
                window.parent.postMessage(
                    {
                        action: 'EXECUTE_FUNCTION',
                        function: 'SetModuleComplete',
                        parameters: [totalPages],
                    },
                    '*'
                );
            }
        } else {
            SetBookmark(pageNumber);

            PreviousResults = GetPreviousQuestionAnswers();

            if (currentPageIndex === totalPages - 1) {
                SetModuleComplete();
            }
        }
    }

    //Apply theme styles
    $('.QuestionContent .accent-color-border').css('border-color', defaults.HeaderColour1);
    $('.QuestionContent .accent-color-text').css('color', defaults.HeaderColour1);

    //Add click event for content block notes
    $('.ContentBlock')
        .off('click')
        .click(function (e) {
            if ($(e.target).hasClass('open_note_button')) {
                var noteId = $(e.target).attr('data-id');
                ShowNote(noteId);
            }
        });

    AnimatePage();

    //Disable nav keys for free text questions
    $('.FreeTextAnswer textarea')
        .focus(function () {
            $(document).off('keydown');
        })
        .focusout(function () {
            AccessibilityShortcuts();
        });
}

//Animate page in
function AnimatePage() {
    //Scroll to top of page
    setTimeout(function () {
        $('body, .PlayerContainer').scrollTop(0);
    }, 100);

    //Don't show animations in IE or for interactions
    var interactions = $('.PlayerContainer').find('.TemplateContent').length;
    if (detectIE() || interactions > 0 || defaults.Animations == 'False') navAnimation = 'none';

    if (headerLoaded == true) {
        if (navAnimation == 'next') {
            $('.PlayerContainer').show().animateCss('slideInRight');
        } else if (navAnimation == 'back') {
            $('.PlayerContainer').show().animateCss('slideInLeft');
        } else {
            $('.PlayerContainer').fadeIn(500);
        }

        if (defaults.LayoutType == 'block') BlockTransitions();
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
    var sectionCount = 1;

    //Add pages and sections to menu
    $(content)
        .find('page')
        .each(function () {
            var pageId = $(this).attr('id');
            var sectionId = $(this).attr('sectionId') != null ? $(this).attr('sectionId') : $(this).attr('id');
            var pageName = $(this).find('title').text();
            var skipMenu = defaults.SkipMenu == 'True' || skipMenuOverride || pageId <= currentPageIndex ? '' : ' disabled';

            //If section
            if ($(this).attr('section') == 'true') {
                //Add section item
                $('.MenuSectionsInner').append(
                    '<div class="SectionItem ' +
                    skipMenu +
                    '" data-page-id="' +
                    pageId +
                    '" data-section-id="' +
                    pageId +
                    '"><div class="SectionItemInner"><span class="SectionOrder"><span>' +
                    sectionCount +
                    '</span></span><span class="SectionName"><span class="SectionNameText">' +
                    pageName +
                    '</span></span></div></div>'
                );

                //Add section shortcut to progress bar
                var position = 100 * (sectionId / (totalPages - 1)) - 0.3;
                $('.progressContainer').append(
                    '<div class="progressSection ' +
                    skipMenu +
                    '" style="left: ' +
                    position +
                    '%;" data-page-id="' +
                    sectionId +
                    '" title="Section: ' +
                    pageName +
                    '"><i class="fas fa-map-marker accent-color-text"></i></div>'
                );

                //Increment section for order number
                sectionCount++;
            }

            //Add page item
            $('.MenuPagesInner').append(
                '<div class="PageItem ' +
                skipMenu +
                '" data-page-id="' +
                pageId +
                '" data-section-id="' +
                sectionId +
                '"><div class="PageItemInner"><span class="PageName">' +
                pageName +
                '</span></div></div>'
            );
        });

    //Change page when section/page is clicked
    $('.PageItem, .SectionItem, .progressSection').on('click', function (e) {
        //Get new page number
        currentPageIndex = parseInt($(this).attr('data-page-id'));

        //Change page content
        changePage(currentPageIndex);

        MenuSelections();

        //Auto close menu on mobile
        if (mobile && $('.menu-button').hasClass('open') && $(e.target).hasClass('PageName')) {
            $('.menu-button').removeClass('open');
            $('.menu-button').find('span').text('OPEN MENU');
            $('.ModuleMenu')
                .show()
                .animateCss('bounceOutRight', function () {
                    $('.ModuleMenu').hide();
                });
        }
    });

    //Click to open menu
    $('.menu-button').on('click', function () {
        if ($(this).hasClass('open')) {
            $(this).removeClass('open');
            $(this).find('span').text('OPEN MENU');

            $('.ModuleMenu')
                .show()
                .animateCss('bounceOutRight', function () {
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
        $('.ModuleMenu')
            .show()
            .animateCss('bounceOutRight', function () {
                $('.ModuleMenu').hide();
            });
    });

    //Make menu draggable
    if (!mobile) $('.ModuleMenu').draggable();

    //Get first selected page
    MenuSelections();
}

//Show current selected section and page in menu
function MenuSelections() {
    var currentPage = $('.PageItem[data-page-id="' + currentPageIndex + '"]');
    var currentSectionId = currentPage.attr('data-section-id');
    var currentSection = $('.SectionItem[data-page-id="' + currentSectionId + '"]');

    //Show pages for current section in page menu
    $('.PageItem')
        .not('[data-section-id="' + currentSectionId + '"]')
        .hide();
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
        if (questionsUnanswered && e.data.dir === 'next') {
            alert('Navigation disabled, please select all correct answers.');
        } else {
            //Animate button
            $(e.target).closest('.navButton').find('i').animateCss('tada');

            // Get direction
            if (e.data.dir === 'next') {
                navAnimation = 'next';
                currentPageIndex++;
                if (currentPageIndex > furthestPage) {
                    furthestPage = currentPageIndex;
                }
            } else {
                navAnimation = 'back';
                currentPageIndex--;
            }

            // Go to that page
            changePage(currentPageIndex);

            //Update selected page in menu
            MenuSelections();
        }
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
    if (parseInt(currentPageIndex) === totalPages - 1) {
        $('.nextButton').addClass('navDisabled');
    }

    //Event listener for custom page buttons
    setTimeout(function () {
        NavigationButtonHandlers();
    }, 500);
}

//Reset module if no score on assessment summary page
function ResetModule() {
    currentPageIndex = 0;
    skipMenuOverride = true;

    setTimeout(function () {
        $('.PlayerContent').empty();
        changePage(currentPageIndex);
        $('.SectionItem, .PageItem').removeClass('disabled');
        $('.progressSection').removeClass('passed');
    }, 100);
}

//Handle custom navigation buttons
function NavigationButtonHandlers() {
    //Disable buttons if already on first or last page
    $('.CustomNavBack').attr('disabled', parseInt(currentPageIndex) === 0);
    $('.CustomNavNext').attr('disabled', parseInt(currentPageIndex) === totalPages - 1);

    //Back button
    $('.CustomNavBack')
        .off('click')
        .click(function (e) {
            e.preventDefault();
            currentPageIndex--;
            changePage(currentPageIndex);
        });

    //Next button
    $('.CustomNavNext')
        .off('click')
        .click(function (e) {
            e.preventDefault();
            currentPageIndex++;
            changePage(currentPageIndex);
        });

    //GoTo page
    $('.CustomNavGoTo')
        .off('click')
        .click(function (e) {
            e.preventDefault();
            let goToPageId = $(this).attr('data-page-id');
            let pageId = $(content)
                .find('page[page-nav-id="' + goToPageId + '"]')
                .attr('id');

            if (pageId) {
                currentPageIndex = pageId;
                changePage(pageId);
            }
        });
}

/*
 * ASSESSMENT
 */

//Checks whether selected answers are correct then updates SCORM response
function CheckAnswers() {
    if (assessment) {
        //Store number of attempts and correct answers the user has selected for each question
        var questionAttempts = [];

        //When an answer is selected
        $('.ContentBlock .answer-accordion')
            .off()
            .click(function () {
                var block = $(this).closest('.ContentBlock');
                var header = $(this).find('.answer-header');
                var answer = $(this).find('.answer');
                var questionId = $(answer).attr('data-questionid');
                var answerId = $(answer).attr('data-answerid');
                var questionBankId = $(assessment)
                    .find('Question[LABQuestionId="' + questionId + '"]')
                    .attr('QuestionBank');
                var questionBanking = questionBankId != -1;
                var questionBlock = questionBanking ? $(this).closest('.BankQuestion') : $(block);
                questionsUnanswered = true;

                var questionAttempt = {
                    questionId: questionId,
                    correctCount: 0,
                    attempts: 0,
                };

                for (var i = 0; i < questionAttempts.length; i++) {
                    if (questionAttempts[i].questionId == questionId) {
                        questionAttempt = questionAttempts[i];
                    }
                }

                //Total number of correct answers for this question
                var totalCorrect = $(assessment)
                    .find('Question[LABQuestionId="' + questionId + '"]')
                    .find('Answer[IsCorrect="True"]').length;

                //Check if answer is correct
                var answerCorrect = $(assessment)
                    .find('Question[LABQuestionId="' + questionId + '"]')
                    .find('Answer[LABAnswerId="' + answerId + '"]')
                    .attr('IsCorrect');

                //If the answer is correct increase correct count
                if (answerCorrect == 'True') {
                    $(header).css('border-color', '#24a558');
                    $(this).addClass('correct');
                    questionAttempt.correctCount++;
                } else {
                    $(header).css('border-color', '#d24444');
                }

                //Increase attempts regardless of answer
                questionAttempt.attempts++;
                questionAttempts.push(questionAttempt);

                //Show feedback
                var feedback = $(assessment)
                    .find('Question[LABQuestionId="' + questionId + '"]')
                    .find('Answer[LABAnswerId="' + answerId + '"]')
                    .attr('Feedback');
                var textArea = document.createElement('textarea');
                textArea.innerHTML = feedback.replace('<![CDATA[', '').replace(']]>', '');
                $(this).append('<div class="answer-feedback">' + textArea.value + '</div>');

                //Slide down feedback
                $(this).find('.answer-feedback').slideToggle();
                $(this).addClass('selected');

                //Disable further click events on this answer
                $(this).off();

                //Once all correct answers (or attempts equalling the number of correct answers for assessed modules) are selected end the question
                if ((defaults.ScoringMethod == 'Assessed' && questionAttempt.attempts == totalCorrect) || questionAttempt.correctCount == totalCorrect) {
                    $('.answer-accordion:not(.correct)', questionBlock).css('opacity', '0.9');
                    $('.answer-accordion', questionBlock).off();
                    $(questionBlock).attr('data-complete', true);


                    //Setup Next Question Button
                    $('.NextQuestionButton')
                        .off()
                        .click(function () {
                            $('.NextQuestionButton').hide();
                            var setQuestions = $(block).find('.BankQuestion').length;
                            var completeQuestions = $(block).find('.BankQuestion[data-complete="true"]').length;
                            var nextQuestion = $(block).find('.BankQuestion:not([data-complete="true"])')[0];
                            $(questionBlock).hide();
                            $(nextQuestion).fadeIn(300);
                            $(block)
                                .find('.QuestionBankCounter')
                                .text('Question ' + (completeQuestions + 1) + ' of ' + setQuestions);
                        });

                    //Show next question if using question banking
                    if (questionBanking && $(block).find('.BankQuestion:not([data-complete="true"])').length > 0) {
                        $('.NextQuestionButton').show();
                    } else {
                        //Allow forward navigation if not end of module and no unanswered questions
                        var incompleteQuestions = $('.ContentBlock.QuestionContent:not([data-complete="true"])').length;
                        var incompleteBanks = $('.BankQuestion:not([data-complete="true"])').length;
                        var incompleteTotal = incompleteQuestions + incompleteBanks;

                        if (incompleteTotal == 0) {
                            if (parseInt(currentPageIndex) != totalPages - 1) {
                                questionsUnanswered = false;
                                $('.nextButton').removeClass('navDisabled');
                            }
                        }
                    }
                }



                //SCORM
                if (defaults.OutputType == 'SCORM') {
                    if (window.location.host == 'connect.learnprouk.com') {
                        window.parent.postMessage(
                            {
                                action: 'EXECUTE_FUNCTION',
                                function: 'AddInteractionResponse',
                                parameters: [questionId, answerId],
                            },
                            '*'
                        );
                    } else {
                        AddInteractionResponse(questionId, answerId);
                    }
                }
            });


        //Setup free text question
        $('.FreeTextSubmitButton')
            .off()
            .click(function () {
                var feedback = $(this).closest('.QuestionContent').find('.free-text-feedback');
                $(this).closest('.QuestionContent').attr('data-complete', true);
                feedback.slideToggle(300);

                var incompleteQuestions = $('.ContentBlock.QuestionContent:not([data-complete="true"])').length;
                if (incompleteQuestions == 0) {
                    //Allow forward navigation if not end of module
                    setTimeout(function () {
                        if (parseInt(currentPageIndex) != totalPages - 1) {
                            questionsUnanswered = false;
                            $('.nextButton').removeClass('navDisabled');
                        }
                    }, 1000);
                }
            });
    }
}

//Reselect answers for previously answered questions
function ResumeResults(element, questionId) {
    if (PreviousResults) {
        setTimeout(function () {
            for (var i = 0; i < PreviousResults.length; i++) {
                if (PreviousResults[i].QuestionId == questionId) {
                    $(element)
                        .find('.answer[data-answerid="' + PreviousResults[i].AnswerId + '"]')
                        .closest('.answer-accordion')
                        .click();
                }
            }
        }, 200);
    }
}

/*
 * ACCESSIBILITY OPTIONS
 */
function SetupAccessibility() {
    $('.AccessibilityButton').css('background', 'linear-gradient(45deg, ' + defaults.NavColour1 + ', ' + defaults.NavColour2 + ')');

    $('.FontSettingContainerFooter').draggable();
    var isDragging = false;
    $('.AccessibilityButton')
        .mousedown(function () {
            $(window).mousemove(function () {
                isDragging = true;
                $(window).unbind('mousemove');
            });
        })
        .mouseup(function () {
            var wasDragging = isDragging;
            isDragging = false;
            $(window).unbind('mousemove');
            if (!wasDragging) {
                $('.FontSettingContainer').toggleClass('selected');
            }
        });

    //Font size
    $('.FontSmallButton')
        .off()
        .click(function (e) {
            $('.PlayerContainer').removeClass('FontExtraLargeSetting').removeClass('FontLargeSetting');
            $('.TemplateContent iframe').contents().find('.interaction-container').removeClass('FontExtraLargeSetting').removeClass('FontLargeSetting');
            $('.TemplateContent iframe')
                .contents()
                .find('body')
                .removeClass(defaults.Font + ' size' + defaults.FontSize);
            accessibilitySize = 'FontSmallButton';
        });
    $('.FontMediumButton')
        .off()
        .click(function (e) {
            $('.PlayerContainer').removeClass('FontExtraLargeSetting').addClass('FontLargeSetting');
            $('.TemplateContent iframe').contents().find('.interaction-container').removeClass('FontExtraLargeSetting').addClass('FontLargeSetting');
            $('.TemplateContent iframe')
                .contents()
                .find('body')
                .removeClass(defaults.Font + ' size' + defaults.FontSize);
            accessibilitySize = 'FontMediumButton';
        });
    $('.FontLargeButton')
        .off()
        .click(function (e) {
            $('.PlayerContainer').removeClass('FontLargeSetting').addClass('FontExtraLargeSetting');
            $('.TemplateContent iframe').contents().find('.interaction-container').removeClass('FontLargeSetting').addClass('FontExtraLargeSetting');
            $('.TemplateContent iframe')
                .contents()
                .find('body')
                .removeClass(defaults.Font + ' size' + defaults.FontSize);
            accessibilitySize = 'accessibilitySize';
        });

    //Contrast colours
    $('.FontStandardButton')
        .off()
        .click(function (e) {
            $('.PlayerContainer')
                .removeClass('FontBlackSetting')
                .removeClass('FontBlueSetting')
                .removeClass('FontGreySetting')
                .removeClass('FontYellowSetting')
                .addClass('FontBlackSetting');
            $('.TemplateContent iframe')
                .contents()
                .find('.interaction-container')
                .removeClass('FontBlackSetting')
                .removeClass('FontBlueSetting')
                .removeClass('FontGreySetting')
                .removeClass('FontYellowSetting')
                .addClass('FontBlackSetting');
            accessibilityColour = 'FontStandardButton';
        });
    $('.FontBlueButton')
        .off()
        .click(function (e) {
            $('.PlayerContainer')
                .removeClass('FontBlackSetting')
                .removeClass('FontBlueSetting')
                .removeClass('FontGreySetting')
                .removeClass('FontYellowSetting')
                .addClass('FontBlueSetting');
            $('.TemplateContent iframe')
                .contents()
                .find('.interaction-container')
                .removeClass('FontBlackSetting')
                .removeClass('FontBlueSetting')
                .removeClass('FontGreySetting')
                .removeClass('FontYellowSetting')
                .addClass('FontBlueSetting');
            accessibilityColour = 'FontBlueButton';
        });
    $('.FontGreyButton')
        .off()
        .click(function (e) {
            $('.PlayerContainer')
                .removeClass('FontBlackSetting')
                .removeClass('FontBlueSetting')
                .removeClass('FontGreySetting')
                .removeClass('FontYellowSetting')
                .addClass('FontGreySetting');
            $('.TemplateContent iframe')
                .contents()
                .find('.interaction-container')
                .removeClass('FontBlackSetting')
                .removeClass('FontBlueSetting')
                .removeClass('FontGreySetting')
                .removeClass('FontYellowSetting')
                .addClass('FontGreySetting');
            accessibilityColour = 'FontGreyButton';
        });
    $('.FontYellowButton')
        .off()
        .click(function (e) {
            $('.PlayerContainer')
                .removeClass('FontBlackSetting')
                .removeClass('FontBlueSetting')
                .removeClass('FontGreySetting')
                .removeClass('FontYellowSetting')
                .addClass('FontYellowSetting');
            $('.TemplateContent iframe')
                .contents()
                .find('.interaction-container')
                .removeClass('FontBlackSetting')
                .removeClass('FontBlueSetting')
                .removeClass('FontGreySetting')
                .removeClass('FontYellowSetting')
                .addClass('FontYellowSetting');
            accessibilityColour = 'FontYellowButton';
        });

    //Reset
    $('.FontResetButton')
        .off()
        .click(function (e) {
            $('.PlayerContainer')
                .removeClass('FontExtraLargeSetting')
                .removeClass('FontLargeSetting')
                .removeClass('FontBlackSetting')
                .removeClass('FontBlueSetting')
                .removeClass('FontGreySetting')
                .removeClass('FontYellowSetting');
            $('.TemplateContent iframe')
                .contents()
                .find('.interaction-container')
                .removeClass('FontExtraLargeSetting')
                .removeClass('FontLargeSetting')
                .removeClass('FontBlackSetting')
                .removeClass('FontBlueSetting')
                .removeClass('FontGreySetting')
                .removeClass('FontYellowSetting');
            $('.TemplateContent iframe')
                .contents()
                .find('body')
                .addClass(defaults.Font + ' size' + defaults.FontSize);
            accessibilitySize = '';
            accessibilityColour = '';
        });

    //Print
    $('.AccessibilityPrintButton')
        .off()
        .click(function (e) {
            $('.PlayerContainer').hide();
            var output = '';

            //Loop through each page
            $(content)
                .find('page')
                .each(function () {
                    //Create page element
                    output += '<div id="Page_' + $(this).attr('id') + '" class="PrintPage">';

                    //Loop through page content and add to page
                    $(this)
                        .find('content')
                        .each(function () {
                            switch ($(this).attr('type')) {
                                case 'text':
                                    var textContent = $(this).find('text');
                                    var text = $(textContent).text();
                                    text = text.replaceAll('color:#ffffff', 'color:#000000');
                                    text = text.replaceAll('&quot;color: rgb(255, 255, 255)', '"color:#000000');
                                    text = text.replaceAll('color=&quot;#ffffff&quot;', 'color=&quot;#000000&quot;');
                                    output += '<div class="ContentBlock TextContent">' + htmlUnescape(text) + '</div>';
                                    break;
                                case 'image':
                                    var imageContent = $(this).find('image');
                                    var src = $(imageContent).text();
                                    var alt = $(imageContent).attr('imageAlt');

                                    if (alt == 'Image without description.') alt = '';

                                    output +=
                                        '<div class="ContentBlock ImageContent"><img src="' +
                                        src +
                                        '" alt="' +
                                        alt +
                                        '"/><div class="AltText">' +
                                        alt +
                                        '</div></div>';
                                    break;
                                case 'question':
                                    var questionHtml = $(this).find('question').text();
                                    output += '<div class="ContentBlock QuestionContent">' + htmlUnescape(questionHtml) + '</div>';
                                    break;
                                case 'template':
                                    var interactionContent = $(this).find('interaction');
                                    var src = $(interactionContent).text();
                                    output +=
                                        '<div class="ContentBlock TemplateContent"><iframe src="' +
                                        src +
                                        '" frameborder="0" scrolling="no" width="100%" data-navcolour="' +
                                        defaults.NavColour1 +
                                        '"></iframe></div>';
                                    break;
                            }
                        });

                    //Close page div
                    output += '</div>';
                });

            $(assessment)
                .find('Question')
                .each(function () {
                    var ass = $(this).attr('Assessed');
                    var qId = $(this).attr('LABQuestionId');
                    var aId = -1;
                    $(this)
                        .find('Answer')
                        .each(function () {
                            if ($(this).attr('IsCorrect') == 'True') aId = $(this).attr('LABAnswerId');
                        });

                    if (aId != -1) {
                        var original = $(output).find(".answer[data-questionid='" + qId + "'][data-answerid='" + aId + "']");
                        original = $('<div />').append(original).html();

                        var answer = $(output)
                            .find(".answer[data-questionid='" + qId + "'][data-answerid='" + aId + "']")
                            .text();

                        var swap = $(output).find(".answer[data-questionid='" + qId + "'][data-answerid='" + aId + "']");
                        if (ass != 'True') swap.text(answer + ' (Correct)');
                        swap = $('<div />').append(swap).html();

                        output = output.replace(original, swap);
                    }
                });

            //Open new window with printable version
            var newWin = window.open('', 'Print-Window');
            newWin.document.open();
            newWin.document.write(
                '<html><head><title>' +
                defaults.Name +
                ' - Print</title><link rel="stylesheet" type="text/css" href="css/print.css" /><link rel="stylesheet" href="https://use.typekit.net/pyw6rip.css"/></head><body><div class="PrintSettings"></div>' +
                output +
                '<script src="js/jquery-1.9.1.min.js" type="text/javascript"></script><script src="js/iframeResizer.min.js" type="text/javascript"></script><script src="js/print.js" type="text/javascript"></script><script type="text/javascript">var printModeOn = true; var assessmenttype = "' +
                defaults.ScoringMethod +
                '";</script></body></html>'
            );
            newWin.document.close();
            $('.PlayerContainer').show();
        });

    //Navigation keys
    AccessibilityShortcuts();
}

function AccessibilityShortcuts() {
    $(document)
        .off('keydown')
        .keydown(function (e) {
            switch (e.which) {
                case 37: // left
                    $('.backButton').trigger('click');
                    break;

                case 38: // up
                    break;

                case 39: // right
                    $('.nextButton').trigger('click');
                    break;

                case 40: // down
                    break;

                case 65: // a
                    $('.FontSettingContainer').toggleClass('selected');
                    break;

                case 77: //m
                    $('.menu-button').trigger('click');
                    break;

                case 80: // p
                    $('.AccessibilityPrintButton').trigger('click');
                    break;

                case 77: // m

                case 13: // enter
                    $('.MessageStartButton').trigger('click');
                    break;

                default:
                    return; // exit this handler for other keys
            }
            e.preventDefault(); // prevent the default action (scroll / move caret)
        });
}

/*
 * UTILITY
 */

//Escape HTML characters for print mode
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
            from = from < 0 ? Math.ceil(from) : Math.floor(from);
            if (from < 0) from += len;

            for (; from < len; from++) {
                if (from in this && this[from] === elt) return from;
            }
            return -1;
        };
    }

    //For each page add background images and content images to image preload element
    $(content)
        .find('page')
        .each(function () {
            var $page = $(this);
            var $blocks = $page.find('content');

            //Get image content from content blocks
            $blocks.each(function () {
                var $block = $(this);

                if ($block.attr('type') == 'image') {
                    var imgSrc = $block.text().trim();
                    if (imgSrc) {
                        createdImages.push(imgSrc);
                        $('#imagePreloader').append('<img src="' + imgSrc + '" />');
                    }
                } else if ($block.attr('type') == 'text' || $block.attr('type') == 'question') {
                    var images = htmlUnescape($block.text()).match(/images\/.*?(?=['"])/g);
                    if (images) {
                        for (var i = 0; i < images.length; i++) {
                            var imgSrc = images[i];
                            if (imgSrc) {
                                createdImages.push(imgSrc);
                                $('#imagePreloader').append('<img src="' + imgSrc + '" />');
                            }
                        }
                    }
                } else if ($block.attr('type') == 'template') {
                    var templateSrc = $block.text().trim();
                    $.get(
                        templateSrc,
                        function (html_string) {
                            var images = html_string.match(/images\/.*?(?=['"])/g);
                            if (images) {
                                for (var i = 0; i < images.length; i++) {
                                    var imgSrc = images[i];
                                    if (imgSrc) {
                                        createdImages.push(imgSrc);
                                        $('#imagePreloader').append('<img src="' + imgSrc + '" />');
                                    }
                                }
                            }
                        },
                        'html'
                    );
                }
            });

            //Get page background images and videos
            var $bg = $page.find('background');
            if ($bg.attr('type') == 'Image') {
                var bgSrc = $bg.attr('src');
                if (createdImages.indexOf(bgSrc) == -1 && bgSrc) {
                    createdImages.push(bgSrc);
                    $('#imagePreloader').append('<img src="' + bgSrc + '" />');
                }
            } else if ($bg.attr('type') == 'Video') {
                var bgSrc = $bg.attr('src');
                if (createdImages.indexOf(bgSrc) == -1 && bgSrc) {
                    createdImages.push(bgSrc);
                    $('#imagePreloader').append('<video autoplay muted><source src="' + bgSrc + '" type="video/mp4"></video>');
                }
            }
        });

    //Remove the element, the images will now be cached by the browser
    //$('#imagePreloader').remove();
}

//Load from content and assessment XML files
function loadXML(src) {
    $.ajax(src, {
        success: function (response) {
            content = response;
            loadAssessmentXML();
        },
        error: function (xhr, thrownError) {
            alert('ERROR: ' + xhr.status);
            alert(thrownError.message);
        },
    });
}

function loadAssessmentXML() {
    $.ajax('com/lPAssessment.xml', {
        success: function (response) {
            assessment = response;

            //Get previously attempted questions
            if (defaults.OutputType == 'SCORM' && window.location.host != 'connect.learnprouk.com') {
                PreviousResults = GetPreviousQuestionAnswers();
            }

            //For each question bank
            $(assessment)
                .find('QuestionBank')
                .each(function () {
                    var bankId = $(this).attr('Id');

                    //Total questions in bank
                    var totalQuestions = $(assessment).find('Question[QuestionBank="' + bankId + '"]').length;

                    //Questions to ask
                    var questionCount = $(this).attr('QuestionCount');

                    //Create list of random banked questions to ask
                    var questionBank = {
                        BankId: parseInt(bankId),
                        LabQuestionIds: [],
                        CorrectAnswerCount: 0,
                    };

                    //If questions in bank have already been answered show those
                    var bankPreviouslyAttempted = false;
                    if (PreviousResults) {
                        for (var i = 0; i < PreviousResults.length; i++) {
                            var questionId = parseInt(PreviousResults[i].QuestionId);

                            //Check if the question has already been added
                            var exists = false;
                            for (var j = 0; j < questionBank.LabQuestionIds; j++) {
                                if (questionBank.LabQuestionIds[j] == questionId) {
                                    exists = true;
                                }
                            }

                            //Add to question list
                            if (!exists) {
                                var labQuestion = $(assessment).find('Question[LABQuestionId="' + questionId + '"]');
                                if ($(labQuestion).attr('QuestionBank') == bankId) {
                                    bankPreviouslyAttempted = true;
                                    questionBank.LabQuestionIds.push(questionId);
                                    questionBank.CorrectAnswerCount += $(labQuestion).find('Answer[IsCorrect="True"]').length;
                                }
                            }
                        }
                    }

                    //If answering for the first time show random questions from bank
                    if (!bankPreviouslyAttempted) {
                        uniqueRandoms = [];
                        for (var i = 0; i < questionCount; i++) {
                            var num = RandomNum(totalQuestions);
                            var labQuestion = $(assessment).find('Question[QuestionBank="' + bankId + '"]')[num];
                            var labQuestionId = parseInt($(labQuestion).attr('LABQuestionId'));
                            questionBank.LabQuestionIds.push(labQuestionId);
                            questionBank.CorrectAnswerCount += $(labQuestion).find('Answer[IsCorrect="True"]').length;
                        }
                    }

                    //Add question bank to set for assessing
                    BankedQuestionsSet.push(questionBank);
                });

            //SCORM
            if (defaults.OutputType == 'SCORM') {
                if (window.location.host == 'connect.learnprouk.com') {
                    window.parent.postMessage(
                        {
                            action: 'ASSESSMENT_LOADED',
                            bankedQuestionsSet: BankedQuestionsSet,
                        },
                        '*'
                    );
                }
            }

            buildModule();
            CheckAnswers();
        },
        error: function (xhr, thrownError) {
            alert('ERROR: ' + xhr.status);
            alert(thrownError.message);
        },
    });
}

//Note functionality
function ShowNote(noteId) {
    $(content)
        .find("contentNote[id='" + noteId + "']")
        .each(function () {
            $('#NoteHeaderText').html(htmlUnescape($(this).find('notetitle').text()));
            $('#NoteText').html(htmlUnescape($(this).find('noteText').text()));
        });

    $('#NotePanel').fadeIn();
}

function HideNote() {
    $('#NotePanel').fadeOut();
}

//detect IE - returns version of IE or false, if browser is not Internet Explorer
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

//Generate unique random number integer between 0 and a set number
var uniqueRandoms = [];

function RandomNum(numRandoms) {
    // refill the array if needed
    if (!uniqueRandoms.length) {
        for (var i = 0; i < numRandoms; i++) {
            uniqueRandoms.push(i);
        }
    }
    var index = Math.floor(Math.random() * uniqueRandoms.length);
    var val = uniqueRandoms[index];

    // now remove that value from the array
    uniqueRandoms.splice(index, 1);

    return val;
}

//Plugins
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
