var defaults = {
'Name': 'Online Safety and Wellbeing of Children and Young People',
'XMLsource': 'com/laba_content.xml',
'LayoutType': 'block',
'CustomLayout': 'False',
'ThirdPartyLMS': 'Allow',
'OutputType': 'SCORM',
'ShowMenu': 'True',
'SkipMenu': 'True',
'ShowGlossary': 'False',
'ScoringMethod': 'NonAssessed',
'PassMark': '80',
'RedFlags': '0',
'AmberFlags': '0',
'Font': 'Open-Sans',
'FontSize': '16',
'HeaderColour1': '#005293',
'HeaderColour2': '#005293',
'NavColour1': '#6fa8dc',
'NavColour2': '#6fa8dc',
'BackgroundColour1': '#d9d9d9',
'BackgroundColour2': '#d9d9d9',
'AccentColour1': '#fbbb21',
'AccentColour2': '#262626',
'FontColour1': '#ffffff',
'FontColour2': '#ffffff',
'Background': 'images/1.jpeg',
'BackgroundFit': 'Cover',
'Logo': 'images/2.jpeg',
'Animations': 'True'
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