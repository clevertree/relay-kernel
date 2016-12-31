/**
 * Created by Ari on 12/29/2016.
 */


// Handle worker command
if (!module) var module = {exports:{}};
module.exports.handleWorkerCommand = function(e, commandString) {
    var type = commandString.split(' ')[0].toLowerCase();
    var path = commandString.substr(type.length+1);

    var PlayList = req('system/media/playlist.js').PlayList;
    PlayList.play(path);
    

    // Include client-side javascript support files
    var responseString = "INCLUDE system/commands/play.js";

    e.target.postMessage(
        // Play command back to client
        responseString
    );

    function req(filePath) {
        if(typeof require !== 'undefined')
            return require('../../' + filePath);
        importScripts(filePath);
        return module.exports;
    }
};

// Handle client-side response
if (typeof document !== 'undefined') (function(){
    document.addEventListener('response:play', handlePlayResponse);
    
    function handlePlayResponse (e) {
        var commandString = e.data || e.detail;
        e.preventDefault();

        console.log("TODO HANDLE AUDIO");
    }
})();
