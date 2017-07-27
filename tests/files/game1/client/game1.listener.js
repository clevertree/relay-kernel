/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {
    if(typeof window['games'] === 'undefined')
        window.games = {};
    if(typeof window['games']['game1'] === 'undefined')
        window.games.game1 = {"util": {}, "sprite": {}};

    var ROOT = 'tests/files/game1/';
    var DEFAULT_STAGE = ROOT + 'stages/stage1/stage1.stage.js';

    document.addEventListener('response:play', handlePlayResponse);
    window.addEventListener('resize', handleWindowResize);

    // Canvas Loading

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
        var CONFIG = window.games.game1;
        var UTIL = CONFIG.util;
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

        var stagePath = DEFAULT_STAGE;
        UTIL.loadScript(stagePath, function() {
            var event = new CustomEvent('render:stages', {
                'detail': stagePath,
                'cancelable': true,
                'bubbles': true
            });

            for(var i=0; i<canvasList.length; i++) {
                var canvas = canvasList[i];
                canvas.dispatchEvent(event);
            }
            if (!event.defaultPrevented)
                throw new Error("Render event was not handled");
        });
    }



})();