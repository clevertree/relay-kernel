/**
 * Created by Ari on 12/30/2016.
 */


module.exports = (function () {
    var DIR = 'tests/files/game1/';
    var includesLoaded = false;

    return new Game1();

    function Game1() {
        this.onLoad = function (e) {
            if(includesLoaded)
                return;
            includesLoaded = true;
            e.target.postMessage("INCLUDE " + DIR + "client/game1.util.js;");
            e.target.postMessage("INCLUDE " + DIR + "client/game1.listener.js;");
            // e.target.postMessage("INCLUDE " + DIR + "client/game1.render.map.js;");
            e.target.postMessage("INCLUDE " + DIR + "client/game1.css;");
        };
    }
})();
