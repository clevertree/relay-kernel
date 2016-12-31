/**
 * Created by Ari on 12/29/2016.
 */

if (!module) var module = {exports:{}};
module.exports.initWorkerCommands = function(worker) {
    worker.addEventListener('message', handleMessage);

    var availableCommands = {
        'chat':'system/commands/chat.js',

        'play':'system/commands/play.js',
        'queue':'system/commands/queue.js',

        'get':'system/commands/get.js',
        'render':'system/commands/render.js',
        'echo':'system/commands/echo.js'
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
        var handleWorkerCommand = req(filePath).handleWorkerCommand;
        if(!handleWorkerCommand)
            throw new Error("module.exports.handleWorkerCommand not found in " + filePath);

        typeCommands[type] = handleWorkerCommand;
        // console.log("Imported " + filePath, typeCommands);
        return typeCommands[type](e, commandString);
    }

    function req(filePath) {
        if(typeof require !== 'undefined')
            return require('../../' + filePath);
        importScripts(filePath);
        return module.exports;
    }
};