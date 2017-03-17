/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('notifier');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    notify: function(message) {
        Game.notify(message);
        console.log(message);
    },
    badAction: function(message, creep, target, assignment) {
        message = message + '\n' +
        "Creep: " + JSON.stringify(creep) + '\n' +
        "Target: " + JSON.stringify(target) + '\n' +
        "Assignment: " + JSON.stringify(assignment);
        module.exports.notify(message)
    }
};