var notifier = require('notifier');

var moveToTarget = function(creep, target) {
    var moveResult = creep.moveTo(target, {
    reusePath: 5,
    visualizePathStyle: {
        fill: 'transparent',
        stroke: '#fff',
        lineStyle: 'dashed',
        strokeWidth: .15,
        opacity: .1}
    });
    var stillMoving = false;
    switch(moveResult){
        case OK:
        case ERR_TIRED:
            return true;
        case ERR_NO_PATH:
            //TODO better reroute
            return false;
        default:
            notifier.notify("Creep had problem moving: " + moveResult);
            return false;
    }
};

var getEnergy = function(assignment, creep, target) {
    var getResult;
    if(!!target.structureType) {
        getResult = creep.withdraw(target, RESOURCE_ENERGY);
        switch(getResult) {
            case OK:
                return 1;
            case ERR_NOT_IN_RANGE:
                //keep moving
                break;
            case ERR_NOT_ENOUGH_RESOURCES:
                notifier.badAction("Creep is trying to get energy from something when it has none.", creep, target, assignment);
                return -1;
            case ERR_FULL:
                notifier.badAction("Creep is trying to get energy from something when the creep is full. ", creep, target, assignment);
                return -1;
            default:
                notifier.badAction("Get energy result (withdraw): " + getResult, creep, target, assignment);
                return -1;
        }
    } else {
        //check if source
        if(!!target.energyCapacity) {
            getResult = creep.harvest(target, RESOURCE_ENERGY);
            switch(getResult) {
                case OK:
                    return 1;
                case ERR_NOT_IN_RANGE:
                    //keep moving
                    break;
                case ERR_NOT_ENOUGH_ENERGY:
                    return -1;
                    break;
                default:
                    notifier.badAction("Get energy result (withdraw): " + getResult, creep, target, assignment);
                    return -1;
            }
        } else {
            getResult = creep.pickup(target, RESOURCE_ENERGY);
            switch(getResult) {
                case OK:
                case ERR_FULL:
                    return 1;
                case ERR_NOT_IN_RANGE:
                    //keep moving
                    break;
                default:
                    notifier.badAction("Get energy result (pickup): " + getResult, creep, target, assingment);
                    return -1;
            }
        }
    }
    var stillMoving = moveToTarget(creep, target);
    if(!stillMoving){
        return -1;
    }
    return 0;
};

var depositEnergy = function(assignment, creep, target) {
    if(creep.pos.isNearTo(target)) {
        var transferResult = creep.transfer(target, RESOURCE_ENERGY);
        switch(transferResult) {
            case OK:
                return 1;
            case ERR_FULL:
                return -1;
            case ERR_NOT_ENOUGH_RESOURCES:
                creep.say("No energy")
                notifier.badAction("Creep is trying to transfer energy when it has none. ", creep, target, assignment)
                return -1;
            default:
                notifier.badAction("Deposit result: " + transferResult, creep, target, assignment);
                return -1;
        }
    }
    var stillMoving = moveToTarget(creep, target);
    if(!stillMoving){
        return -1;
    }
    return 0;
}

module.exports = {
    run: function(assignment) {
        var creep = Game.getObjectById(assignment.creepId);
        if(!creep) {
            notifier.notify("Creep was not found while running assignment: " + JSON.stringify(assignment));
            return false;
        }
        var target = Game.getObjectById(assignment.targetId);
        if(!target && assignment.type != 'IDLE') {
            notifier.notify("Target was not found while running assignment: " + JSON.stringify(assignment));
            return false;
        }
        switch(assignment.type) {
            case "ITEM_PICKUP":
                if(creep.pos.isNearTo(target)) {
                    var pickupResult = creep.pickup(target);
                    switch(pickupResult) {
                        case OK:
                        case ERR_FULL:
                            return false;
                        default:
                            notifier.badAction("Pickup result: " + pickupResult, creep, target, assignment);
                            return false;
                    }
                }
                return moveToTarget(creep, target);
            case 'HARVEST':
                var harvestResult = creep.harvest(target);
                switch(harvestResult) {
                    case OK:
                        return _.sum(creep.carry) < creep.carryCapacity;
                    case ERR_NOT_IN_RANGE:
                        //keep moving
                        break;
                    default:
                        notifier.badAction("Bad harvest: " + harvestResult, creep, target, assignment);
                        return false;
                }
                return moveToTarget(creep, target);
            case 'GET_ENERGY':
                var result = getEnergy(assignment, creep, target)
                return result == 0;
            case 'BUILD':
                var buildResult = creep.build(target);
                switch(buildResult) {
                    case OK:
                        return true;
                    case ERR_NOT_IN_RANGE:
                        //keep moving
                        break;
                    case ERR_NOT_ENOUGH_RESOURCES:
                        return false;
                    default:
                        notifier.badAction("Bad build: " + pickupResult, creep, target, assignment);
                        return false;
                }
                return moveToTarget(creep, target);
            case 'DEPOSIT':
                var result;
                switch(assignment.resourceType) {
                    case RESOURCE_ENERGY:
                        result = depositEnergy(assignment, creep, target);
                        break;
                    default:
                        result = -1;
                        notifier.badAction("Unsupported deposit type: " + assignment.resourceType, creep, target, assignment);
                        break;
                }
                return result == 0;
            case 'REPAIR':
                var buildResult = creep.repair(target);
                switch(buildResult) {
                    case OK:
                        return target.hits < target.hitsMax;
                    case ERR_NOT_IN_RANGE:
                        //keep moving
                        break;
                    case ERR_NOT_ENOUGH_RESOURCES:
                        return false;
                    default:
                        notifier.badAction("Bad repair: " + pickupResult, creep, target, assignment);
                        return false;
                }
                return moveToTarget(creep, target);
                break;
            case 'UPGRADE':
                if(creep.carry.energy <= 0) {
                    return false;
                }
                var upgradeResult = creep.upgradeController(target);
                switch(upgradeResult) {
                    case OK:
                        return true;
                    case ERR_NOT_IN_RANGE:
                        //Keep moving
                        break;
                    default:
                        notifier.badAction("Bad upgrade: " + upgradeResult, creep, target, assignment);
                        return false;
                }
                
                return moveToTarget(creep, target);
            case 'TRANSFER':
                if(!!assignment.resourceTargetId && !assignment.gotSource) {
                    var targetSource = Game.getObjectById(assignment.resourceTargetId);
                    if(!targetSource) {
                        notifier.notify("Transfer source target no longer exists: " + assignment.resourceTargetId);
                        return false;
                    }
                    var result = getEnergy(assignment, creep, targetSource);
                    switch(result) {
                        case 1:
                            assignment.gotSource = true;
                            break;
                        case 0:
                            return true;
                        case -1:
                            notifier.badAction("Transfer (getting source) had a problem.", creep, targetSource, assignment);
                            return false;
                    }
                }
                
                var result = depositEnergy(assignment, creep, target);
                if(result == -1) {
                    notifier.badAction("Transfer (filling target) had a problem.", creep, target, assignment);
                }
                return result == 0;
            case 'IDLE':
                if(!creep.pos.isNearTo(assignment.idlePos)) {
                    return moveToTarget(creep, assignment.idlePos);
                }
                return false;
            default:
                notifier.notify("Not implemented assignment type: " + assignment.type);
                return false;
        }
        assignment.lastUpdate = Game.time;
    }
};