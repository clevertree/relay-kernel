/**
 * Created by Ari on 12/29/2016.
 */


// Handle worker command
if (!module) var module = {exports:{}};
module.exports.handleWorkerCommand = function(e, commandString) {

    // Include client-side javascript support files
    commandString = "INCLUDE system/commands/echo.js;" + commandString; // TODO: better hack needed

    e.target.postMessage(
        // Echo command back to client or console
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
        console.log('ECHO', commandString.substr(5));
        e.preventDefault();
    }
})();
