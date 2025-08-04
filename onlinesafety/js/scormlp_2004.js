// Variables for storing the API and find attempts
var API = null;
var IAMLP = null;
var IsScormMode = false;
var FindAttempts = 0;
var MaxAttempts = 500;
var InitTime = new Date();
var ExitStatus = "";
var $xml;
var PassMark = 0;
var SubmittedInteractions = 0;
var SuspendData;


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
        API.Initialize("");
        LPInitData();
    }

    InitTime = new Date();
}

function LPTerminate() {
    if (IsScormMode) {
        return API.Terminate("");
    }
}

function LPInitData() {
    var location;

    if (LPGetValue("cmi.entry") == "resume") {
        location = GetBookmark();
        SubmittedInteractions = LPGetValue("cmi.interactions._count");
        SuspendData = LoadSuspendData();
    }
    else {
        location = 0;
        SuspendData = {
            PagesRead: [],
            QuestionAttempts: []
        }
    }

    LPSetValue("cmi.score.min", 0);
    LPSetValue("cmi.score.max", 100);
    LPSetValue("cmi.completion_status", "incomplete");
    LPSetValue("cmi.success_status", "unknown");
    SetBookmark(location);

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
    PassMark = $xml.find("AssessmentSchema").attr("PassMark");
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
    if (LPGetValue("cmi.completion_status") == "completed") {
        if (defaults.ScoringMethod == "Assessed") {
            //Score calculated on assessment summary page
        }
        else if (defaults.ScoringMethod == "FlagScoring" || defaults.ScoringMethod == "NonAssessed") {
            LPSetValue("cmi.score.raw", 100);
            LPSetValue("cmi.score.scaled", 1);
            LPSetValue("cmi.success_status", "passed");
        }
        else if (defaults.ScoringMethod == "ReadAll") {
            var completedPages = SuspendData.PagesRead.length;
            var scorePercent = ((completedPages / totalPages) * 100);

            if (scorePercent >= 100) {
                LPSetValue("cmi.score.raw", 100);
                LPSetValue("cmi.score.scaled", 1);
                LPSetValue("cmi.success_status", "passed");
            }
            else {
                LPSetValue("cmi.score.raw", scorePercent);
                LPSetValue("cmi.score.scaled", (completedPages / totalPages));
                LPSetValue("cmi.success_status", "failed");
            }
        }
    }
    else {
        ExitStatus = "suspend";
    }

    LPSetValue("cmi.exit", ExitStatus);
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
        LPFinish();
        return complete;
    }
}

// Adds a result for an interaction
function AddInteractionResponse(labQuestionId, labAnswerId) {
    if (IsScormMode) {
        if (CheckAnswerIsComplete(labQuestionId) === false) {
            var title = $xml.find('Questions Question[LABQuestionId="' + labQuestionId + '"]').attr("Title");

            //Get ids of all correct answers
            var correctAnswers = $xml.find('Questions Question[LABQuestionId="' + labQuestionId + '"]').find('Answer[IsCorrect="True"]');
            var correctAnswerIds = [];
            correctAnswers.each(function () {
                correctAnswerIds.push($(this).attr("LABAnswerId"));
            });

            //Check if selected answers is correct
            var result = "incorrect";
            for (var b = 0; b < correctAnswerIds.length; b++) {
                if (correctAnswerIds[b] == labAnswerId) {
                    result = "correct";
                }
            }

            var i = SubmittedInteractions;
            LPSetValue("cmi.interactions." + i + ".id", labQuestionId + "_" + i);
            LPSetValue("cmi.interactions." + i + ".description", title);
            LPSetValue("cmi.interactions." + i + ".type", "choice");
            LPSetValue("cmi.interactions." + i + ".learner_response", labAnswerId);
            LPSetValue("cmi.interactions." + i + ".result", result);

            for (var a = 0; a < correctAnswerIds.length; a++) {
                LPSetValue("cmi.interactions." + i + ".correct_responses." + a + ".pattern", correctAnswerIds[a]);
            }

            SubmittedInteractions = LPGetValue("cmi.interactions._count");

            var question = {
                QuestionId: labQuestionId,
                AnswerId: labAnswerId,
                Result: result
            }
            //Mark question as attempted
            AppendSuspendData("question_attempt", question);
        }
    }
}

// Updates the score at the end of the module
function CalculateScore() {
	var answerQuestions = [];
	var correctQuestions = [];
	var totalCorrectQuestions = 0;
	var totalQuestions = 0;

	for (var i = 0; i < SubmittedInteractions; i++) {
		var labQuestionId = LPGetValue("cmi.interactions." + i + ".id").split("_")[0];
		var IsAssessed = $xml.find('Questions Question[LABQuestionId="' + labQuestionId + '"]').attr("Assessed");
		var result = LPGetValue("cmi.interactions." + i + ".result");

		if (result == "correct" && IsAssessed == "True") {
			var index = correctQuestions.findIndex((x) => x.id == labQuestionId);
			if (index == -1) {
				correctQuestions.push({ id: labQuestionId, AnswerCount: 1 });
			} else {
				correctQuestions[index].AnswerCount++;
			}
		}
		if (IsAssessed == "True") {
			var indexB = answerQuestions.findIndex((x) => x.id == labQuestionId);
			if (indexB == -1) {
				answerQuestions.push({ id: labQuestionId, AnswerCount: 1 });
			}
		}
	}

	totalQuestions = answerQuestions.length;

	correctQuestions.forEach((answerQuestion) => {
		var answers = $xml.find('Questions Question[LABQuestionId="' + answerQuestion.id + '"]').find('Answer[IsCorrect="True"]').length;
		if (answers == answerQuestion.AnswerCount) totalCorrectQuestions++;
	});


	//Fix infinity score if question number isn't detected
	if (!totalCorrectQuestions) {
		LPSetValue("cmi.score.raw", 0);
		LPSetValue("cmi.score.scaled", 0);
		LPSetValue("cmi.success_status", "failed");
		return 0;
	}

	var scorePercent = (totalCorrectQuestions / totalQuestions) * 100;
	LPSetValue("cmi.score.raw", scorePercent);
	LPSetValue("cmi.score.scaled", totalCorrectQuestions / totalQuestions);

	if (scorePercent >= PassMark) {
		LPSetValue("cmi.success_status", "passed");
	} else {
		LPSetValue("cmi.success_status", "failed");
	}

	return scorePercent;
}

function CheckAnswerIsComplete(labQuestionId) {
    var isComplete = false;
    var totalCorrect = $xml.find('Questions Question[LABQuestionId="' + labQuestionId + '"]').find('Answer[IsCorrect="True"]').length;
    var attempts = 0;

    if (IsScormMode) {
        for (var m = 0; m < SubmittedInteractions; m++) {
            if (LPGetValue("cmi.interactions." + m + ".id").split("_")[0] == labQuestionId.toString()) {
                attempts++;

                if (attempts == totalCorrect)
                    isComplete = true;
            }
        }

        return isComplete;
    }
}

// Return a list of previously answered questions from suspend_data
function GetPreviousQuestionAnswers() {
    if (IsScormMode) {
        return SuspendData.QuestionAttempts;
    }
}

// Update the current location within the module
function SetBookmark(location) {
    if (IsScormMode) {
        LPSetValue("cmi.location", location.toString());

        //If not already marked store page as read
        AppendSuspendData("page_view", location);

        LPCommit();
    }
}

// Get the current location
function GetBookmark() {
    return LPGetValue("cmi.location");
}

// Load object from suspend data
function LoadSuspendData() {
    var data;
    try {
        data = JSON.parse(LPGetValue("cmi.suspend_data"));

        if (SubmittedInteractions == 0) {
            data.QuestionAttempts = [];
        }

    } catch (e) {
        data = {
            PagesRead: [],
            QuestionAttempts: []
        }
    }
    return data;
}

// Store object in suspend_data
function AppendSuspendData(type, item) {
    if (type == "page_view") {
        item = parseInt(item);

        var exists = false;
        for (var i = 0; i < SuspendData.PagesRead.length; i++) {
            if (SuspendData.PagesRead[i] == item) {
                exists = true;
            }
        }

        if (!exists) {
            SuspendData.PagesRead.push(item);
        }

    } else if (type == "question_attempt") {
        SuspendData.QuestionAttempts.push(item);
    }

    LPSetValue("cmi.suspend_data", JSON.stringify(SuspendData));
    LPCommit();
}