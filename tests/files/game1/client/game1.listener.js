/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {

    document.addEventListener('response:play', handlePlayResponse);


    // Event Listeners

    function handlePlayResponse (e) {
        // var commandString = e.data || e.detail;
        e.preventDefault();
        if(document.readyState === 'complete') {
            setTimeout(play, 100);

        } else {
            document.addEventListener("DOMContentLoaded", play);
        }
    }


    // Loading

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

            var event = new CustomEvent('render:start', {
                'cancelable': true,
                'bubbles': true
            });

            canvas.dispatchEvent(event);
            if(!event.defaultPrevented)
                throw new Error("Render event was not handled");
        }
    }
})();