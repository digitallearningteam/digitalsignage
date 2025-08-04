$(document).ready(function () {

    //Resize iframes to content
    setTimeout(function () {
        $('iframe').iFrameResize();

        $('.TemplateContent iframe').each(function () {

            //Add print class for interaction print styles
            $(this).contents().find('html').addClass('print');

            //Add theme colours to interaction head element
            var navColour = $(this).attr('data-navcolour');
            $(this).contents().find('head').append('<style type="text/css">.accent-color-text { color: ' + navColour + ' !important; } .accent-color-border { border-color: ' + navColour + ' !important; } .accent-color-background { background-color: ' + navColour + ' !important; }</style>');

            //Chart interaction needs to be built to display
            if ($(this).contents().find('.chart-container').length > 0) {
                $(this)[0].contentWindow['PLAY_MODE'] = true;
                $(this)[0].contentWindow.buildChartInteraction();
            }

        });

    }, 1000);


    //Auto show print dialog
    //setTimeout(window.print(), 3000);
});