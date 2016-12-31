/**
 * Created by Ari on 12/30/2016.
 */


if (!module) var module = {exports: {}};
module.exports.PlayList = (function() {
    var inst;
    if(typeof self !== 'undefined') {
        inst = typeof self.system_media_playlist !== 'undefined'
            ? self.system_media_playlist
            : new PlayList();
    } else {
        throw new Error("TODO how do globals work in this?");
    }
    return inst;

    function PlayList() {
        var THIS = this;
        var queue = [];
        var position = 0;

        this.queue = function(filePath) {
            queue.push(filePath);
            console.log("File queued: " + filePath);
        };

        this.play = function(filePath) {
            queue = [filePath];
            position = 0;
            THIS.start();
        };

        this.start = function() {
            console.log("TODO: start playing", queue, position);
        };

        this.stop = function() {
            console.log("TODO: stop playing", queue, position);
        };
    }
})();
