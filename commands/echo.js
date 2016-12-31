/**
 * Created by Ari on 12/29/2016.
 */


// Handle worker command
if (!module) var module = {exports:{}};
module.exports.handleWorkerCommand = function(e, commandString) {

    if(!e.isCLI) {
        // Include client-side javascript support files
        commandString = "INCLUDE commands/echo.js;" + commandString;
    }

    e.target.postMessage(
        // Echo command back to client
        commandString
    );
    e.preventDefault();
};

// Handle client-side response
if (typeof document !== 'undefined') (function(){
    document.addEventListener('response:echo', handleEchoResponse);
    
    function handleEchoResponse (e) {
        // Echo to console
        var commandString = e.data || e.detail;
        console.log(commandString); // .substr(5));
        e.preventDefault();
    }
})();
