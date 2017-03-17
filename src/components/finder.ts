var assignmentService = require('assignment_service');
var notifier = require('notifier');

var roomCreepsCache;

var filterIncludes = function(value, filterValues) {
	if(!!filterValues) {
		if(_.isArray(filterValues)) {
			if(!_.includes(filterValues, value)) {
				return false;
			}
		} else if(filterValues != value) {
			return false;
		}
	}
	return true;
};

module.exports = {
	findClosest: function(pos, items) {
		//TODO path but better?
		return pos.findClosestByRange(items);
	},
	findCreepsForAssignment: function(room, assignmentType) {
		var creeps = module.exports.findIdleCreeps(room);
		if(!creeps || creeps.length < 1) {
			return [];
		}

		switch(assignmentType) {
			case 'ITEM_PICKUP':
				//TODO
				return _.filter(creeps, function(c) {
					return (c.carryCapacity - _.sum(c.carry)) >= 100;
				});
			case 'REPAIR':
				return _.filter(creeps, c => c.memory.role == 'BUILDER' && c.carry.energy > 100);
			default:
				notifier.notify("Get best creep is not implemented for: " + assignmentType);
				return [];
		}
	},
	findBestExcessEnergy: function(pos, excludeSources) {
		//TODO by path
		var target = pos.findClosestByRange(FIND_DROPPED_ENERGY);
		if(!!target) {
			return target;
		}
		//TODO by path
		target = pos.findClosestByRange(FIND_STRUCTURES, {
			filter: (s) => ((!!s.store && s.store.energy > 0) || s.energy > 0)
						&& s.structureType != STRUCTURE_SPAWN
						&& s.structureType != STRUCTURE_EXTENSION
						//TODO change to weight or calculate
						&& !assignmentService.isTargetAssigned(s, 'GET_ENERGY')
		});
		if(!!target) {
			return target;
		}
		if(excludeSources) {
			return null;
		}
		//TODO
		return null;
		var sources = module.exports.findSources(Game.rooms[pos.roomName]);
		return module.exports.findClosest(pos, sources);
	},





	findSources: function(room) {
		return room.find(FIND_SOURCES, {filter: (s) => s.energy > 0});
	},
	findMinerals: function(room) {
		return room.find(FIND_STRUCTURES, {filter: { structureType: STRUCTURE_EXTRACTOR }});
	},
	findConstructionSites: function(room) {
		return room.find(FIND_CONSTRUCTION_SITES);
	},
	//filter {excludedTargets, structureTypes}
	findDeposits: function(room, type, filter) {
		var deposit = room.find(FIND_STRUCTURES, {filter: (s) => {
			if(!!filter) {
				if(!filterIncludes(s.structureType, filter.structureTypes)) {
					return false;
				}
				if(!filterIncludes(s.id, filter.excludedTargets)) {
					return false;
				}
			}
			switch(s.structureType) {
				case STRUCTURE_SPAWN:
				case STRUCTURE_EXTENSION:
				case STRUCTURE_TOWER:
					if(type != RESOURCE_ENERGY) {
						return false;
					}
					//TODO tower
					return s.energy < s.energyCapacity;
				case STRUCTURE_STORAGE:
				case STRUCTURE_CONTAINER:
					return _.sum(s.store) < s.storeCapacity;
				case STRUCTURE_ROAD:
				case STRUCTURE_WALL:
				case STRUCTURE_CONTROLLER:
				case STRUCTURE_RAMPART:
					return false;
				default:
					notifier.notify("Non implemented structure for deposits: " + s.structureType);
					return false;
			}
		}});
		return deposit;
	},
	findControllers: function(room) {
		return room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_CONTROLLER});
	},
	findDroppedItems: function(room) {
		return room.find(FIND_DROPPED_ENERGY);
	},
	findBrokenStructures: function(room) {
		return room.find(FIND_STRUCTURES, { filter: (s) => s.hits <= (s.hitsMax / 3) });
	},
	///filter {roles}
	findIdleCreeps: function(room, filter) {
		//TODO optimize, but was having caching issue
		roomCreepsCache = room.find(FIND_MY_CREEPS);
		return _.filter(roomCreepsCache, function(c) {
			if(!!filter) {
				if(!filterIncludes(c.memory.role, filter.roles)){
					return false;
				}
			}
			return !assignmentService.creepHasAssignment(c);
		});
	}
};
