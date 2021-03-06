/**
 * Created by Ari on 12/29/2016.
 */


// Handle worker command
if (!module) var module = {exports:{}};
module.exports.handleWorkerCommand = function(e, commandString) {
    
    e.target.postMessage(
        // Include client-side javascript support files
        "INCLUDE system/commands/get.js;" +
        // Get command back to client
        commandString
    );
};

// Handle client-side response
if (typeof document !== 'undefined') (function(){
    document.addEventListener('response:get', handleGetResponse);
    
    function handleGetResponse (e) {
        var commandString = e.data || e.detail;
        console.log("TODO " + commandString); 
        e.preventDefault();
    }
})();
