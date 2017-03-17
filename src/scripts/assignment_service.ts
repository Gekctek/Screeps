var notifier = require('notifier');

var addAssignment = function(creep, target, type, assignment){
    if(!creep) {
        notifier.notify("No creep was selected for assignment "+type+" and target "+JSON.stringify(target)+".")
        return;
    }
    //null check to make sure i didnt specify null
    if(!target && target !== null) {
        notifier.notify("No target was selected for assignment "+type+".")
        return;
    }
    if(!type) {
        notifier.notify("No type was selected for an assignment with target "+JSON.stringify(target)+".")
        return;
    }
    assignment = assignment || {};
    var id = creep.name;
    if(!!Memory.assignments[id]) {
        notifier.notify("Assignment '"+id+"' already exists, overriding. BEFORE: " + Memory.assignments[id].type + " - AFTER: " + type)
    }
    assignment['id'] = id;
    assignment['type'] = type;
    if(!!target) {
        assignment['targetId'] = target.id;
    }
    assignment['creepId'] = creep.id;
    Memory.assignments[id] = assignment;
}

module.exports = {
    addItemPickup: function(creep, target) {
         addAssignment(creep, target, "ITEM_PICKUP");
    },
    addDeposit: function(creep, target, resourceType) {
         addAssignment(creep, target, "DEPOSIT", {resourceType: resourceType});
    },
    addGetEnergy: function(creep, target) {
        addAssignment(creep, target, 'GET_ENERGY')
    },
    addHarvest: function(creep, target, type) {
         addAssignment(creep, target, "HARVEST", {type: type});
    },
    addUpgrade: function(creep, target) {
         addAssignment(creep, target, "UPGRADE");
    },
    addBuild: function(creep, target) {
         addAssignment(creep, target, "BUILD");
    },
    addRepair: function(creep, target) {
        addAssignment(creep, target, 'REPAIR');
    },
    addTransfer: function(creep, target, resourceType, resourceTarget) {
        var options = {resourceType: resourceType};
        if(!!resourceTarget) {
            options['resourceTargetId'] = resourceTarget.id;
        }
        addAssignment(creep, target, 'TRANSFER', options);
    },
    addIdle: function(creep, idlePos) {
      addAssignment(creep, null, 'IDLE', {idlePos: idlePos});
    },
    
    
    
    getAll: function() {
        return Memory.assignments;
    },
    isTargetAssigned: function(target, type) {
        var assignments = [];
        for(var id in Memory.assignments) {
            var assignment = Memory.assignments[id];
            if(assignment.targetId == target.id){
                if(!type) {
                    return true;
                }
                if(assignment.type == type) {
                    assignments.push(assignment);
                }
            }
        }
        if(assignments.length > 1) {
            //check to see if the target allows more than one target
            if(!!Memory.targets && !!Memory.targets[target.id] && Memory.targets[target.id].maxAllowed[type] > assignments.length) {
                return false;
            }
            return true;
        }
        return false;
    },
    creepHasAssignment: function(creep) {
        return Memory.assignments[creep.name];
    },
    
    delete: function(id) {
        delete Memory.assignments[id];
    }
};