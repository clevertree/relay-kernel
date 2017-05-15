/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {

    document.addEventListener('response:play', handlePlayResponse);

    var DIR = 'tests/files/game1/';

    // Canvas Loading

    function handlePlayResponse (e) {
        // var commandString = e.data || e.detail;
        e.preventDefault();
        if(document.readyState === 'complete') {
            setTimeout(play, 100);

        } else {
            document.addEventListener("DOMContentLoaded", play);
        }
    }


    function play() {
        // console.info("Loading game1...");
        // Find game canvas(es)
        var canvasList = document.getElementsByClassName('play:canvas');

        if(canvasList.length === 0) {
            var newCanvas = document.createElement('canvas');
            newCanvas.setAttribute('id', 'play:canvas');
            newCanvas.setAttribute('class', 'play:canvas game1-default-canvas');
            document.body.appendChild(newCanvas);
            canvasList = document.getElementsByClassName('play:canvas');
        }

        for(var i=0; i<canvasList.length; i++) {
            var canvas = canvasList[i];
            loadStage(canvas, DEFAULT_STAGE);
        }
    }

    // Stage Loading

    var DEFAULT_STAGE = DIR + 'stage/default.stage.js';

    function loadStage (canvas, scriptPath) {
        var scriptPathEsc = scriptPath.replace(/[/.]/g, '\\$&');
        var foundScript = document.head.querySelectorAll('script[src=' + scriptPathEsc + ']');
        if (foundScript.length === 0) {
            console.log("Including Stage " + stagePath);
            var scriptElm = document.createElement('script');
            scriptElm.src = scriptPath;
            scriptElm.onload = function() {
                triggerRender();
            };
            document.head.appendChild(scriptElm);
        } else {
            triggerRender();
        }



        function triggerRender() {
            var event = new CustomEvent('render:stage', {
                'detail': scriptPath,
                'cancelable': true,
                'bubbles': true
            });

            canvas.dispatchEvent(event);
            if (!event.defaultPrevented)
                throw new Error("Render event was not handled");
        }
    }

    // Util functions



})();