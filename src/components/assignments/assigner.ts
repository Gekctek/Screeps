var assignmentService = require('assignment_service');
var finder = require('finder');
var notifier = require('notifier');
module.exports = {
	assignIdle: function(room) {
		var idleCreeps = _.filter(room.find(FIND_MY_CREEPS), c => (c.memory.idle - Game.time) > 1);
		var target = room.find(FIND_FLAGS, {filter: t => t.name == 'Idle'});
		if(target.length < 1) {
			notifier.notify('Idle is full')
			return;
		}
		for(var i in idleCreeps) {
			assignmentService.addIdle(idleCreeps[i], target[0].pos);
		}
	},

	assignByRole: function (room) {
		var creeps = finder.findIdleCreeps(room);
		for(var name in creeps) {
			var creep = creeps[name];
			if(!creep.memory.role) {
				notifier.notify("Creep is missing a role setting to harvester: " + creep.name)
				creep.memory.role = "HARVESTER";
			}
			assignBasedOnRole(creep, creep.memory.role, true);
		}
	},

	assignFillSpawn: function(room) {
		//TODO
		var creeps = finder.findIdleCreeps(room, {roles: ['BUILDER', 'UPRGADER']});
		if(creeps.length < 1) {
			return;
		}
		var emptySpawnDeposits = finder.findDeposits(room, RESOURCE_ENERGY, {structureTypes: [STRUCTURE_SPAWN, STRUCTURE_EXTENSION]});
		for(var i in emptySpawnDeposits) {
			var target = emptySpawnDeposits[i];
			if(!assignmentService.isTargetAssigned(target, 'TRANSFER')) {
				var creep = finder.findClosest(target.pos, creeps);
				if(!creep) {
					var creepsString = "[" + _.map(creeps, c => c.pos).join(', ') + "]";
					notifier.notify("Could not find a closest creep for target " + target.pos + " out of: " + creepsString)
					continue;
				}
				var energySource;
				//TODO
				if(creep.carry.energy <= 0) {
					energySource = finder.findBestExcessEnergy(creep.pos, true);
					if(!energySource) {
						// no sources
						return;
					}
				}
				assignmentService.addTransfer(creep, target, RESOURCE_ENERGY, energySource)
				_.remove(creeps, creep)
				if(creeps.length < 1){
					return;
				}
			}
		}
	},

	assignDroppedItems: function(room) {
		var droppedItems = finder.findDroppedItems(room);
		if(droppedItems.length < 1) {
			return;
		}
		for(var i in droppedItems) {
			var item = droppedItems[i];
			if(!assignmentService.isTargetAssigned(item)) {
				var creeps = finder.findCreepsForAssignment(room, 'ITEM_PICKUP');
				if(creeps.length > 0) {
					var creep = finder.findClosest(item.pos, creeps);
					assignmentService.addItemPickup(creep, item);
				}
			}
		}
	},

	assignBrokenStructures: function(room) {
		var brokenItems = finder.findBrokenStructures(room);
		if(brokenItems.length < 1){
			return;
		}
		var spawn = room.find(FIND_MY_SPAWNS)[0];
		//TODO
		//Get closest to spawn first
		_.sortBy(brokenItems, [function(bi) { return bi.pos.getRangeTo(spawn)}])
		var creeps = finder.findCreepsForAssignment(room, 'REPAIR');
		for(var i in brokenItems) {
			//leave 2 to build? TODO
			if(creeps.length > 2) {
				var item = brokenItems[i];
				if(!assignmentService.isTargetAssigned(item, 'REPAIR')) {
					var creep = finder.findClosest(item.pos, creeps);
					if(!!creep) {
						assignmentService.addRepair(creep, item);
						_.remove(creeps, creep)
					} else {
						var creepsString = "[" + _.map(creeps, c => c.name + " - "  +  c.pos).join(', ') + "]";
						notifier.notify("Could not find a closest repair creep out of: " + creepsString)
					}
				}
			}
		}
	}
};
var assignBasedOnRole = function(creep, role) {
	switch(role) {
		case "HARVESTER":
			//make sure it is always next to a source
			var closeSources = creep.pos.findInRange(FIND_SOURCES, 1);
			var source;
			if(closeSources.length < 1) {
				var sources = finder.findSources(creep.room);
				for(var i in sources) {
					if(!assignmentService.isTargetAssigned(sources[i], 'HARVEST')) {
						source = sources[i];
						break;
					}
				}
				if(!source){
					notifier.notify("No sources are available." + creep.name);
					return;
				} else {
					assignmentService.addHarvest(creep, source);
					return;
				}
			} else {
				source = closeSources[0];
			}
			if(creep.carry.energy >= creep.carryCapacity) {
				//var containers = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: s => !!s.store && s.storeCapactity > 0});
				//TODO switch
				var containers = finder.findDeposits(creep.room, RESOURCE_ENERGY);
				if(containers.length < 1) {
					notifier.notify("Harvester has no container next to it.");
					return;
				}
				var container = finder.findClosest(creep.pos, containers);
				if(!container) {
					notifier.notify("Container not found for depositing for a harvest.");
					return;
				}
				assignmentService.addDeposit(creep, container, RESOURCE_ENERGY);
				return;
			} else {
				//TODO
				assignmentService.addHarvest(creep, source);
				return;
			}
			//for(var carryType in creep.carry) {
				//var resource = creep.carry[carryType];
				//if(resource > 0) {
					//var targets = finder.findDeposits(creep.room, carryType);
					//if(targets.length > 0) {
						//var target = finder.findClosest(creep.pos, targets);
						//if(!!target){
							//assignmentService.addDeposit(creep, target, carryType);
							//return;
						//}
					//}
				//}
			//}
			//var targets = finder.findSources(creep.room);
			//if(targets.length > 0) {
				//var target = finder.findClosest(creep.pos, targets);
				//if(!!target){
					//assignmentService.addHarvest(creep, target);
					//return;
				//}
			//}

			break;
		case "BUILDER":
			if((creep.carryCapacity - creep.carry.energy) < 100 || creep.carry.energy >= 150) {
				var targets = finder.findConstructionSites(creep.room);
				if(targets.length > 0) {
					var target = finder.findClosest(creep.pos, targets);
					if(!!target){
						assignmentService.addBuild(creep, target);
					return;
					}
				}
				//TODO
			} else {
				var target = finder.findBestExcessEnergy(creep.pos);
				if(!!target) {
					assignmentService.addGetEnergy(creep, target);
					return;
				}
				//TODO
			}
			break;
		case "UPGRADER":
			if(creep.carry.energy > 0) {
				var targets = finder.findControllers(creep.room);
				if(targets.length > 0) {
					var target = finder.findClosest(creep.pos, targets);
					if(!!target){
						assignmentService.addUpgrade(creep, target);
						return;
					}
				}
				//TODO
			} else {
				var target = finder.findBestExcessEnergy(creep.pos);
				if(!!target){
					assignmentService.addGetEnergy(creep, target);
					return;
				}
				//TODO
			}
			break;
		default:
			notifier.notify("Not implemented role: " + role)
			break;
	}
}
