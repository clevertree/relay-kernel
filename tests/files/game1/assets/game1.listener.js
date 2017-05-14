/**
 * Created by Ari on 12/30/2016.
 */

// Set up client-side listeners

(function() {

    document.addEventListener('response:start', handleStartResponse);

    function process() {
    }


    // Event Listeners

    function handleStartResponse (e) {
        var commandString = e.data || e.detail;
        e.preventDefault();

        var split = commandString.split(' ');
        var type = split[0].toLowerCase();
        //var offset = parseFloat(split[1]);

        process();
    }


})();