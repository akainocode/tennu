var events = require('events');
var util = require('util');
var Log = require('./protocols/log');
var Command = require('./structures/command');

/**
 * @constructor
 * @param {NRC} nrc Context to which the commander listens upon. Must be an
 * event emitter that emits the 'privmsg' event.
 * @param {Object} config Configuration object. See Readme.md for options.
 * @param {Object} opt Optional parameters. List: log
 */
var Commander = function (nrc, config, opt) {
    events.EventEmitter.call(this);
    var that = this;
    this.ctx = nrc;
    this.trigger = config.trigger || "!";
    this.log = (opt && opt.log) || {};

    nrc.on('privmsg', function (msg) {
        // Deterimine if the event is a command.
        var command = that.getCommandString(msg);
        if (command) {
            command = Object.freeze(new Command(msg.actor, command,
                msg.channel, msg.isQuery));
            Log.event(that.log, "Command: " + command.name);
            that.emit(command.name, command);
        }
    });
};

Commander.prototype = new events.EventEmitter();
Commander.prototype.constructor = Commander;

/**
 * Rebinding of on to bind |this| to the passed in context, in this case the
 * NRC object.
 * @param message Message to listen to.
 * @param callback Function to execute when message emitted.
 */
Commander.prototype.on = function (message, callback) {
    events.EventEmitter.prototype.on.call(this, message,
        callback.bind(this.ctx));
};

Commander.prototype.getCommandString = function (privmsg) {
    if (privmsg.message[0] === this.trigger[0]) {
        return privmsg.message.substr(1);
    }

    if (privmsg.isQuery) {
        return privmsg.message;
    }

    if (privmsg.message.indexOf(this.ctx.nick()) === 0) {
        var msg = privmsg.message.substr(privmsg.message.indexOf(" ") + 1);

        if (msg[0] === this.trigger[0]) {
            return msg.substr(1);
        } else {
            return msg;
        }
    }

    return false;
};

module.exports = Commander;