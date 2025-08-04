var defaults = {
'Name': 'Getting It Right For Every Child',
'XMLsource': 'com/laba_content.xml',
'LayoutType': 'responsive',
'CustomLayout': 'False',
'ThirdPartyLMS': 'Allow',
'OutputType': 'SCORM',
'ShowMenu': 'True',
'SkipMenu': 'True',
'ScoringMethod': 'NonAssessed',
'PassMark': '80',
'RedFlags': '0',
'AmberFlags': '0',
'Font': 'Open-Sans',
'FontSize': '16',
'HeaderColour1': '#cccccc',
'HeaderColour2': '#4680a4',
'NavColour1': '#6fa8dc',
'NavColour2': '#6fa8dc',
'BackgroundColour1': '#ffffff',
'BackgroundColour2': '#d9d9d9',
'AccentColour1': '#4680a4',
'AccentColour2': '',
'FontColour1': '#ffffff',
'FontColour2': '#ffffff',
'Background': 'none',
'Logo': 'images/1.jpeg',
'Animations': 'False'
};

var head = document.getElementsByTagName('head')[0];

//Load correct styles for module type
var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = 'css/' + defaults.LayoutType + '.css';
head.appendChild(style);

//Load correct command.js for module type
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'js/command-' + defaults.LayoutType + '.js';
script.onload = function () {
    loadStart();
};
head.appendChild(script);