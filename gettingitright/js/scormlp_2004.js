// Variables for storing the API and find attempts
var API = null;
var IAMLP = null;
var IsScormMode = false;
var FindAttempts = 0;
var MaxAttempts = 500;
var InitTime = new Date();
var SuspendData = "";
var Location = "";
var ExitStatus = "";
var noOfQuestions = 0;
var passMark = 0;
var $xml;
var SubmittedInteractions = 0;


function LocateAPI(win) {
    while ((win.API_1484_11 == null) && (win.parent != null) && (win.parent != win) && (FindAttempts < MaxAttempts)) {
        FindAttempts++;
        win = win.parent;
    }
    return win.API_1484_11;
}

function GetAPI(win) {
    if ((win.parent != null) && (win.parent != win)) {
        API = LocateAPI(win.parent);
    }
    if ((API == null) && (win.opener != null)) {
        API = LocateAPI(win.opener);
    }
}


function LPInitialize() {

    //Check if being launched on a learnPro platform
    if (defaults.ThirdPartyLMS != 'Allow') {
        if (window.location.href.indexOf('learnprouk') == -1 && window.location.href.indexOf('cloud.scorm.com') == -1) {
            window.location = 'CompatibilityError.html';
            return;
        }
    }

    GetAPI(window);
    if (API === null) {
        alert("SCORM API Not Found");
    }
    else {
        IsScormMode = true;
    }

    // Check if SCORM API fetch was successful
    if (IsScormMode) {
        var initDone = API.Initialize("");
        if (API.GetValue("cmi.completion_status") != "completed") {
            // If module has a status other than complete, immediately set to incomplete
            var setStatus = API.SetValue("cmi.completion_status", "incomplete");
            API.Commit("");
        }
    }
    LPInitData();
    InitTime = new Date();
}

function LPTerminate() {
    if (IsScormMode) {
        return API.Terminate("");
    }
}

function LPInitData() {
    if (LPGetValue("cmi.entry") != "ab-initio") {
        Location = LPGetValue("cmi.location");
        SubmittedInteractions = LPGetValue("cmi.interactions._count");
        SuspendData = LPGetValue("cmi.suspend_data");
    }
    else {
        SuspendData = "";
        Location = "0";
        LPSetValue("cmi.location", Location);
    }

    if (defaults.ScoringMethod == "ReadAll") {
        ExitStatus = "suspend";
        SuspendData = LPGetValue("cmi.suspend_data");
    }

    LPSetValue("cmi.score.min", 0);
    LPSetValue("cmi.score.max", 100);

    $.ajax({
        type: "GET",
        url: "com/lPAssessment.xml",
        datatype: "xml",
        success: ParseXml,
        error: XmlFail
    });
}

function XmlFail() {
    alert("Failed to load Xml File");
}

function ParseXml(xml) {
    $xml = $(xml);
    noOfQuestions = $xml.find('Questions').find('Question[Type="MultipleChoice"]').length;
    passMark = $xml.find("AssessmentSchema").attr("PassMark");
}

function LPGetValue(name) {
    if (IsScormMode) {
        return API.GetValue(name.toString());
    }
}

function LPSetValue(name, value) {
    if (IsScormMode) {
        return API.SetValue(name.toString(), value.toString());
    }
}

function LPCommit() {
    if (IsScormMode) {
        var commitResponse = API.Commit("");
        return commitResponse;
    }
}

function LPGetLastError() {
    if (IsScormMode) {
        return API.GetLastError();
    }
}

function LPGetErrorString(errorCode) {
    if (IsScormMode) {
        return API.GetErrorString(errorCode.toString());
    }
}

function LPGetDiagnostic(errorCode) {
    if (IsScormMode) {
        return API.GetDiagnostic(errorCode.toString());
    }
}

function LPFinish() {
    var finishDone = false;
    if (IsScormMode) {
        LPReportTime();
        LPSaveData();
        finishDone = LPTerminate();
    }
    return (finishDone + "");
}

function LPSaveData() {
    LPSetValue("cmi.exit", ExitStatus);
    LPSetValue("cmi.location", Location);

    //Calculate score
    if (LPGetValue("cmi.completion_status") == "completed") {
        if (defaults.ScoringMethod == "Assessed") {
            CalculateScore();
        }
        else if (defaults.ScoringMethod == "FlagScoring") {
            LPSetValue("cmi.score.raw", 100);
            LPSetValue("cmi.success_status", "passed");
        }
        else if (defaults.ScoringMethod == "ReadAll") {
            var completedPages = LPGetValue("cmi.suspend_data");
            var scorePercent = ((completedPages / totalPages) * 100);
            LPSetValue("cmi.score.raw", scorePercent);

            if (scorePercent == 100) {
                LPSetValue("cmi.success_status", "passed");
            }
            else {
                LPSetValue("cmi.success_status", "failed");
            }
        }
    }

    LPCommit();
}

function LPReportTime() {
    var currentTime = new Date();
    var duration = currentTime.getTime() - InitTime.getTime();
    var convertedTime = ConvertTime(duration);
    LPSetValue("cmi.session_time", convertedTime.toString());
    LPCommit();
}

function ConvertTime(time) {
    var convertedTime = "";
    var duration = new Date();
    duration.setTime(time);
    var hours = "000" + Math.floor(time / 3600000);
    var minutes = "0" + duration.getMinutes();
    var seconds = "0" + duration.getSeconds();
    var milliseconds = "0" + Math.round(duration.getMilliseconds() / 10);
    convertedTime = hours.substr(hours.length - 4) + ":" + minutes.substr(minutes.length - 2) + ":";
    convertedTime += seconds.substr(seconds.length - 2) + "." + milliseconds.substr(milliseconds.length - 2);
    return convertedTime;
}

function SetModuleComplete() {
    if (IsScormMode) {
        var complete = LPSetValue("cmi.completion_status", "completed");
        LPCommit();
        return complete;
    }
}

// Adds a result for an interaction
function AddInteractionResponse(labQuestionId, labAnswerId) {
    if (IsScormMode) {
        var isCorrect = $xml.find("Questions Question[LABQuestionId=\"" + labQuestionId + "\"]").find("Answer[LABAnswerId=\"" + labAnswerId + "\"]").attr("IsCorrect");
        var result = "incorrect";
        if (isCorrect == "True")
            result = "correct";

        var i = SubmittedInteractions;
        LPSetValue("cmi.interactions." + i + ".id", labQuestionId.toString() + "_" + i.toString());
        LPSetValue("cmi.interactions." + i + ".type", "choice");
        LPSetValue("cmi.interactions." + i + ".learner_response", labAnswerId);
        LPSetValue("cmi.interactions." + i + ".result", result);
        LPSetValue("cmi.interactions." + i + ".correct_responses.0.pattern", "-1");
        LPSetValue("cmi.interactions." + i + ".description", "Question");
        SubmittedInteractions = LPGetValue("cmi.interactions._count");
    }
}

// Updates the score at the end of the module
function CalculateScore() {
    var count = LPGetValue("cmi.interactions._count");
    var correct = 0;
    var scorePercent = 0;

    for (var i = 0; i < count; i++) {
        var result = LPGetValue("cmi.interactions." + i + ".result");
        if (result == "correct") {
            correct++;
        }
    }

    scorePercent = ((correct / noOfQuestions) * 100);
    LPSetValue("cmi.score.raw", scorePercent);

    if (scorePercent >= passMark) {
        LPSetValue("cmi.success_status", "passed");
    }
    else {
        LPSetValue("cmi.success_status", "failed");
    }

    return scorePercent;
}

function CheckAnswerIsComplete(labQuestionId) {
    var isComplete = false;

    if (IsScormMode) {
        var i = SubmittedInteractions;

        for (var m = 0; m < i; m++) {
            if (LPGetValue("cmi.interactions." + m + ".id").split("_")[0] == labQuestionId.toString()) {
                result = LPGetValue("cmi.interactions." + m + ".result");

                if (result == "correct")
                    isComplete = true;
            }
        }

        return isComplete;
    }
}

// Update the current location within the module
function SetBookmark(location) {
    if (IsScormMode) {
        Location = location.toString() + "";
        LPSetValue("cmi.location", Location);
        LPCommit();
    }
}

// Get the current location
function GetBookmark() {
    Location = LPGetValue("cmi.location");
    return Location;
}