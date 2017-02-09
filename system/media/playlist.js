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
        var handlers = {};

        this.queue = function(e, url) {
            queue.push(url);
            console.log("Queued: " + url);
        };

        this.play = function(e, url, offset) {
            queue = [url];
            position = 0;
            THIS.start(e, offset || 0);
        };

        this.start = function(e, offset) {
            // TODO: stop current playing song

            var url = THIS.getCurrentEntryURL();
            var handler = getURLHandler(e, url);

            handler.start(e, offset);
        };

        this.stop = function(e) {
            console.log("TODO: stop playing", queue, position);
        };

        this.getCurrentEntryURL = function() {
            return queue[position];
        };

        function getURLHandler(e, url) {
            if(handlers[url]) {
                return handlers[url];
            }

            module.exports = {};
            console.info("Importing Song: " + url);
            importScripts(url);
            if(typeof module.exports.start !== 'function')
                throw new Error("Handler has no start function: " + url);

            if(typeof module.exports.init == 'function')
                module.exports.init(e);

            handlers[url] = module.exports;
            return handlers[url];
        }
    }
})();
