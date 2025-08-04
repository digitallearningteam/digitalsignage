//learnPro Command Framework (c)

//Question variables
var totalCorrect;
var correct;
var q_id;


/*
 * PAGE BUILDING
 */

//Build content from xml and write to page
function buildPage() {
    //Clear all content
    $('.PlayerContainer').hide();
    $('.PlayerContent').html("");

    //Add page break		
    $('.PlayerContent').attr('data-break', (parseInt(currentPage.attr('pageBreak')) + 1));

    //Add page template
    $('.PlayerContent').attr('data-templateblockid', parseInt(currentPage.attr('pageTemplate')));
    $('.PlayerContent').removeClass().addClass('PlayerContent').addClass(currentPage.attr('pageClass'));

    //Apply page background colour
    $('.ContainerBackground #PageBackground').remove();
    $('.ContainerBackground').append('<div id="PageBackground" style="background-color:' + currentPage.find('background').attr('colour') + '"></div>');

    //Page background image
    if ($(currentPage).find('background').attr('type') == 'Image') {
        $('#PageBackground').append('<img src="' + currentPage.find('background').attr('src') + '" alt="Page background Image" />');
    } else if ($(currentPage).find('background').attr('type') == 'Video') {
        $('#PageBackground').append('<video width="100%" height="100%" autoplay muted><source src="' + $(currentPage).find('background').attr('src') + '" type="video/mp4">Your browser does not support the video tag.</video>');
    }

    //Page audio
    buildAudio();

    //Get each of the content items and send them to the correct handler
    var i = 1;
    currentPage.find('content').each(function () {
        switch ($(this).attr('type')) {
            case ('text'):
                textHandler($(this));
                break;
            case ('image'):
                imageHandler($(this));
                break;
            case ('video'):
                videoHandler($(this), i);
                break;
            case ('overlayvideo'):
                overlayvideoHandler($(this), i);
                break;
            case ('question'):
                questionHandler($(this), i);
                break;
            case ('template'):
                interactionHandler($(this), i);
                break;
            case ('assessmentsummary'):
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

        var styles = '<style>.vjs-control-bar { background: linear-gradient(to right,' + defaults.HeaderColour1 + ',' + defaults.HeaderColour2 + '); }' +
            '.vjs-load-progress div, .vjs-play-progress { background: ' + defaults.NavColour1 + ' !important; } .video-js { background-color: transparent}' +
            '.vjs-play-progress:before { color: ' + defaults.NavColour1 + ' !important; } .vjs-poster { display: none; } .vjs-time-tooltip, .vjs-mouse-display, .vjs-fullscreen-control { display: none !important; }' +
            '.vjs-audio { width: 100%; height: 30px !important } .vjs-big-play-button { display: none !important } .vjs-control-bar { display: flex !important; border-radius: 5px; }</style>';

        var html = '<audio id="audio_player" class="video-js" preload="auto">' +
            '<source src="' + src + '.m4a" type="audio/m4a"></source><source src="' + src + '.mp3" type="audio/mp3"></source></audio>';

        $('.PlayerContent').append('<div class="AudioContainer" style="display: none">' + styles + html + '</div>');

        videojs('audio_player', {
            autoplay: (autoplay == "True"),
            controls: true
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
        styles += 'flex-grow:' + size + '; order:' + order + ';'
    } else styles = '';

    $('.PlayerContent').append('<div style="' + styles + 'background-color: ' + bColor + ';" class="ContentBlock TextContent ' + templateClass + '">' + htmlUnescape(text) + '</div>');

    //Load pdf viewer in iframe
    if (text.indexOf('iframePDF') != -1) {
        var pdfframe = $("div[data-order='" + order + "']").find('#iframePDF').last();
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
        styles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';'
    } else styles = '';

    //Styles to position image relative to block and other flex content
    var imageScale = $(imageContent).attr('imageScale');
    var altText = $(imageContent).attr('imageAlt');
    var src = $(imageContent).text();

    $('.PlayerContent').append('<div style="' + styles + '" data-align="' + imageScale + '" class="ContentBlock ImageContent ' + templateClass + '"><img src="' + src + '" alt="' + altText + '"/></div>');
}


//VIDEO CONTENT
function videoHandler($content, contentNo) {
    var size = $content.attr('size');
    var blockStyles = $content.attr('styles');
    var mediaType = ($content.find('video').length > 0) ? "video" : "audio";
    var templateClass = $content.attr('templateClass');

    var legacy = $content.find(mediaType).attr('legacy');
    var fileType = $content.find(mediaType).attr('fileType');
    var poster = htmlUnescape($content.find(mediaType).attr('posterSrc'));
    var autoplay = $content.find(mediaType).attr('autoplay');
    var src = $content.find(mediaType).text();
    var playerId = 'video_player_' + contentNo;

    if (!templateClass) {
        blockStyles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';'
    } else blockStyles = '';

    //Don't try to load dash for legacy streams
    var mpd = '';
    if (legacy == "False") {
        mpd = '<source src="' + src + '.mpd' + '" type="application/dash+xml"></source>';
    } else {
        src = src.replace('vod', 'hls-vod');
    }

    //Build video/audio html
    var styles = '';
    var html = '';

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

    if (mediaType == "video") {
        styles = '<style>.vjs-control-bar { background: linear-gradient(to right,' + toolbarColour1 + ',' + toolbarColour2 + '); }' +
            '.vjs-load-progress div, .vjs-play-progress { background: ' + progressColour + ' !important; }' +
            '.vjs-play-progress:before { color: ' + progressColour + ' !important; }' +
            '.video-js .vjs-control { color: ' + progressColour + ' !important; } </style>';

        html = '<div class="ContentBlock VideoContent ' + templateClass + '" style="' + blockStyles + '"><video id="' + playerId + '" class="video-js" preload="auto" ' + poster + '>' +
            mpd + '<source src="' + src + '.m3u8' + '" type="application/x-mpegURL"></source><source src="' + src + '.' + fileType + '" type="video/mp4"></source>' +

            //Flash fallback
            '<object>' +
            '<param name="flashvars" value="src=' + src + '.' + fileType + '&autoPlay=' + autoplay + '">' +
            '<param name="allowFullScreen" value="true">' +
            '<param name="allowscriptaccess" value="always">' +
            '<embed src="javascript/StrobeMediaPlayback.swf" type="application/x-shockwave-flash" flashvars="src=' + src + '.' + fileType + '&autoPlay=' + autoplay + '" ' +
            'allowfullscreen="true" allowscriptaccess="always">' +
            '</object>' +

            '</video></div>';
    } else {
        poster = poster.replace('vm/', '');
        styles = '<style>.vjs-control-bar { background: linear-gradient(to right,' + toolbarColour1 + ',' + toolbarColour2 + '); }' +
            '.vjs-load-progress div, .vjs-play-progress { background: ' + progressColour + ' !important; } .video-js { background-color: #000}' +
            '.vjs-play-progress:before { color: ' + progressColour + ' !important; } .vjs-audio .vjs-poster { display: none; }' +
            '.vjs-time-tooltip, .vjs-mouse-display, .vjs-fullscreen-control { display: none !important; }</style>';

        html = '<div class="ContentBlock VideoContent ' + templateClass + '" style="' + blockStyles + '"><audio id="' + playerId + '" class="video-js" preload="auto" ' + poster + '>' +
            '<source src="' + src + '.m4a" type="audio/m4a"></source><source src="' + src + '.mp3" type="audio/mp3"></source></audio></div>';
    }

    //Write html to page
    $('.PlayerContent').append(styles + html);

    //Initialise video.js player
    videojs('video_player_' + contentNo, {
        autoplay: (autoplay == "True"),
        controls: true
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


//VIDEO OVERLAY CONTENT
function overlayvideoHandler($content, contentNo) {
    var size = $content.attr('size');
    var blockStyles = $content.attr('styles');
    var mediaType = "OverlayVideo";

    var legacy = $content.find(mediaType).attr('legacy');
    var fileType = $content.find(mediaType).attr('fileType');
    var poster = htmlUnescape($content.find(mediaType).attr('posterSrc'));
    var src = $content.find(mediaType).attr('src');
    var playerId = 'video_player_' + contentNo;
    var templateClass = $content.attr('templateClass');

    if (!templateClass) {
        blockStyles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';'
    } else blockStyles = '';

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
    if (legacy == "False") {
        mpd = '<source src="' + src + '.mpd' + '" type="application/dash+xml"></source>';
    } else {
        src = src.replace('vod', 'hls-vod');
    }

    //Build video/audio html
    var styles = '';
    var html = '';

    //Change progress bar colour if same as header
    var progressColour = defaults.NavColour1;
    if ((defaults.HeaderColour1 || defaults.HeaderColour2) == defaults.NavColour1) {
        progressColour = '#ffffff';
    }

    styles = '<style>.vjs-control-bar { background: linear-gradient(to right,' + defaults.HeaderColour1 + ',' + defaults.HeaderColour2 + '); }' +
        '.vjs-load-progress div, .vjs-play-progress { background: ' + progressColour + ' !important; }' +
        '.vjs-play-progress:before { color: ' + progressColour + ' !important; }' +
        '.video-js .vjs-control { color: ' + progressColour + ' !important; } </style>';

    html = '<div class="ContentBlock VideoContent ' + templateClass + '" style="' + blockStyles + '">' + scenes + '<video id="' + playerId + '" class="video-js" preload="auto" ' + poster + '>' +
        mpd + '<source src="' + src + '.m3u8' + '" type="application/x-mpegURL"></source><source src="' + src + '.' + fileType + '" type="video/mp4"></source>' +

        //Flash fallback
        '<object>' +
        '<param name="flashvars" value="src=' + src + '.' + fileType + '">' +
        '<param name="allowFullScreen" value="true">' +
        '<param name="allowscriptaccess" value="always">' +
        '<embed src="javascript/StrobeMediaPlayback.swf" type="application/x-shockwave-flash" flashvars="src=' + src + '.' + fileType + '" ' +
        'allowfullscreen="true" allowscriptaccess="always">' +
        '</object>' +

        '</video></div>';


    //Write html to page
    $('.PlayerContent').append(styles + playerScript + html);

    //Initialise video.js player
    videojs('video_player_' + contentNo, {
        controls: true
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
        styles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';'
    } else styles = '';

    //Append interaction to page
    $('.PlayerContent').append('<div id="template_' + contentNo + '" class="ContentBlock TemplateContent ' + templateClass + '" style="' + styles + '">' +
        '<iframe id="iframe_' + contentNo + '" src="' + src + '" frameborder="0" scrolling="no" width="100%" height="100%"></iframe></div>');

    //Once the interaction iframe has loaded build the interaction
    $('#iframe_' + contentNo).load(function () {

        //Set PLAY_MODE and build the interaction
        $(this)[0].contentWindow['PLAY_MODE'] = true;
        $(this)[0].contentWindow.StopContentEdit();

        var fnstring = 'build' + interactionName + 'Interaction';
        var fn = $(this)[0].contentWindow[fnstring];
        if (typeof fn === "function") {
            fn();
        }

        //Apply theme colours
        var navColour = defaults.NavColour1 == '#ffffff' ? defaults.NavColour2 : defaults.NavColour1;

        $('#iframe_' + contentNo).contents().find('head').append('<style type="text/css">.accent-color-text { color: ' + navColour + ' !important; } .accent-color-border { border-color: ' + navColour + ' !important; } .accent-color-background { background-color: ' + navColour + ' !important; }</style>');


        //Apply font classes
        if (!accessibilitySize && !accessibilityColour) {
            $('#iframe_' + contentNo).contents().find('body').addClass(defaults.Font + ' size' + defaults.FontSize);
        } else {
            $('.' + accessibilitySize).click();
            $('.' + accessibilityColour).click();
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
    var backgroundColour = $content.find('question').attr('style');
    var templateClass = $content.attr('templateClass');

    if (!templateClass) {
        styles += 'flex-grow:' + size + '; order:' + $content.attr('order') + ';'
    } else styles = '';

    //Append content
    $('.PlayerContent').append('<div id="question_' + contentNo + '" class="ContentBlock QuestionContent ' + templateClass + '" style="' + styles + ' background: ' + backgroundColour + '">' + htmlUnescape(questionHtml) + '</div>');

    //Shuffle answer order
    if (defaults.ScoringMethod != "FlagScoring")
        $('#question_' + contentNo).find('.answer-accordion').shuffle();

    //Setup listener for answer selection
    CheckAnswers();

    //Disable the next button until question is complete
    $('.nextButton').addClass('navDisabled');
}


//ASSESSMENT SUMMARY
function assessmentHandler($content) {
    var score = Math.round(parseInt(CalculateScore()));
    var bg = "";
    var passcomment = "";

    //If there is no score return to beginning
    if (!score) {
        ResetModule();
        return;
    }

    if (score >= passMark) {
        passcomment = "<p id=\"AssessmentStatus\" class=\"AssessmentStatus animated zoomIn delay-2s\">Congratulations!</p>" +
            "<p id=\"AssessmentSubStatus\" class=\"AssessmentSubStatus animated zoomIn delay-2s\">You have passed this assessment</p>";
        bg = "linear-gradient(to right,#24a558,#24a558)";
    } else {
        passcomment = "<p id=\"AssessmentStatus\" class=\"AssessmentStatus animated zoomIn delay-2s\">Sorry</p>" +
            "<p id=\"AssessmentSubStatus\" class=\"AssessmentSubStatus animated zoomIn delay-2s\">You have failed this assessment</p>";
        bg = "linear-gradient(to right,#d24444,#d24444)";
    }

    var textBlock = '<div style="background: ' + bg + '; overflow:hidden;" class="TextContent ContentBlock">' + htmlUnescape($content.find('text').text()) + '</div>';
    textBlock = textBlock.replace('max-height:270px; height:auto !important;', 'height: 270px;');

    var pageContentAssessment = "<div>" +
        "<center>" + passcomment +
        "<div class=\"AssessmentScoreBox\">" +
        "<div class=\"AssessmentScoreContainer animated jackInTheBox delay-1s\">" +
        "<p class=\"AssessmentScoreTitle\">Your Score</p>" +
        "<p id=\"AssessmentScoreAchieved\" class=\"AssessmentScore\">" + score + "%</p>" +
        "</div>" +
        "<div class=\"AssessmentScoreContainer animated jackInTheBox \">" +
        "<p class=\"AssessmentScoreTitle\">Pass Mark</p>" +
        "<p id=\"AssessmentScoreRequired\" class=\"AssessmentScore\">" + passMark + "%</p>" +
        "</div>" +
        "</div>" +
        "</center>" +
        "</div>";

    textBlock = textBlock.replace('LPASSESSMENTSUMMARYBLOCK', pageContentAssessment);
    $('.PlayerContent').append(textBlock);
}