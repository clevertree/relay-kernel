/**
 * Created by Ari on 12/29/2016.
 */

if (!module) var module = {exports:{}};
module.exports.handleWorkerCommand = function(e, commandString) {
    
    e.target.postMessage(
        // Include client-side javascript support files
        "INCLUDE commands/echo.js;" +
        // Echo command back to client
        commandString
    );
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
