/**
 * Created by Ari on 12/29/2016.
 */


// Handle worker command
if (!module) var module = {exports:{}};
(function(){
    var includesLoaded = false;
    module.exports.handleWorkerCommand = function(e, commandString) {
        e.target.postMessage(
            // Render command back to client
            commandString
        );
    };
})();
