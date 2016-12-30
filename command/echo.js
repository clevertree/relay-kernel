/**
 * Created by Ari on 12/29/2016.
 */

if (!module) var module = {exports:{}};
module.exports.handleEchoCommand = function(e, commandString) {
    
    // Include client-side javascript support files
    e.target.postMessage("INCLUDE command/echo.js");
    // Echo command back to client
    e.target.postMessage(commandString);
};

// Handle client-side response
if (typeof document !== 'undefined') (function(){
    document.addEventListener('response:echo', handleEchoResponse);
    
    function handleEchoResponse (e) {
        // Echo to console
        var commandString = e.data || e.detail;
        console.log(commandString.substr(5));
    }
})();
