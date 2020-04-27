/*!
 * Cndk.KelimeOyunu.js v 0.0.1 (https://github.com/ilkerccom/kelimeoyunu)
 * Ilker Cindik
 * Licensed under the MIT license
*/

$.fn.cndkkelimeoyunu = function(options) {

    // Default settings
    var settings = $.extend({
        gameTime: 4, /* minutes */
        gameWidth: 1, /* px (if 1=100%) */
        gameHeight: 1 /* px (if 1=100%)*/
    }, options);

    // Private variables
    var gameTimeInMS = 60000 * settings.gameTime; /* Minutes to Milisecons */
    var gameExtraTime = 25; /* seconds */
    var gameIsGuessing = false;
    var gameIsStarted = false;
    var gameIsStopped = false;
    var gameIsPassive = true;
    var gameCurrentQuestionNumber = 1; /* First question number */
    var gameTotalQuestionNumber = 14; /* Default max:14; Increase level on words.json file */
    var gameCurrentLevel = 1; /* Default min:1, max:7, Increase level on words.json file */
    var gamePoints = 0;
    var gameCurrentKeyword = "";
    var gameCurrentQuestion = "";
    var gameUsedKeywords = []; /* Array for used keywords. Dont ask again! */
    var extraTimeDispose = false;

    // Language [TR only]
    var textGame = "KELİME OYUNU";
    var textPlay = "OYUNA BAŞLA!";
    var textPoints = "PUAN : "
    var textRequestLetter = "HARF İSTE (SPACE)";
    var textGuess = "TAHMİN ET (ENTER)";
    var textGameOVer = "OYUN BİTTİ";
    var textReplay = "YENİDEN OYNA";

    // This
    var root = this;

    // For mobile only
    if(isMobile()){

        // Replace keyboard shortcuts texts
        textRequestLetter = textRequestLetter.replace("(SPACE)","");
        textGuess = textGuess.replace("(ENTER)","");
    }

    // Setup scene
    setupScene();
    function setupScene()
    {
        if(settings.gameWidth == 1 && settings.gameHeight == 1)
        {
            root.css("width", "100%");
            root.css("height", "100%");
        }
        else
        {
            root.css("width", settings.gameWidth +"px");
            root.css("height", settings.gameHeight +"px");
        }
        root.addClass("cndkGameArea");

        // Points and time area
        root.append("<div class='cndkTopArea'><div class='cndkPoints'><span><em>" + textPoints + "</em>0</span></div><div class='cndkTime'><button disabled class='cndkRequestLetter'>"+textRequestLetter+"</button><button disabled class='cndkGuess'>"+textGuess+"</button><span class='cndkTimer'>00:00</span></div></div>");
    }

    // Setup main menu
    setupMainMenu();
    function setupMainMenu()
    {
        if(!gameIsStarted && root.has(".cndkMainMenu"))
        {
            root.append("<div class='cndkMainMenu'><div><h1 class='cndkGameName'>"+textGame+"<small>by Ilker Cindik</small></h1><button id='cndkStart'>"+textPlay+"</button></div></div>");

            // Start game
            $(document).on("click", "#cndkStart", function() {
                gameIsStarted = true;
                startGame();
            });
        }
    }

    // Start game
    function startGame()
    {
        if(gameIsStarted)
        {
            $('.cndkMainMenu').hide();
            getLevel(gameCurrentLevel);
        }
    }

    // Get level from json file
    function getLevel(level)
    {
        $.ajax({
            dataType: 'JSON',
            url: "assets/words.json",
            contentType: "application/json;charset=utf-8",
            success: function (data) {
                // Loaded json successfully - Private
                var loadedLevel = data['level'+level];
                var maxLevelsInLevel = loadedLevel.length;
                var setCurrentLevel = loadedLevel[Math.floor((Math.random() * maxLevelsInLevel))];

                // Check if used before and add to used keywords
                while (gameUsedKeywords.includes(setCurrentLevel.answer.toUpperCase())) {
                    setCurrentLevel = loadedLevel[Math.floor((Math.random() * maxLevelsInLevel))];
                }
                gameUsedKeywords.push(setCurrentLevel.answer.toUpperCase());
                
                // Sets keywords and question
                gameCurrentKeyword = setCurrentLevel.answer.toUpperCase();
                gameCurrentQuestion = setCurrentLevel.question;

                // Then load the level
                loadLevel(level);
            }
        });
    }

    // Loads level
    function loadLevel(level)
    {
        root.append("<div class='cndkLevel cndkLevel"+level+"'></div>");
        for(i=0;i<gameCurrentKeyword.length;i++)
        {
            $(".cndkLevel"+level).append("<div class='cndkBox'><input class='cndkBox"+i+"' data-number="+i+" data-opened='false' maxlength='1' type='text' disabled='true'> </div>");
        }
        $(".cndkLevel").append("<div class='cndkQuestion'>" + gameCurrentQuestion + "</div>");

        // Current question number and points
        if($('.cndkCurrentInfo').length <= 0)
        {
            root.append("<div class='cndkCurrentInfo'><span class='cndkCurrentQuestion'>"+gameCurrentQuestionNumber+"/"+gameTotalQuestionNumber+"</span><span class='cndkCurrentPoint'>"+(gameCurrentKeyword.length*100)+"</span></div>");
        }

        // Start timer
        gameIsGuessing = false;
        gameIsStopped = false;
        cndkTimer.start();
        $(".cndkRequestLetter").attr("disabled",false);
        $(".cndkGuess").attr("disabled",false);
        gameIsPassive = false;
    }

    // Check if is alphanumeric
    function isSpecialKey(key)
    {
        if(key.code != "Backspace" && key.code != "ArrowLeft" && key.code != "ArrowRight" && key.code != "Space"){
            return true;
        }
        else
        {
            return false;
        }
    }

    // On-enter keyword
    $(document).on("keydown", ".cndkBox > input", function(key){

        // User is not guessing - lock
        if(!gameIsGuessing)
        {
            return false;
        }

        var keyBox = $(this);
        var activeBox = parseInt($(this).attr("data-number"));
        var focusBox = parseInt(activeBox+1);
        var activeLength = gameCurrentKeyword.length;

        // Default
        if(focusBox < activeLength && isSpecialKey(key))
        {
            setTimeout(function(){
                for(i=focusBox;i<gameCurrentKeyword.length;i++)
                {
                    var isOpened = $('.cndkBox input[data-number="' + i + '"]').attr("data-opened");
                    if(isOpened == "false")
                    {
                        $('.cndkBox input[data-number="' + i + '"]').delay(500).focus().delay(10).select();
                        break;
                    }
                }
            }, 100);
        }
        else if(key.code == "Backspace")
        {
            setTimeout(function(){
                for(i=activeBox-1;i>=0;i--)
                {
                    var isOpened = $('.cndkBox input[data-number="' + i + '"]').attr("data-opened");
                    if(isOpened == "false")
                    {
                        $('.cndkBox input[data-number="' + i + '"]').delay(500).focus().delay(10).select();
                        break;
                    }
                }
            }, 10);
        }

        // Completed word - Check keyword
        setTimeout(function(){
            checkKeyword();
        }, 50);
        

    });

    // On-click keywords
    $(document).on("click",".cndkBox > input", function(){
        $(this).select();
    });

    // Check keywords if is completed
    function checkKeyword()
    {
        var enteredWord = "";
        var boxesLength = $(".cndkLevel" + gameCurrentLevel + " > .cndkBox").length;
        var boxesEnteredLength = 0;
        $(".cndkLevel" + gameCurrentLevel + " > .cndkBox").each(function(){
            if($(this).find("input").val().length == 1)
            {
                boxesEnteredLength++;
            }
            enteredWord += replaceSpecialChars($(this).find("input").val()).toUpperCase();
        });

        // Word is completed check if is correct
        if(boxesEnteredLength == boxesLength)
        {
            if(enteredWord == gameCurrentKeyword)
            {
                // Lock game
                gameIsPassive = true;

                // Remove extra time content
                $(".cndkExtraTimer").remove();
                extraTimeDispose = true;

                // Correct
                $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input").parent().addClass("cndkBoxCorrect");
                $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input").prop("disabled",true);

                // Stop timer
                gameIsStopped = true;
                $(".cndkRequestLetter").attr("disabled",true);
                $(".cndkGuess").attr("disabled",true);

                // Calculate points
                $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input[data-opened='false']").each(function(){
                    gamePoints += 100;
                });

                // Write points
                $('.cndkPoints > span').html("<em>" + textPoints + "</em>" + gamePoints);

                // Go to next level
                setTimeout(function(){
                    $(".cndkLevel").remove();
                    $(".cndkCurrentInfo").remove();
                }, 2000);
                gameCurrentQuestionNumber++;
                if(gameCurrentQuestionNumber <= gameTotalQuestionNumber)
                {
                    if(gameCurrentQuestionNumber%2 != 0)
                    {
                        gameCurrentLevel++;
                    }

                    setTimeout(function(){
                        $(".cndkLevel").remove();
                        getLevel(gameCurrentLevel);
                    }, 2500);
                }
                else
                {
                    gameOver();
                }
                
            }
            else
            {
                // Incorrect
                $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input").parent().addClass("cndkBoxIncorrect");
            }
        }
        else
        {
            $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input").parent().removeClass("cndkBoxCorrect");
            $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input").parent().removeClass("cndkBoxIncorrect");
        }
        
    }

    // Request a latter button action
    $(document).on("click",".cndkRequestLetter", function(){
        requestLetter();
    });

    // Listen key events 
    $(document).on("keyup", function(key){
        if(key.code == "Space")
        {
            requestLetter();
        }
        else if(key.code == "Enter")
        {
            requestGuess();
        }
    });

    // Opens a letter as hint
    function requestLetter()
    {
        if(!gameIsGuessing && !gameIsPassive)
        {
            var closedBoxes = $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input[data-opened='false']").length;
            if(closedBoxes > 1)
            {
                var chance = Math.floor( Math.random() * closedBoxes);
                var willBeOpenLetter = $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input[data-opened='false']:eq("+chance+")").attr("data-number");
                $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input[data-opened='false']:eq("+chance+")").val(gameCurrentKeyword[willBeOpenLetter]);
                $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input[data-opened='false']:eq("+chance+")").attr("disabled",true);
                $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input[data-opened='false']:eq("+chance+")").parent().addClass("cndkBoxOpened");
                $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input[data-opened='false']:eq("+chance+")").attr("data-opened","true");

                // Rewrite current point
                $(".cndkCurrentPoint").text(parseInt($(".cndkCurrentPoint").text())-100);
            }
            else
            {
                $(".cndkRequestLetter").attr("disabled",true);
            }
        }
    }

    // Completes word when extra time is up
    function completeWord()
    {
        for(i=0;i<gameCurrentKeyword.length;i++)
        {
            $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input:eq("+i+")").val(gameCurrentKeyword[i]);
            $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input:eq("+i+")").attr("disabled",true);
            $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input:eq("+i+")").parent().addClass("cndkBoxOpened");
            $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input:eq("+i+")").attr("data-opened","true");
        }
        gamePoints -= parseInt(gameCurrentKeyword.length * 100);
        $('.cndkPoints > span').text(textPoints + gamePoints);

        // Go to next level
        setTimeout(function(){
            $(".cndkLevel").remove();
            $(".cndkCurrentInfo").remove();
        }, 1500);
        gameCurrentQuestionNumber++;
        if(gameCurrentQuestionNumber%2 != 0)
        {
            gameCurrentLevel++;
        }
        setTimeout(function(){
            getLevel(gameCurrentLevel);
        }, 2000);
    }

    // Request a guess button action
    $(document).on("click",".cndkGuess", function(){
        requestGuess();
    });

    // Request a guess
    function requestGuess()
    {
        if($(".cndkExtraTimer").length == 0 && !gameIsPassive)
        {
            $('.cndkBox > input').prop("disabled", false);
            $('.cndkBox').addClass("cndkBoxIsGuessing");
            $(".cndkRequestLetter").attr("disabled",true);
            $(".cndkGuess").attr("disabled",true);
            gameIsStopped = true;
            gameIsGuessing = true;

            // Focus for box
            $(".cndkLevel" + gameCurrentLevel + " > .cndkBox input[data-opened='false']:eq(0)").focus();

            // Start extra timer
            $(".cndkTime").append("<span class='cndkExtraTimer'>" + gameExtraTime + "</span>");
            cndkExtraTimer.start();
        }
    }

    // Game over
    function gameOver()
    {
        $(".cndkLevel").remove();
        $("#game").append("<div class='cndkGameOver'><h2>" + textGameOVer + "</h2><h3>" + textPoints + gamePoints + "</h3><button class='cndkReplay'>" + textReplay + "</button></div>");
    }

    $(document).on("click", ".cndkReplay", function(){
        $(".cndkLevel").remove();
        $(".cndkGameOver").remove();
        $('.cndkPoints > span').text(textPoints + "0");
        $('.cndkTimer').text("00:00");
        
        gameTimeInMS = 60000 * settings.gameTime;
        gameIsStarted = false;
        gamePoints = 0;
        gameCurrentQuestionNumber = 1;
        gameCurrentLevel = 1;

        $('.cndkMainMenu').show();
    });

    function replaceSpecialChars(letter)
    {
        letter = letter.replace("i","İ");
        return letter;
    }

    // Timer for game
    var cndkTimer = function(){

        // New timer
        var timer = null;
        
        // Start timer
        function start() {
            timer = setInterval(timeCount, 1000);
         }

         // Stop timer
         function stop() {
            clearInterval(timer);
         }

         // countdown
         function timeCount(){
            if(!gameIsStopped)
            {
                if (gameTimeInMS <= 0) {
                    stop();
                    gameOver();
                }
                else {
                    gameTimeInMS = gameTimeInMS - 1000;;
                    var currentTime = "0" + Math.floor(gameTimeInMS / 60000) + ":" + ((gameTimeInMS % 60000) / 1000).toFixed(0);
                    $(".cndkTimer").html(currentTime);
                }
            }
            else
            {
                stop();
            }
         }

         return { start: start }      
    }();

    // Extra timer for game
    var cndkExtraTimer = function(){

        // New timer
        var counter = gameExtraTime;
        var timer = null;
        
        // Start timer
        function start() {
            counter = gameExtraTime;
            timer = setInterval(timeCount, 1000);
         }

         // Stop timer
         function stop() {
            clearInterval(timer);
         }

         // countdown
         function timeCount(){

            if(extraTimeDispose)
            {
                stop();
                extraTimeDispose = false;
            }
            
            if (counter <= 0) {
                stop();
                completeWord();
                $(".cndkExtraTimer").remove();
            }
            else {
                counter--;
                $(".cndkExtraTimer").html(counter);
            }
         }

         return { start: start }      
    }();

    // Check if mobile
    function isMobile() {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }
}

