/*
 * learnPro Command Framework (c)
 */

/*
 * PAGE BUILDING
 */


//Build content from xml and write to page
function buildPage() {
    //Clear all content
    $('.PlayerContainer').hide();
    $('.PlayerContent').html("");

    //Page audio
    buildAudio();

    //Apply page background colour
    var colour = $(currentPage).find('background').attr('colour');
    if ($(currentPage).find('background').attr('type') == 'Colour') {
        $('.PlayerContent').css({
            'background-image': '',
            'background-color': colour
        });
    } else {
        var src = $(currentPage).find('background').attr('src');
        $('.PlayerContent').addClass('box-shadow');
        $('.PlayerContent').css({
            'background-image': 'url("' + src + '")',
            'background-color': colour
        });
    }

    //Show box shadow if page background is not transparent
    if ($('.PlayerContent').css('background-color') != 'rgba(0, 0, 0, 0)' && $('.PlayerContent').css('background-color') != 'rgba(255, 255, 255, 0)')
        $('.PlayerContent').addClass('box-shadow');
    else
        $('.PlayerContent').removeClass('box-shadow');

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
            case 'template':
                interactionHandler($(this), i);
                break;
            case 'assessmentsummary':
                assessmentHandler($(this));
                break;
            case 'external':
                externalHandler($(this));
                break;
            default:
                alert("Missing or unrecognised Content Type");
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
        var progressColour = (defaults.HeaderColour1 == defaults.NavColour1) ? "#ffffff" : defaults.NavColour1;

        if (defaults.HeaderColour1 == '#ffffff' && defaults.HeaderColour2 == '#ffffff') {
            toolbarColour1 = defaults.NavColour1;
            toolbarColour2 = defaults.NavColour1;
            progressColour = defaults.HeaderColour1;

            if (defaults.NavColour1 == "#ffffff") {
                progressColour = "#000000";
            }
        }
        else if (defaults.HeaderColour1 == '#ffffff') {
            toolbarColour1 = defaults.HeaderColour2;
        }
        else if (defaults.HeaderColour2 == '#ffffff') {
            toolbarColour2 = defaults.HeaderColour1;
        }

        var styles = '<style>.vjs-control-bar { background: linear-gradient(to right,' + toolbarColour1 + ',' + toolbarColour2 + '); }' +
            '.vjs-load-progress div, .vjs-play-progress { background: ' + progressColour + ' !important; } .video-js { background-color: transparent}' +
            '.vjs-play-progress:before { color: ' + progressColour + ' !important; } .vjs-poster { display: none; } .vjs-time-tooltip, .vjs-mouse-display, .vjs-fullscreen-control { display: none !important; }' +
            '.vjs-audio { width: 100%; height: 30px !important } .vjs-big-play-button { display: none !important } .vjs-control-bar { display: flex !important; border-radius: 5px; }</style>';

        var html = '<audio id="audio_player" class="video-js" preload="auto">' +
            '<source src="' + src + '.m4a" type="audio/m4a"></source><source src="' + src + '.mp3" type="audio/mp3"></source></audio>';

        $('.PlayerContent').append('<div class="AudioContainer">' + styles + html + '</div>');

        videojs('audio_player', {
            autoplay: (autoplay == "True"),
            controls: true
        });
    }
}



/*
 * BLOCK TRANSITIONS
 */

//Handles transitions for image and text blocks if it has been chosen.
function BlockTransitions() {

    $('.ContentBlock').each(function () {
        var transitionType = $(this).attr('data-transition-type');
        var transitionDelay = parseInt($(this).attr('data-transition-delay')) * 1000;
        var transitionPeriod = parseInt($(this).attr('data-transition-period')) * 1000;

        var height = $(this).show().outerHeight();
        $(this).hide();

        switch (transitionType) {
            case "None":
                $(this).show();
                break;
            case "Show":
                $(this).delay(transitionDelay).fadeIn(0);
                break;
            case "FadeIn":
                $(this).delay(transitionDelay).fadeIn(transitionPeriod);
                break;
            case "ExpandTopLeft":
                $(this).children().each(function () {
                    $(this).fadeOut().delay(transitionDelay).fadeIn();
                });

                $(this).delay(transitionDelay).show('size', {
                    origin: ["top", "left"]
                }, transitionPeriod);
                break;
            case "ExpandTopRight":
                $(this).children().each(function () {
                    $(this).children().each(function () {
                        $(this).fadeOut().delay(transitionDelay).fadeIn();
                    });
                });

                $(this).delay(transitionDelay).show('size', {
                    origin: ["top", "right"]
                }, transitionPeriod);
                break;
            case "ExpandBotLeft":
                $(this).children().each(function () {
                    $(this).fadeOut().delay(transitionDelay).fadeIn();
                });

                $(this).delay(transitionDelay).show('size', {
                    origin: ["bottom", "left"]
                }, transitionPeriod);
                break;
            case "ExpandBotRight":
                $(this).children().each(function () {
                    $(this).fadeOut().delay(transitionDelay).fadeIn();
                });

                $(this).delay(transitionDelay).show('size', {
                    origin: ["bottom", "right"]
                }, transitionPeriod);
                break;
            case "SlideFromLeft":
                var originalMargin = $(this).css('margin-left');
                var newMargin = 0 - 40 - $(this).width();
                $(this).css('margin-left', newMargin.toString() + 'px');
                $(this).show();
                $(this).stop().delay(transitionDelay).animate({
                    'margin-left': originalMargin
                }, transitionPeriod, 'swing');
                break;
            case "SlideFromRight":
                var originalMargin = $(this).css('margin-left');
                var newMargin = 960 + 40 + $(this).width();
                $(this).css('margin-left', newMargin.toString() + 'px');
                $(this).show();
                $(this).stop().delay(transitionDelay).animate({
                    'margin-left': originalMargin
                }, transitionPeriod, 'swing');
                break;
            case "SlideFromTop":
                var originalMargin = $(this).css('margin-top');
                var newMargin = 0 - 40 - $(this).height();
                $(this).css('margin-top', newMargin.toString() + 'px');
                $(this).show();
                $(this).stop().delay(transitionDelay).animate({
                    'margin-top': originalMargin
                }, transitionPeriod, 'swing');
                break;
            case "SlideFromBot":
                var originalMargin = $(this).css('margin-top');
                var newMargin = 600 + 40 + $(this).height();
                $(this).css('margin-top', newMargin.toString() + 'px');
                $(this).show();
                $(this).stop().delay(transitionDelay).animate({
                    'margin-top': originalMargin
                }, transitionPeriod, 'swing');
                break;
            case "OpenFromTop":
                var height;

                if ($(this).hasClass('TextContent')) {
                    height = $(this).height() + 22;
                } else {
                    height = $(this).height();
                }

                $(this).css('height', '0px');
                $(this).hide();

                if (height == 0) {
                    height = 270;
                }

                $(this).stop().delay(transitionDelay).fadeIn(0).animate({
                    'height': height
                }, transitionPeriod, 'swing');
                break;
            case "OpenFromLeft":
                var width;

                if ($(this).hasClass('TextContent')) {
                    width = $(this).width() + 22;
                } else {
                    width = $(this).width();
                }
                $(this).css('width', '0px');
                $(this).hide();
                $(this).stop().delay(transitionDelay).fadeIn(0).animate({
                    'width': width
                }, transitionPeriod, 'swing');
                break;
            default:
                $(this).show();
                break;
        }
    });
}



/*
 * CONTENT HANDLERS
 */

//TEXT CONTENT
function textHandler($content) {
    var transition = $content.find('transition');
    var type = transition.attr('type');
    var delay = transition.attr('delay');
    var period = transition.attr('period');

    var styles = $content.attr('style');
    var resize = $content.attr('resize');
    var bColor = $content.attr('background-color');
    var text = $content.find('text').text();

    if (resize == 'False') {
        styles = styles.replace(/height:(|\s)auto.*?;/g, "");
        styles = styles.replace('max-height', 'height');
    }

    $('.PlayerContent').append('<div style="' + styles + ' position: absolute; background-color: ' + bColor + '; display: none;" data-transition-type="' + type +
        '" data-transition-delay="' + delay + '" data-transition-period="' + period + '" class="TextContent ContentBlock ckeditor_content"><div style="position: relative;' + (text.indexOf('iframePDF') != -1 ? 'height:100%': '') + '">' + htmlUnescape(text) + '</div></div>');


    //Load pdf viewer in iframe
    if (text.indexOf('iframePDF') != -1) {
        var pdfframe = $('#iframePDF').last();
        pdfframe.attr('src', 'docs/pdf-viewer/web/viewer.html?file=../../../' + pdfframe.attr('src') + '#zoom=auto');
    }
}


//IMAGE CONTENT
function imageHandler($content) {
    var transition = $content.find('transition');
    var type = transition.attr('type');
    var delay = transition.attr('delay');
    var period = transition.attr('period');
    var styles = $content.attr('style');

    var imageScale = $content.find('image').attr('imageScale');
    var altText = $content.find('image').attr('imageAlt');
    var src = $content.find('image').text();

    $('.PlayerContent').append('<div style="position: relative; overflow: hidden; ' + styles + ' display: none;" data-transition-type="' + type + '" data-transition-delay="' + delay + '" data-transition-period="' + period + '" data-align="' + imageScale + '" class="ContentBlock ImageContent"><img src="' + src + '" alt="' + altText + '"/></div>');
}


//OVERLAYVIDEO CONTENT
function overlayvideoHandler($content, blockNo) {
    var blockStyles = $content.attr('style');
    var mediaType = "OverlayVideo";
    var legacy = $content.find(mediaType).attr('legacy');
    var fileType = $content.find(mediaType).attr('fileType');
    var src = $content.find(mediaType).attr('src');
    var playerId = 'video_player_' + blockNo;

    var scenes = '';

    currentPage.find('OverlayScene').each(function () {
        var Id = $(this).attr('VideoOverlayId');
        var Template = $(this).attr('Template');
        var StartTime = $(this).attr('StartTime');
        var EndTime = $(this).attr('EndTime');
        var BackgroundColour = $(this).attr('BackgroundColour');
        var Text = $(this).text();

        var scene = "<div id=\"Overlay_" +
            Id + "\" " +
            "Style=\"background:" + BackgroundColour + "\"" +
            "class=\"VideoOverlay " +
            Template + "\" " +
            "data-item-id=\"" +
            Id + "\" " +
            "data-item-start=\"" +
            StartTime + "\" " +
            "data-item-end=\"" +
            EndTime +
            "\">" +

            "<div class=\"VideoOverlayEditButton\"></div>" +
            "<div id=\"OverlayEditor_" + Id + "\" class=\" droppable ckeditor_text\" data-ImageDrop=\"OverlayScene\" data-editor=\"OverlayScene\">" +
            Text +
            "</div></div>";
        scenes = scenes + scene;
    });

    var playerScript = "<script type='text/javascript'>";
    playerScript = playerScript + "$('#" + playerId + "').find('.vjs-fullscreen-control').remove();"
    playerScript = playerScript + "document.getElementById('" + playerId + "').addEventListener('timeupdate',function () {var videoplayer = this;$('.VideoOverlay').each(function (index) {var start = parseInt($(this).attr('data-item-start'));var end = parseInt($(this).attr('data-item-end'));if (videoplayer.currentTime > start && videoplayer.currentTime < end) {$(this).fadeIn();}else {$(this).fadeOut();}});});"
    playerScript = playerScript + "</script>"

    //Don't try to load dash for legacy streams
    var mpd = '';
    if (legacy == "False" && !isSafari) {
        mpd = '<source src="' + src + '.mpd' + '" type="application/dash+xml"></source>';
    }

    //Get video styles depending on content block size
    var width = "960px";
    var height = "600px";
    var stylesList = blockStyles.split(';');
    for (var i = 0; i < stylesList.length; i++) {
        if (stylesList[i].indexOf("max-height") >= 0 || stylesList[i].indexOf("min-height") >= 0) {
            height = stylesList[i].substring((stylesList[i].indexOf(':') + 1), (stylesList[i].indexOf(':') + 6)).replace(/^\s+|\s+$/g, '');
        }

        if (stylesList[i].indexOf("width") >= 0) {
            width = stylesList[i].substring((stylesList[i].indexOf(':') + 1), (stylesList[i].indexOf(':') + 6)).replace(/^\s+|\s+$/g, '');
        }
    }
    blockStyles = blockStyles.replace('height:auto !important;', '').replace('min-height', 'height').replace('max-height', 'height');
    if (width == "920px" && height == "560px") {
        blockStyles = blockStyles.replace('560px', '600px');
        blockStyles = blockStyles.replace('920px', '960px');
    }

    //Build video/audio html
    var styles = '';
    var html = '';

    //Change colours if both header colours are white
    var toolbarColour1 = defaults.HeaderColour1;
    var toolbarColour2 = defaults.HeaderColour2;
    var progressColour = (defaults.HeaderColour1 == defaults.NavColour1 || defaults.HeaderColour2 == defaults.NavColour1) ? "#ffffff" : defaults.NavColour1;

    if (defaults.HeaderColour1 == '#ffffff' && defaults.HeaderColour2 == '#ffffff') {
        toolbarColour1 = defaults.NavColour1;
        toolbarColour2 = defaults.NavColour1;
        progressColour = defaults.HeaderColour1;

        if (defaults.NavColour1 == "#ffffff") {
            progressColour = "#000000";
        }
    }
    else if (defaults.HeaderColour1 == '#ffffff') {
        toolbarColour1 = defaults.HeaderColour2;
    }
    else if (defaults.HeaderColour2 == '#ffffff') {
        toolbarColour2 = defaults.HeaderColour1;
    }

    styles = '<style>.vjs-control-bar { background: linear-gradient(to right,' + toolbarColour1 + ',' + toolbarColour2 + '); }' +
        '.vjs-load-progress div, .vjs-play-progress { background: ' + progressColour + ' !important; }' +
        '.vjs-play-progress:before { color: ' + progressColour + ' !important; }</style > ';

    html = '<div style="' + blockStyles + '">' + scenes + '<video id="' + playerId + '" class="video-js" preload="auto">' +
        mpd + '<source src="' + (legacy == "True" ? src.replace('vod', 'hls-vod') : src) + '.m3u8' + '" type="application/x-mpegURL"></source><source src="' + src + '.' + fileType + '" type="video/mp4"></source></video></div>';

    $('.PlayerContent').append(styles + playerScript + html);

    //Initialise video.js player
    videojs(playerId, {
        controls: true
    });

}


//VIDEO CONTENT
function videoHandler($content, blockNo) {
    var blockStyles = $content.attr('style');
    var mediaType = ($content.find('video').length > 0) ? "video" : "audio";
    var legacy = $content.find(mediaType).attr('legacy');
    var fileType = $content.find(mediaType).attr('fileType');
    var poster = htmlUnescape($content.find(mediaType).attr('posterSrc'));
    var showPoster = $content.find(mediaType).attr('showPoster');
    var autoplay = $content.find(mediaType).attr('autoplay');
    var loop = $content.find(mediaType).attr('loop');
    var controls = $content.find(mediaType).attr('controls');
    var src = $content.find(mediaType).text();
    var playerId = 'video_player_' + blockNo;

    //Don't try to load dash for legacy streams
    var mpd = '';
    if (legacy == "False") {
        mpd = '<source src="' + src + '.mpd' + '" type="application/dash+xml"></source>';
    }

    //Get video styles depending on content block size
    var width = "960px";
    var height = "600px";
    var stylesList = blockStyles.split(';');
    for (var i = 0; i < stylesList.length; i++) {
        if (stylesList[i].indexOf("max-height") >= 0 || stylesList[i].indexOf("min-height") >= 0) {
            height = stylesList[i].substring((stylesList[i].indexOf(':') + 1), (stylesList[i].indexOf(':') + 6)).replace(/^\s+|\s+$/g, '');
        }

        if (stylesList[i].indexOf("width") >= 0) {
            width = stylesList[i].substring((stylesList[i].indexOf(':') + 1), (stylesList[i].indexOf(':') + 6)).replace(/^\s+|\s+$/g, '');
        }
    }
    blockStyles = blockStyles.replace('height:auto !important;', '').replace('min-height', 'height').replace('max-height', 'height');
    if (width == "920px" && height == "560px") {
        blockStyles = blockStyles.replace('560px', '600px');
        blockStyles = blockStyles.replace('920px', '960px');
    }

    //Build video/audio html
    var styles = '';
    var html = '';

    //Change colours if both header colours are white
    var toolbarColour1 = defaults.HeaderColour1;
    var toolbarColour2 = defaults.HeaderColour2;
    var progressColour = (defaults.HeaderColour1 == defaults.NavColour1 || defaults.HeaderColour2 == defaults.NavColour1) ? "#ffffff" : defaults.NavColour1;

    if (defaults.HeaderColour1 == '#ffffff' && defaults.HeaderColour2 == '#ffffff') {
        toolbarColour1 = defaults.NavColour1;
        toolbarColour2 = defaults.NavColour1;
        progressColour = defaults.HeaderColour1;

        if (defaults.NavColour1 == "#ffffff") {
            progressColour = "#000000";
        }
    }
    else if (defaults.HeaderColour1 == '#ffffff') {
        toolbarColour1 = defaults.HeaderColour2;
    }
    else if (defaults.HeaderColour2 == '#ffffff') {
        toolbarColour2 = defaults.HeaderColour1;
    }

    if (mediaType == "video") {
        styles = '<style>.vjs-control-bar { background: linear-gradient(to right,' + toolbarColour1 + ',' + toolbarColour2 + '); }' +
            '.vjs-load-progress div, .vjs-play-progress { background: ' + progressColour + ' !important; }' +
            '.vjs-play-progress:before { color: ' + progressColour + ' !important; }</style > ';

        html = '<div style="' + blockStyles + '"><video id="' + playerId + '" class="video-js" preload="auto" ' + poster + '>' +
            mpd + (mobile ? '<source src="' + (legacy == "True" ? src.replace('vod', 'hls-vod') : src) + '.m3u8' + '" type="application/x-mpegURL"></source>' : '') + '<source src="' + src + '.' + fileType + '" type="video/mp4"></source></video></div>';
    } else {
        poster = poster.replace('vm/', '');
        styles = '<style>.vjs-control-bar { background: linear-gradient(to right,' + toolbarColour1 + ',' + toolbarColour2 + '); }' +
            '.vjs-load-progress div, .vjs-play-progress { background: ' + progressColour + ' !important; } .video-js { background-color: #000}' +
            '.vjs-play-progress:before { color: ' + progressColour + ' !important; } .vjs-audio .vjs-poster { display: none; }' +
            '.vjs-time-tooltip, .vjs-mouse-display, .vjs-fullscreen-control { display: none !important; }</style>';

        html = '<div style="' + blockStyles + '"><audio id="' + playerId + '" class="video-js" preload="auto" ' + poster + '>' +
            '<source src="' + src + '.m4a" type="audio/m4a"></source><source src="' + src + '.mp3" type="audio/mp3"></source></audio></div>';
    }

    $('.PlayerContent').append(styles + html);

    //Initialise video.js player
    var options = {
        "aspectRatio": "16:9",
        "autoplay": (autoplay == "True" || controls == "False") ? "any" : false,
        "controls": (controls == "True"),
        "loop": (loop == "True")
    };

    videojs(playerId, options, function () {
        if (!showPoster) {
            document.getElementById(playerId).classList.add('vjs-has-started');
        }
    });

    //Fade audio poster in/out on play/pause
    $('audio').on('play', function () {
        $(this).parent().find('.vjs-poster').fadeIn(300);
        $(this).parent().find('.vjs-big-play-button').fadeOut(300);
    }).on('pause', function () {
        $(this).parent().find('.vjs-poster').fadeOut(300);
        $(this).parent().find('.vjs-big-play-button').fadeIn(300);
    });
}


//INTERACTION CONTENT
function interactionHandler($content, contentNo) {
    var interactionContent = $content.find('interaction');
    var interactionType = $content.find('interaction').attr('type');
    var interactionName = $content.find('interaction').attr('name');

    var src = $(interactionContent).text();
    var blockStyles = $content.attr('style');
    var interactionStyles = "";
    var iframeHeight = '600';
    var scrolling = 'yes';

    if (blockStyles.indexOf('width:450px') != -1) {
        interactionStyles = ".interaction-container-fixed {width:100%;padding:0;}";
        iframeHeight = '560';
    } else if (blockStyles.indexOf('width:920px') != -1 && blockStyles.indexOf('height:560px') != -1) {
        blockStyles = "";
    } else if (blockStyles.indexOf('height:270') != -1) {
        iframeHeight = '270';
    }

    
    if (blockStyles.indexOf('margin:115px 10px 20px 20px;') != -1) {
        iframeHeight = '470';
    }



    if (interactionType == 'FixedWidth') {
        scrolling = 'no';
    }

    //Append interaction to page
    $('.PlayerContent').append('<div id="template_' + contentNo + '" class="ContentBlock TemplateContent" style="' + blockStyles + '"><div class="interactionLoader"><img src="images/laba_loading.gif"/></div></div>');
    $('#template_' + contentNo).append('<iframe id="iframe_' + contentNo + '" style="display: none" src="' + src + '" frameborder="0" width="100%" height="' + iframeHeight + '" scrolling="' + scrolling + '"></iframe>');

    //Once the interaction iframe has loaded build the interaction
    $('#iframe_' + contentNo).load(function () {
        var iframe = $(this);

        //Set PLAY_MODE and build the interaction
        $(this)[0].contentWindow['PLAY_MODE'] = true;
        $(this)[0].contentWindow.StopContentEdit();

        var fnstring = 'build' + interactionName + 'Interaction';
        var fn = $(this)[0].contentWindow[fnstring];
        if (typeof fn === "function") {
            fn();
        }

        //Apply theme colours
        $(iframe).contents().find('head').append('<style type="text/css">' + interactionStyles + '.accent-color-text { color: ' + defaults.NavColour1 + ' !important; } .accent-color-border { border-color: ' + defaults.NavColour1 + ' !important; } .accent-color-background { background-color: ' + defaults.NavColour1 + ' !important; }</style>');
        $(iframe).contents().find('.ckeditor_interaction').addClass('ckeditor_content');

        //Apply font classes
        if (!accessibilitySize && !accessibilityColour) {
            $(iframe).contents().find('body').addClass(defaults.Font + ' size' + defaults.FontSize);
        } else {
            $('.' + accessibilitySize).click();
            $('.' + accessibilityColour).click();
        }

        //Load and show interaction
        $('.interactionLoader').fadeOut(300, function () {
            $(this).remove();
            $('.TemplateContent iframe').fadeIn(300);
        });
    });
}


//QUESTION CONTENT
function questionHandler($content, contentNo) {
    var questionHtml = $content.find('question').text();
    var questionId = $content.find('question').attr('id');
    var backgroundColour = $content.find('question').attr('style');
    var size = "full";
    var styles = $content.attr('style');
    styles = styles.replace(/(min-height|max-height|height|float|position).*?;/g, '');

    var randomisation = 'True';
    randomisation = $content.find('question').attr('randomisation');

    //Different styles for half page questions
    if (styles.indexOf("width:450") != -1) {
        styles = styles.replace('margin:20px 10px 20px 20px;', 'margin:0;float:left');
        styles = styles.replace('margin:20px 10px 20px 490px;', 'margin:0 0 0 510px;');
        size = "half";
    }

    //Append content
    $('.PlayerContent').append('<div id="question_' + contentNo + '" class="ContentBlock QuestionContent" style="background: ' + backgroundColour + '; ' + styles + '" data-size="' + size + '">' + htmlUnescape(questionHtml) + '</div>');

    //Shuffle answer order
    if (randomisation == "True" && defaults.ScoringMethod != "FlagScoring")
        $('#question_' + contentNo).find('.answer-accordion').shuffle();

    //Setup listener for answer selection
    CheckAnswers();

    //Check if questions has been previously answered
    ResumeResults($('#question_' + contentNo), questionId);

    //Disable the next button until question is complete
    $('.nextButton').addClass('navDisabled');
}


//EXTERNAL CONTENT
function externalHandler($content) {
    var styles = $content.attr('style');
    var iframeSrc = $content.find('external').attr('src');
    var iframeHeight = $content.find('external').attr('height');

    $('.PlayerContent').append(
        '<div style="' +
        styles +
        ' display: none;" data-height="' +
        iframeHeight +
        '" class="ContentBlock ExternalContent"><iframe src="' +
        iframeSrc +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen/></div>'
    );
}


//ASSESSMENT SUMMARY
function assessmentHandler($block) {
    if (window.location.host == "connect.learnprouk.com") {
        assessmentBlock = $block;
        window.parent.postMessage({
            action: "EXECUTE_FUNCTION",
            function: "CalculateScore",
            parameters: null,
            return: true
        }, "*");
    } else {
        var score = Math.round(parseInt(CalculateScore()));
        $('.PlayerContent').append(loadAssessmentPage($block, score, SubmittedInteractions));
        BlockTransitions();
    }
}

function loadAssessmentPage($block, score, attemptedQuestions) {
    var passmark = parseInt(defaults.PassMark);
    var styles = $block.attr('style');
    var passcomment = "";
    var textBlock = '<div style="' + styles + 'background-color: rgba(255,255,255,0); overflow:hidden; display: none;" data-transition-type="' + $block.attr('transition') + '" data-transition-delay="' + $block.attr('transitionDelay') + '" data-transition-period="' + $block.attr('transitionPeriod') + '" class="TextContent ContentBlock">' + htmlUnescape($block.find('text').text()) + '</div>';
    textBlock = textBlock.replace('max-height:270px; height:auto !important;', 'height: 270px;');

    //If there is no score return to beginning
    if (attemptedQuestions == 0 && (!score || score == 0) && !localhost) {
        ResetModule();
        return;
    }

    if (score >= passmark) {
        passcomment = "<p id=\"AssessmentStatus\" class=\"AssessmentStatus animated zoomIn delay-2s\">Congratulations!</p><p id=\"AssessmentSubStatus\" class=\"AssessmentSubStatus animated zoomIn delay-2s\">You have passed this assessment</p>";
        $('.PlayerContent').append('<img class="PageBackground" src="images/congrats.png"/>');
    } else {
        passcomment = "<p id=\"AssessmentStatus\" class=\"AssessmentStatus animated zoomIn delay-2s\">Sorry</p><p id=\"AssessmentSubStatus\" class=\"AssessmentSubStatus animated zoomIn delay-2s\">You have failed this assessment</p>";
        $('.PlayerContent').append('<img class="PageBackground" src="images/failure.png"/>');
    }

    var pageContentAssessment = "<div><center>" + passcomment + "<div class=\"AssessmentScoreBox\"><div class=\"AssessmentScoreContainer animated jackInTheBox delay-1s\" style=\"float:left\"><p class=\"AssessmentScoreTitle\">Your Score</p><p id=\"AssessmentScoreAchieved\" class=\"AssessmentScore\">" + Math.round(score) + "%</p></div><div class=\"AssessmentScoreContainer animated jackInTheBox \" style=\"float:right\"><p class=\"AssessmentScoreTitle\">Pass Mark</p><p id=\"AssessmentScoreRequired\" class=\"AssessmentScore\">" + passmark + "%</p></div></div></center></div>";

    //Disable navigation on summary page
    $('.navButton').off();
    $('.nextButton').addClass('navDisabled');
    $('.backButton').addClass('navDisabled');

    return textBlock.replace('LPASSESSMENTSUMMARYBLOCK', pageContentAssessment);
}