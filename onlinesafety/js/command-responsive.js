//learnPro Command Framework (c)

/*
 * PAGE BUILDING
 */

//Build content from xml and write to page
function buildPage() {
    //Clear all content
    $('.PlayerContainer').hide();
    $('.PlayerContent').html('');

    //Add page break
    $('.PlayerContent').attr('data-break', parseInt(currentPage.attr('pageBreak')) + 1);

    //Add page template
    $('.PlayerContent').attr('data-templateblockid', parseInt(currentPage.attr('pageTemplate')));
    $('.PlayerContent').removeClass().addClass('PlayerContent').addClass(currentPage.attr('pageClass'));

    //Apply page background colour
    $('.ContainerBackground #PageBackground').remove();
    $('.ContainerBackground').append('<div id="PageBackground" style="background-color:' + currentPage.find('background').attr('colour') + '"></div>');

    var backgroundFit = currentPage.find('background').attr('fit');

    //Page background image
    if ($(currentPage).find('background').attr('type') == 'Image') {
        $('#PageBackground').append(
            '<img style="object-fit:' + backgroundFit + '" src="' + currentPage.find('background').attr('src') + '" alt="Page background Image" />'
        );
    } else if ($(currentPage).find('background').attr('type') == 'Video') {
        $('#PageBackground').append(
            '<video style="object-fit:' +
            backgroundFit +
            '" width="100%" height="100%" autoplay muted><source src="' +
            $(currentPage).find('background').attr('src') +
            '" type="video/mp4">Your browser does not support the video tag.</video>'
        );
    }

    //Page audio
    buildAudio();

    //Get each of the content items and send them to the correct handler
    var i = 1;
    currentPage.find('content').each(function () {
        switch ($(this).attr('type')) {
            case 'text':
                textHandler($(this));
                break;
            case 'image':
                imageHandler($(this));
                break;
            case 'video':
                videoHandler($(this), i);
                break;
            case 'overlayvideo':
                overlayvideoHandler($(this), i);
                break;
            case 'question':
                questionHandler($(this), i);
                break;
            case 'questionbank':
                questionbankHandler($(this), i);
                break;
            case 'template':
                interactionHandler($(this), i);
                break;
            case 'spacer':
                spacerHandler($(this));
                break;
            case 'external':
                externalHandler($(this));
                break;
            case 'assessmentsummary':
                assessmentHandler($(this));
                break;
            default:
                $('.PlayerContent').append('<div  class="BlankLayoutBlock ' + $(this).attr('templateClass') + '"></div>');
                break;
        }
        i++;
    });
}

//Build page audio html
function buildAudio() {
    if (currentPage.children('audio').length) {
        var src = currentPage.children('audio').attr('src');
        var autoplay = currentPage.children('audio').attr('autoplay');

        //Change colours if both header colours are white
        var toolbarColour1 = defaults.HeaderColour1;
        var toolbarColour2 = defaults.HeaderColour2;
        var progressColour = defaults.HeaderColour1 == defaults.NavColour1 ? '#ffffff' : defaults.NavColour1;

        if (defaults.HeaderColour1 == '#ffffff' && defaults.HeaderColour2 == '#ffffff') {
            toolbarColour1 = defaults.NavColour1;
            toolbarColour2 = defaults.NavColour1;
            progressColour = defaults.HeaderColour1;

            if (defaults.NavColour1 == '#ffffff') {
                progressColour = '#000000';
            }
        } else if (defaults.HeaderColour1 == '#ffffff') {
            toolbarColour1 = defaults.HeaderColour2;
        } else if (defaults.HeaderColour2 == '#ffffff') {
            toolbarColour2 = defaults.HeaderColour1;
        }

        var styles =
            '<style>.vjs-control-bar { background: linear-gradient(to right,' +
            toolbarColour1 +
            ',' +
            toolbarColour2 +
            '); }' +
            '.vjs-load-progress div, .vjs-play-progress { background: ' +
            progressColour +
            ' !important; } .video-js { background-color: transparent}' +
            '.vjs-play-progress:before { color: ' +
            progressColour +
            ' !important; } .vjs-poster { display: none; } .vjs-time-tooltip, .vjs-mouse-display, .vjs-fullscreen-control { display: none !important; }' +
            '.vjs-audio { width: 100%; height: 30px !important } .vjs-big-play-button { display: none !important } .vjs-control-bar { display: flex !important; border-radius: 5px; }</style>';

        var html =
            '<audio id="audio_player" class="video-js" preload="auto">' +
            '<source src="' +
            src +
            '.m4a" type="audio/m4a"></source><source src="' +
            src +
            '.mp3" type="audio/mp3"></source></audio>';

        $('.PlayerContent').append('<div class="AudioContainer" style="display: none">' + styles + html + '</div>');

        videojs('audio_player', {
            autoplay: autoplay == 'True',
            controls: true,
        });
    }
}

/*
 * CONTENT HANDLERS
 */

//TEXT CONTENT
function textHandler($content) {
    var size = $content.attr('size');
    var styles = $content.attr('styles');
    var textContent = $content.find('text');
    var text = $(textContent).text();
    var bColor = $(textContent).attr('backgroundColour');
    var templateClass = $content.attr('templateClass');
    var order = $content.attr('order');

    if (!templateClass) {
        styles += 'flex-grow:' + size + '; order:' + order + ';';
        templateClass = '';
    } else styles = '';

    $('.PlayerContent').append(
        '<div style="' +
        styles +
        'background-color: ' +
        bColor +
        ';" class="ContentBlock TextContent ' +
        templateClass +
        '" data-order="' +
        order +
        '">' +
        htmlUnescape(text) +
        '</div>'
    );

    //Load pdf viewer in iframe
    if (text.indexOf('iframePDF') != -1) {
        var pdfframe = $("div[data-order='" + order + "']")
            .find('#iframePDF')
            .last();
        pdfframe.attr('src', 'docs/pdf-viewer/web/viewer.html?file=../../../' + pdfframe.attr('src') + '#zoom=auto');
    }

    //Allow dynamic resizing of iframes
    $('iframe').iFrameResize();
}

//IMAGE CONTENT
function imageHandler($content) {
    var size = $content.attr('size');
    var styles = $content.attr('styles');
    var imageContent = $content.find('image');
    var templateClass = $content.attr('templateClass');

    if (!templateClass) {
        styles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';';
        templateClass = '';
    } else styles = '';

    //Styles to position image relative to block and other flex content
    var imageScale = $(imageContent).attr('imageScale');
    var altText = $(imageContent).attr('imageAlt');
    var src = $(imageContent).text();

    $('.PlayerContent').append(
        '<div style="' +
        styles +
        '" data-align="' +
        imageScale +
        '" class="ContentBlock ImageContent ' +
        templateClass +
        '"><img src="' +
        src +
        '" alt="' +
        altText +
        '"/></div>'
    );
}

//VIDEO CONTENT
function videoHandler($content, contentNo) {
    var size = $content.attr('size');
    var blockStyles = $content.attr('styles');
    var mediaType = $content.find('video').length > 0 ? 'video' : 'audio';
    var templateClass = $content.attr('templateClass');
    var legacy = $content.find(mediaType).attr('legacy');
    var fileType = $content.find(mediaType).attr('fileType');
    var poster = htmlUnescape($content.find(mediaType).attr('posterSrc'));
    var showPoster = $content.find(mediaType).attr('showPoster');
    var autoplay = $content.find(mediaType).attr('autoplay');
    var loop = $content.find(mediaType).attr('loop');
    var controls = $content.find(mediaType).attr('controls');
    var src = $content.find(mediaType).text();
    var playerId = 'video_player_' + contentNo;

    if (!templateClass) {
        blockStyles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';';
        templateClass = '';
    } else blockStyles = '';

    //Don't try to load dash for legacy streams
    var mpd = '';
    if (legacy == 'False' && !isSafari) {
        mpd = '<source src="' + src + '.mpd' + '" type="application/dash+xml"></source>';
    }

    //Build video/audio html
    var styles = '';
    var html = '';

    //Change colours if both header colours are white
    var toolbarColour1 = defaults.HeaderColour1;
    var toolbarColour2 = defaults.HeaderColour2;
    var progressColour =
        defaults.HeaderColour1 == defaults.NavColour1 || defaults.HeaderColour2 == defaults.NavColour1 ? '#ffffff' : defaults.NavColour1;

    if (defaults.HeaderColour1 == '#ffffff' && defaults.HeaderColour2 == '#ffffff') {
        toolbarColour1 = defaults.NavColour1;
        toolbarColour2 = defaults.NavColour1;
        progressColour = defaults.HeaderColour1;

        if (defaults.NavColour1 == '#ffffff') {
            progressColour = '#000000';
        }
    } else if (defaults.HeaderColour1 == '#ffffff') {
        toolbarColour1 = defaults.HeaderColour2;
    } else if (defaults.HeaderColour2 == '#ffffff') {
        toolbarColour2 = defaults.HeaderColour1;
    }

    if (mediaType == 'video') {
        styles =
            '<style>.vjs-control-bar { background: linear-gradient(to right,' +
            toolbarColour1 +
            ',' +
            toolbarColour2 +
            '); }' +
            '.vjs-load-progress div, .vjs-play-progress { background: ' +
            progressColour +
            ' !important; }' +
            '.vjs-play-progress:before { color: ' +
            progressColour +
            ' !important; }' +
            '.video-js .vjs-control { color: ' +
            progressColour +
            ' !important; } </style>';

        html =
            '<div class="ContentBlock VideoContent ' +
            templateClass +
            '" style="' +
            blockStyles +
            '"><video id="' +
            playerId +
            '" class="video-js" preload="auto" ' +
            poster +
            '>' +
            mpd +
            (mobile
                ? '<source src="' + (legacy == 'True' ? src.replace('vod', 'hls-vod') : src) + '.m3u8' + '" type="application/x-mpegURL"></source>'
                : '') +
            '<source src="' +
            src +
            '.' +
            fileType +
            '" type="video/mp4"></source></video></div>';
    } else {
        poster = poster.replace('vm/', '');
        styles =
            '<style>.vjs-control-bar { background: linear-gradient(to right,' +
            toolbarColour1 +
            ',' +
            toolbarColour2 +
            '); }' +
            '.vjs-load-progress div, .vjs-play-progress { background: ' +
            progressColour +
            ' !important; } .video-js { background-color: #000}' +
            '.vjs-play-progress:before { color: ' +
            progressColour +
            ' !important; } .vjs-audio .vjs-poster { display: none; }' +
            '.vjs-time-tooltip, .vjs-mouse-display, .vjs-fullscreen-control { display: none !important; }</style>';

        html =
            '<div class="ContentBlock VideoContent ' +
            templateClass +
            '" style="' +
            blockStyles +
            '"><audio id="' +
            playerId +
            '" class="video-js" preload="auto" ' +
            poster +
            '>' +
            '<source src="' +
            src +
            '.m4a" type="audio/m4a"></source><source src="' +
            src +
            '.mp3" type="audio/mp3"></source></audio></div>';
    }

    //Write html to page
    $('.PlayerContent').append(styles + html);

    //Initialise video.js player
    var options = {
        aspectRatio: '16:9',
        autoplay: autoplay == 'True' || controls == 'False' ? 'any' : false,
        controls: controls == 'True',
        loop: loop == 'True',
    };

    videojs(playerId, options, function () {
        if (!showPoster) {
            document.getElementById(playerId).classList.add('vjs-has-started');
        }
    });

    //Fade audio poster in/out on play/pause
    $('audio')
        .on('play', function () {
            $(this).parent().find('.vjs-poster').fadeIn(300);
            $(this).parent().find('.vjs-big-play-button').fadeOut(300);
        })
        .on('pause', function () {
            $(this).parent().find('.vjs-poster').fadeOut(300);
            $(this).parent().find('.vjs-big-play-button').fadeIn(300);
        });
}

//VIDEO OVERLAY CONTENT
function overlayvideoHandler($content, contentNo) {
    var size = $content.attr('size');
    var blockStyles = $content.attr('styles');
    var mediaType = 'OverlayVideo';
    var legacy = $content.find(mediaType).attr('legacy');
    var fileType = $content.find(mediaType).attr('fileType');
    var src = $content.find(mediaType).attr('src');
    var playerId = 'video_player_' + contentNo;
    var templateClass = $content.attr('templateClass');

    if (!templateClass) {
        blockStyles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';';
        templateClass = '';
    } else blockStyles = '';

    var scenes = '';

    currentPage.find('OverlayScene').each(function () {
        var Id = $(this).attr('VideoOverlayId');
        var Template = $(this).attr('Template');
        var StartTime = $(this).attr('StartTime');
        var EndTime = $(this).attr('EndTime');
        var BackgroundColour = $(this).attr('BackgroundColour');
        var Text = $(this).text();

        var scene =
            '<div id="Overlay_' +
            Id +
            '" ' +
            'Style="background:' +
            BackgroundColour +
            '"' +
            'class="VideoOverlay ' +
            Template +
            '" ' +
            'data-item-id="' +
            Id +
            '" ' +
            'data-item-start="' +
            StartTime +
            '" ' +
            'data-item-end="' +
            EndTime +
            '">' +
            '<div class="VideoOverlayEditButton"></div>' +
            '<div id="OverlayEditor_' +
            Id +
            '" class=" droppable ckeditor_text" data-ImageDrop="OverlayScene" data-editor="OverlayScene">' +
            Text +
            '</div></div>';
        scenes = scenes + scene;
    });

    var playerScript = "<script type='text/javascript'>";
    playerScript = playerScript + "$('#" + playerId + "').find('.vjs-fullscreen-control').remove();";
    playerScript =
        playerScript +
        "document.getElementById('" +
        playerId +
        "').addEventListener('timeupdate',function () {var videoplayer = this;$('.VideoOverlay').each(function (index) {var start = parseInt($(this).attr('data-item-start'));var end = parseInt($(this).attr('data-item-end'));if (videoplayer.currentTime > start && videoplayer.currentTime < end) {$(this).fadeIn();}else {$(this).fadeOut();}});});";
    playerScript = playerScript + '</script>';

    //Don't try to load dash for legacy streams
    var mpd = '';
    if (legacy == 'False') {
        mpd = '<source src="' + src + '.mpd' + '" type="application/dash+xml"></source>';
    }

    //Build video/audio html
    var styles = '';
    var html = '';

    //Change colours if both header colours are white
    var toolbarColour1 = defaults.HeaderColour1;
    var toolbarColour2 = defaults.HeaderColour2;
    var progressColour =
        defaults.HeaderColour1 == defaults.NavColour1 || defaults.HeaderColour2 == defaults.NavColour1 ? '#ffffff' : defaults.NavColour1;

    if (defaults.HeaderColour1 == '#ffffff' && defaults.HeaderColour2 == '#ffffff') {
        toolbarColour1 = defaults.NavColour1;
        toolbarColour2 = defaults.NavColour1;
        progressColour = defaults.HeaderColour1;

        if (defaults.NavColour1 == '#ffffff') {
            progressColour = '#000000';
        }
    } else if (defaults.HeaderColour1 == '#ffffff') {
        toolbarColour1 = defaults.HeaderColour2;
    } else if (defaults.HeaderColour2 == '#ffffff') {
        toolbarColour2 = defaults.HeaderColour1;
    }

    styles =
        '<style>.vjs-control-bar { background: linear-gradient(to right,' +
        toolbarColour1 +
        ',' +
        toolbarColour2 +
        '); }' +
        '.vjs-load-progress div, .vjs-play-progress { background: ' +
        progressColour +
        ' !important; }' +
        '.vjs-play-progress:before { color: ' +
        progressColour +
        ' !important; }' +
        '.video-js .vjs-control { color: ' +
        progressColour +
        ' !important; } </style>';

    html =
        '<div class="ContentBlock VideoContent ' +
        templateClass +
        '" style="' +
        blockStyles +
        '">' +
        scenes +
        '<video id="' +
        playerId +
        '" class="video-js" preload="auto">' +
        mpd +
        '<source src="' +
        (legacy == 'True' ? src.replace('vod', 'hls-vod') : src) +
        '.m3u8' +
        '" type="application/x-mpegURL"></source><source src="' +
        src +
        '.' +
        fileType +
        '" type="video/mp4"></source></video></div>';

    //Write html to page
    $('.PlayerContent').append(styles + playerScript + html);

    //Initialise video.js player
    videojs('video_player_' + contentNo, {
        controls: true,
    });
}

//INTERACTION CONTENT
function interactionHandler($content, contentNo) {
    var size = $content.attr('size');
    var styles = $content.attr('styles');
    var interactionContent = $content.find('interaction');
    var interactionName = $content.find('interaction').attr('name');
    var src = $(interactionContent).text();
    var templateClass = $content.attr('templateClass');

    if (!templateClass) {
        styles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';';
        templateClass = '';
    } else styles = '';

    //Append interaction to page
    $('.PlayerContent').append(
        '<div id="template_' +
        contentNo +
        '" class="ContentBlock TemplateContent ' +
        templateClass +
        '" style="' +
        styles +
        '">' +
        '<iframe id="iframe_' +
        contentNo +
        '" src="' +
        src +
        '" frameborder="0" scrolling="no" width="100%" height="100%"></iframe></div>'
    );

    //Once the interaction iframe has loaded build the interaction
    $('#iframe_' + contentNo).load(function () {
        //Set PLAY_MODE and build the interaction
        $(this)[0].contentWindow['PLAY_MODE'] = true;
        $(this)[0].contentWindow.StopContentEdit();

        var fnstring = 'build' + interactionName + 'Interaction';
        var fn = $(this)[0].contentWindow[fnstring];
        if (typeof fn === 'function') {
            fn();
        }

        //Apply theme colours
        var navColour = defaults.NavColour1 == '#ffffff' ? defaults.NavColour2 : defaults.NavColour1;

        $('#iframe_' + contentNo)
            .contents()
            .find('head')
            .append(
                '<style type="text/css">.accent-color-text { color: ' +
                navColour +
                ' !important; } .accent-color-border { border-color: ' +
                navColour +
                ' !important; } .accent-color-background { background-color: ' +
                navColour +
                ' !important; }</style>'
            );

        //Apply font classes
        if (!accessibilitySize && !accessibilityColour) {
            $('#iframe_' + contentNo)
                .contents()
                .find('body')
                .addClass(defaults.Font + ' size' + defaults.FontSize);
        } else {
            if (accessibilitySize) $('.' + accessibilitySize).click();
            if (accessibilityColour) $('.' + accessibilityColour).click();
        }

        //Set iframe height to fit content
        $(this).iFrameResize();

        //Show interaction
        $(this).fadeIn(300);
    });
}

//QUESTION CONTENT
function questionHandler($content, contentNo) {
    var size = $content.attr('size');
    var styles = $content.attr('styles');
    var questionHtml = $content.find('question').text();
    var questionId = $content.find('question').attr('id');
    var backgroundColour = $content.find('question').attr('style');
    var templateClass = $content.attr('templateClass');

    var randomisation = 'True';
    randomisation = $content.find('question').attr('randomisation');

    if (!templateClass) {
        styles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';';
        templateClass = '';
    } else styles = '';

    //Append content
    $('.PlayerContent').append(
        '<div id="question_' +
        contentNo +
        '" class="ContentBlock QuestionContent ' +
        templateClass +
        '" style="' +
        styles +
        ' background: ' +
        backgroundColour +
        '">' +
        htmlUnescape(questionHtml) +
        '</div>'
    );

    //Shuffle answer order
    if (randomisation == 'True' && defaults.ScoringMethod != 'FlagScoring')
        $('#question_' + contentNo)
            .find('.answer-accordion')
            .shuffle();

    //Setup listener for answer selection
    CheckAnswers();

    //Check if questions has been previously answered
    ResumeResults($('#question_' + contentNo), questionId);

    //Disable the next button until question is complete
    $('.nextButton').addClass('navDisabled');
}

//QUESTION BANK CONTENT
function questionbankHandler($content, contentNo) {
    var size = $content.attr('size');
    var styles = $content.attr('styles');
    var questionBankHtml = $content.find('questionBank').text();
    var questionBankId = $content.find('questionBank').attr('id');
    var backgroundColour = $content.find('questionBank').attr('style');
    var templateClass = $content.attr('templateClass');
    var setQuestions = $content.find('questionBank').attr('questionCount');

    if (!templateClass) {
        styles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';';
        templateClass = '';
    } else styles = '';

    //Append content
    $('.PlayerContent').append(
        '<div id="questionbank_' +
        contentNo +
        '" class="ContentBlock QuestionBankContent ' +
        templateClass +
        '" style="' +
        styles +
        ' background: ' +
        backgroundColour +
        '">' +
        htmlUnescape(questionBankHtml) +
        '</div>'
    );

    //Add counter to show progress
    $('.QuestionBank').append('<div class="QuestionBankCounter">Question 1 of ' + setQuestions + '</div><span class="NextQuestionButton">Next Question</span>');

    //Get which questions are going to be asked
    var questions = BankedQuestionsSet.filter(function (item) {
        return item.BankId == questionBankId;
    })[0].LabQuestionIds;

    //Remove questions not in assessed set
    $('#questionbank_' + contentNo)
        .find('.BankQuestion')
        .each(function () {
            var qId = parseInt($(this).attr('data-id'));

            var exists = false;
            for (var i = 0; i < questions.length; i++) {
                if (questions[i] == qId) {
                    exists = true;
                }
            }

            if (!exists) {
                $(this).remove();
            }
        });

    //Shuffle remaining questions and show first question
    $('.BankQuestion').shuffle();
    $('.BankQuestion:first').show();

    //Shuffle remaining question and answer order and show first question
    $('#questionbank_' + contentNo)
        .find('.BankQuestion')
        .each(function () {
            if ($(this).attr('data-randomisation') == 'True') {
                $(this).find('.answer-accordion').shuffle();
            }
        });

    //Setup listener for answer selection
    CheckAnswers();

    //Show question result if previously answered
    $('#questionbank_' + contentNo)
        .find('.BankQuestion')
        .each(function () {
            var qId = parseInt($(this).attr('data-id'));
            ResumeResults($(this), qId);
        });

    //Disable the nav buttons until question is complete
    $('.nextButton, .backButton').addClass('navDisabled');
}

//SPACER CONTENT
function spacerHandler($content) {
    var size = $content.attr('size');
    var styles = $content.attr('styles');
    styles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';';

    $('.PlayerContent').append('<div style="' + styles + '" class="ContentBlock SpacerContent"></div>');
}

//EXTERNAL CONTENT
function externalHandler($content) {
    var size = $content.attr('size');
    var styles = $content.attr('styles');
    var imageContent = $content.find('external');
    var templateClass = $content.attr('templateClass');

    if (!templateClass) {
        styles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';';
        templateClass = '';
    } else styles = '';

    //Styles to position image relative to block and other flex content
    var iframeSrc = $(imageContent).attr('src');
    var iframeHeight = $(imageContent).attr('height');

    $('.PlayerContent').append(
        '<div style="' +
        styles +
        '" data-height="' +
        iframeHeight +
        '" class="ContentBlock ExternalContent ' +
        templateClass +
        '"><iframe src="' +
        iframeSrc +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen/></div>'
    );
}

//ASSESSMENT SUMMARY
function assessmentHandler($content) {
    if (window.location.host == 'connect.learnprouk.com') {
        assessmentBlock = $content;
        window.parent.postMessage(
            {
                action: 'EXECUTE_FUNCTION',
                function: 'CalculateScore',
                parameters: null,
                return: true,
            },
            '*'
        );
    } else {
        var score = Math.round(parseInt(CalculateScore()));
        $('.PlayerContent').append(loadAssessmentPage($content, score, SubmittedInteractions));
    }
}

function loadAssessmentPage($content, score, attemptedQuestions) {
    var passmark = parseInt(defaults.PassMark);
    var bg = '';
    var passcomment = '';

    //If there is no score return to beginning
    if (attemptedQuestions == 0 && (!score || score == 0) && !localhost) {
        ResetModule();
        return;
    }

    if (score >= passmark) {
        passcomment =
            '<p id="AssessmentStatus" class="AssessmentStatus animated zoomIn delay-2s">Congratulations!</p><p id="AssessmentSubStatus" class="AssessmentSubStatus animated zoomIn delay-2s">You have passed this assessment</p>';
        bg = 'linear-gradient(to right,#24a558,#24a558)';
    } else {
        passcomment =
            '<p id="AssessmentStatus" class="AssessmentStatus animated zoomIn delay-2s">Sorry</p><p id="AssessmentSubStatus" class="AssessmentSubStatus animated zoomIn delay-2s">You have failed this assessment</p>';
        bg = 'linear-gradient(to right,#d24444,#d24444)';
    }

    var textBlock =
        '<div style="background: ' +
        bg +
        '; overflow:hidden;" class="TextContent ContentBlock">' +
        htmlUnescape($content.find('text').text()) +
        '</div>';
    textBlock = textBlock.replace('max-height:270px; height:auto !important;', 'height: 270px;');

    var pageContentAssessment =
        '<div><center>' +
        passcomment +
        '<div class="AssessmentScoreBox"><div class="AssessmentScoreContainer animated jackInTheBox delay-1s"><p class="AssessmentScoreTitle">Your Score</p><p id="AssessmentScoreAchieved" class="AssessmentScore">' +
        Math.round(score) +
        '%</p></div><div class="AssessmentScoreContainer animated jackInTheBox "><p class="AssessmentScoreTitle">Pass Mark</p><p id="AssessmentScoreRequired" class="AssessmentScore">' +
        passmark +
        '%</p></div></div></center></div>';

    //Disable navigation on summary page
    $('.navButton').off();
    $('.nextButton').addClass('navDisabled');
    $('.backButton').addClass('navDisabled');

    return textBlock.replace('LPASSESSMENTSUMMARYBLOCK', pageContentAssessment);
}
