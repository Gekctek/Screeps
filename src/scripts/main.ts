var assignmentService = require('assignment_service');
var assignmentRunner = require('assignment_runner');
var assigner = require('assigner');
var spawner = require('spawner');
var notifier = require('notifier');

const profiler = require('profiler');
profiler.enable();

module.exports.loop = function () {
    profiler.wrap(function() {
    if(!Memory.assignments){
        Memory.assignments = {};
    }
    for(var name in Game.rooms) {
        var room = Game.rooms[name];
        //check for enemies/assign them
        var hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
        if(hostileCreeps.length > 0) {
            notifier.notify("ENEMIES!!!!!");
        }
        
        
        
        try {
            //unassign idle creeps, update assignment every .run(), if no run, kill
            assigner.assignFillSpawn(room);
            
            assigner.assignBrokenStructures(room);
    
            //TODO
            assigner.assignDroppedItems(room);
            
            
            assigner.assignByRole(room);
            assigner.assignIdle(room);
            
        }catch(error) {
            notifier.notify("Error when assigning: " + error + " " + error.stack)
        }
        
        
        
        
        try {
            executeAssignments(room);
        } catch(error) {
            notifier.notify("Error when executing assignments: " + error + " " + error.stack)
        }
        
       
        
        try{
            //balance rooms?
            spawner.run(room);
            
            spawner.cleanupDead(room);
        }catch(error){
            notifier.notify("Error when spawning: " + error + " " + error.stack)
        }
    }
    });
}


var executeAssignments = function (room) {
    var finishedAssignments = [];
    var assignments = assignmentService.getAll();
    for(var id in assignments) {
        var assignment = assignments[id];
        var stillRunning;
        try {
            stillRunning = assignmentRunner.run(assignment);
        } catch(error) {
            notifier.notify(error);
        }
        if(!stillRunning) {
            if(!!Memory.creeps[assignment.id] && !Memory.creeps[assignment.id].idle) {
                Memory.creeps[assignment.id].idle = Game.time;
            }
            assignmentService.delete(assignment.id);
        } else {
            Memory.creeps[assignment.id].idle = null;
        }
    }
}


