/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {

    document.addEventListener('response:play', handlePlayResponse);
    window.addEventListener('resize', handleWindowResize);

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

    function handleWindowResize (e) {
        console.log('resize ', e);

        // Set viewport size (Todo: optimize)
        if(canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
            console.log("Resizing: ", canvas.width, canvas.height);
        }
    }


    function play() {
        var CONFIG = window.games.game1;

        // console.info("Loading game1...");
        // Find game canvas(es)
        var canvasList = document.getElementsByClassName('play:canvas');

        if(canvasList.length === 0) {
            var newCanvas = document.createElement('canvas');
            newCanvas.setAttribute('id', 'play:canvas');
            newCanvas.setAttribute('class', 'play:canvas game1-default-canvas');
            // newCanvas.setAttribute('width', 600);
            // newCanvas.setAttribute('height', 300);
            document.body.appendChild(newCanvas);
            canvasList = document.getElementsByClassName('play:canvas');
        }

        for(var i=0; i<canvasList.length; i++) {
            var canvas = canvasList[i];
            loadStage(canvas, CONFIG.dir.stage_default);
        }
    }

    // Stage Loading

    function loadStage (canvas, scriptPath) {
        var scriptPathEsc = scriptPath.replace(/[/.]/g, '\\$&');
        var foundScript = document.head.querySelectorAll('script[src=' + scriptPathEsc + ']');
        if (foundScript.length === 0) {
            console.log("Including Stage " + scriptPath);
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


})();