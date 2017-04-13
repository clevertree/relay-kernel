/**
 * Created by Ari on 12/30/2016.
 */

// Handle client-side response
if (typeof document !== 'undefined') (function(){
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

else if (typeof module !== 'undefined') {
    var PATH = 'tests/files/games/game1.js';
    var INCLUDE = "INCLUDE " + PATH + ";";
    console.log("Loading Game " + PATH);

    module.exports = (function () {

        return new Game1();

        function Game1() {
            this.start = function (e, offset) {
                e.target.postMessage(INCLUDE + "START " + offset);
            };

            this.stop = function (e) {
                e.target.postMessage(INCLUDE + "STOP");
            };
        }
    })();
}
