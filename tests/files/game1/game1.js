/**
 * Created by Ari on 12/30/2016.
 */


module.exports = (function () {
    var DIR = 'tests/files/game1/';
    return new Game1();

    function Game1() {
        this.load = function (e) {
            var PATH = DIR + 'assets/game1.listener.js';
            console.log("Loading Game " + PATH);
            e.target.postMessage("INCLUDE " + PATH + ";");
        };

        this.start = function (e, offset) {
            this.load(e);
            e.target.postMessage("START " + offset);
        };

        this.stop = function (e) {
            e.target.postMessage("STOP");
        };
    }
})();
