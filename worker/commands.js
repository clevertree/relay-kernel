/**
 * Created by Ari on 12/29/2016.
 */

if (!module) var module = {exports:{}};
module.exports.initWorkerCommands = function(worker) {
    worker.addEventListener('message', handleMessage);

    var availableCommands = {
        'chat':'commands/chat.js',

        'play':'commands/play.js',
        'queue':'commands/queue.js',

        'get':'commands/get.js',
        'render':'commands/render.js',
        'echo':'commands/echo.js'
    };

    var typeCommands = {};

    // Define command
    function handleMessage(e) {
        var commandString = e.data || e.detail;
        if (!commandString)
            throw new Error("Ignoring empty message");
        var type = commandString.split(/[^\w]+/)[0].toLowerCase();

        if(typeof typeCommands[type] !== 'undefined')
            return typeCommands[type](e, commandString);

        if(typeof availableCommands[type] === 'undefined')
            throw new Error("Invalid command type: " + type);

        var filePath = availableCommands[type];
        importScripts(filePath);
        if(!module.exports.handleWorkerCommand)
            throw new Error("module.exports.handleWorkerCommand not found in " + filePath);

        typeCommands[type] = module.exports.handleWorkerCommand;
        // console.log("Imported " + filePath, typeCommands);
        return typeCommands[type](e, commandString);
    }
    
    
};