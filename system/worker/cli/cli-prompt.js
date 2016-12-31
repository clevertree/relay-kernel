
if (!module) var module = {exports: {}};
module.exports.CLIPrompt = new CLIPrompt();


function CLIPrompt() {
    var THIS = this;
    var events = {};
    this.isCLI = true;
    this.addEventListener = function (type, callback) {
        if (typeof events[type] == 'undefined')
            events[type] = [];

        if (events[type].indexOf(callback) >= 0)
            throw new Error("Event callback added twice for same event: " + type);
        events[type].push(callback);
        // console.log(events);
    };

    this.removeEventListener = function (type, callback) {
        if (typeof events[type] == 'undefined')
            throw new Error("Event did not exist");

        if (callback) {
            var i = events[type].indexOf(callback);
            if (callback && i >= 0)
                throw new Error("Event callback was not found for event: " + type);

            events[type].splice(i, 1);

        } else {
            delete events[type];
        }
    };

    this.triggerEvent = function (eventObj) {
        var type = eventObj.type;
        if (!type)
            throw new Error("Invalid event object type");

        if (typeof events[type] == 'undefined')
            return false;

        for (var i = 0; i < events[type].length; i++) {
            events[type][i](eventObj);
        }
    };

    this.postMessage = function (message) {
        console.info(message);
    };

    this.executeCommand = executeCommand;
    function executeCommand (commandString) {
        var commandEvent = {
            type: 'message',
            detail: commandString,
            target: THIS,
            defaultPrevented: false,
            isCLI: true
        };
        commandEvent.preventDefault = function() { commandEvent.defaultPrevented = true; };
        try {
            THIS.triggerEvent(commandEvent);
            if(!commandEvent.defaultPrevented)
                console.error("Unhandled command: " + commandString, commandEvent);
        } catch (e) {
            console.error(e);
        }
    }

    this.start = function () {
        process.stdout.write("> ");
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        var util = require('util');

        process.stdin.on('data', function (text) {
            if(text.trim())
                executeCommand(text);

            if (text === 'quit\n') {
                done();
            }
            process.stdout.write("\n> ");
        });

        function done() {
            console.log('Now that process.stdin is paused, there is nothing more to do.');
            process.exit();
        }
    };
}