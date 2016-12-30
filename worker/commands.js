/**
 * Created by Ari on 12/29/2016.
 */

if (!module) var module = {exports:{}};
module.exports.initWorkerCommands = function(worker) {
    worker.addEventListener('message', handleMessage);

    var availableCommands = {
        'echo':'command/echo.js'
    };

    var typeCommands = {};

    // Define command
    function handleMessage(e) {
        var commandString = e.data || e.detail;
        if (!commandString)
            throw new Error("Ignoring empty message");
        var type = commandString.split(/[^\w]+/)[0].toLowerCase();

        if(typeof typeCommands[type] !== 'undefined') {
            return typeCommands[type](e, commandString);
        }


        // TODO LOAD COMMANDS!

        throw new Error("Unhandled Worker Command: " + commandString);
    }
    
    
};