/**
 * Created by Ari on 12/29/2016.
 */


// Handle worker command
if (!module) var module = {exports:{}};
module.exports.handleWorkerCommand = function(e, commandString) {
    var split = commandString.split(' ');
    var type = split[0].toLowerCase();
    var url = split[1];
    var offset = split[2];

    var PlayList = req('system/media/playlist.js').PlayList;
    PlayList.play(e, url, offset);
    

    // Include client-side javascript support files
    //var responseString = "INCLUDE system/commands/play.js";

    //e.target.postMessage(
        // Play command back to client
        //responseString
    //);

    function req(filePath) {
        if(typeof require !== 'undefined')
            return require('../../' + filePath);
        importScripts(filePath);
        return module.exports;
    }
};
