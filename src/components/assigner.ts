import { assignmentService } from "./assignment_service";
import { finder } from "./finder";
import { log } from "./support/log";
import {AssignmentType,Assignment} from "./assignments/assignment"
import {MoveAssignment} from "./assignments/assignment.move"
import {HarvestAssignment} from "./assignments/assignment.harvest"
import {BuildAssignment} from "./assignments/assignment.build"
import {DepositAssignment} from "./assignments/assignment.deposit"
import {ItemPickupAssignment} from "./assignments/assignment.pickup"
import {RepairAssignment} from "./assignments/assignment.repair"
import {GetResourceAssignment} from "./assignments/assignment.resource"
import {TransferAssignment} from "./assignments/assignment.transfer"
import {UpgradeAssignment} from "./assignments/assignment.upgrade"


class Assigner {

	public assignIdle(room: Room) {
		var idleCreeps = _.filter(room.find<Creep>(FIND_MY_CREEPS), c => (c.memory.idle - Game.time) > 1);
		var target = room.find<Flag>(FIND_FLAGS, { filter: (t: Flag) => t.name == 'Idle' });
		if (target.length < 1) {
			log.warning('Idle is full')
			return;
		}
		for (var i in idleCreeps) {
			assignmentService.addAssignment(new MoveAssignment(idleCreeps[i], target[0].pos));
		}
	}

	public assignByRole(room: Room) {
		var creeps = finder.findIdleCreeps(room);
		for (var name in creeps) {
			var creep = creeps[name];
			if (!creep.memory.role) {
				log.warning("Creep is missing a role setting to harvester: " + creep.name)
				creep.memory.role = "HARVESTER";
			}
			this.assignBasedOnRole(creep, creep.memory.role);
		}
	}

	public assignFillSpawn(room: Room) {
		//TODO
		var creeps = finder.findIdleCreeps(room, { roles: ['RUNNER'] });
		if (creeps.length < 1) {
			return;
		}
		let structureTypes = { structureTypes: [STRUCTURE_SPAWN, STRUCTURE_EXTENSION], excludedTargets: undefined };
		var emptySpawnDeposits = finder.findDeposits(room, RESOURCE_ENERGY, structureTypes);
		for (var i in emptySpawnDeposits) {
			var target = emptySpawnDeposits[i];
			if (!assignmentService.isTargetAssigned(target, AssignmentType.Transfer)) {
				var creep = finder.findClosest(target.pos, creeps);
				if (!creep) {
					var creepsString = "[" + _.map(creeps, c => c.pos).join(', ') + "]";
					log.warning("Could not find a closest creep for target " + target.pos + " out of: " + creepsString)
					continue;
				}
				let energySource: {id:string} | undefined = undefined;
				//TODO
				if (!creep.carry.energy || creep.carry.energy <= 0) {
					energySource = finder.findBestExcessEnergy(creep.pos);
					if (!energySource) {
						// no sources
						return;
					}
				}
				assignmentService.addAssignment(new TransferAssignment(creep, target, RESOURCE_ENERGY, energySource, !energySource));
				_.remove(creeps, creep)
				if (creeps.length < 1) {
					return;
				}
			}
		}
	}

	public assignDroppedItems(room: Room) {
		let droppedItems: Resource[] = finder.findDroppedItems(room);
		if (droppedItems.length < 1) {
			return;
		}
		for (var i in droppedItems) {
			let item: Resource = droppedItems[i];
			if (!assignmentService.isTargetAssigned(item)) {
				let creeps: Creep[] = finder.findCreepsForAssignment(room, AssignmentType.ItemPickup);
				if (creeps.length > 0) {
					let creep: Creep | undefined = finder.findClosest(item.pos, creeps);
					if (!!creep) {
						assignmentService.addAssignment(new ItemPickupAssignment(creep, item));
					}
				}
			}
		}
	}

	public assignBrokenStructures(room: Room) {
		let brokenItems: Structure[] = finder.findBrokenStructures(room);
		if (brokenItems.length < 1) {
			return;
		}
		let spawn: Spawn = room.find<Spawn>(FIND_MY_SPAWNS)[0];
		//TODO
		//Get closest to spawn first
		_.sortBy(brokenItems, [function (bi: Structure) { return bi.pos.getRangeTo(spawn) }]);
		let creeps: Creep[] = finder.findCreepsForAssignment(room, AssignmentType.Repair);
		for (var i in brokenItems) {
			//leave 2 to build? TODO
			if (creeps.length > 2) {
				let item: Structure = brokenItems[i];
				if (!assignmentService.isTargetAssigned(item, AssignmentType.Repair)) {
					let creep: Creep | undefined = finder.findClosest(item.pos, creeps);
					if (!!creep) {
						assignmentService.addAssignment(new RepairAssignment(creep, item));
						_.remove(creeps, creep)
					} else {
						var creepsString = "[" + _.map(creeps, c => c.name + " - " + c.pos).join(', ') + "]";
						log.warning("Could not find a closest repair creep out of: " + creepsString)
					}
				}
			}
		}
	}
	private assignBasedOnRole(creep: Creep, role: string) {
		let assignment: Assignment;
		switch (role) {
			case "HARVESTER":
				if (!!creep.carry.energy && creep.carry.energy >= creep.carryCapacity) {
					//var containers = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: s => !!s.store && s.storeCapactity > 0});
					//TODO switch
					let containers: Structure[] = finder.findDeposits(creep.room, RESOURCE_ENERGY);
					if (containers.length < 1) {
						log.warning("Harvester has no container next to it.");
						return;
					}
					let container: Structure | undefined = finder.findClosest(creep.pos, containers);
					if (!container) {
						log.warning("Container not found for depositing for a harvest.");
						return;
					}
					assignment = new DepositAssignment(creep, container, RESOURCE_ENERGY);
				} else {
					//TODO
					//make sure it is always next to a source
					let closeSources: Source[] = creep.pos.findInRange<Source>(FIND_SOURCES, 1);
					var source;
					if (closeSources.length < 1) {
						var sources = finder.findSources(creep.room);
						for (var i in sources) {
							console.log(JSON.stringify(sources[i]))
							if (!assignmentService.isTargetAssigned(sources[i], AssignmentType.Harvest)) {
								source = sources[i];
								break;
							}
						}
						if (!source) {
							log.warning("No sources are available." + creep.name);
							return;
						}
					} else {
						source = closeSources[0];
					}
					if(source.energy <= 0)
					{
						//TODO do something else or just sit there?
						return;
					}
					assignment = new HarvestAssignment(creep, source);
				}
				break;
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
			case "BUILDER":
				if (!!creep.carry.energy && (creep.carry.energy / creep.carryCapacity) > .75) {//  || creep.carry.energy >= 150? something like this?
					let targets = finder.findConstructionSites(creep.room);
					if (targets.length < 1) {
						//TODO Fill up?
						return;
					}
					let target = finder.findClosest(creep.pos, targets);
					if (!target) {
						return;
					}
					assignment = new BuildAssignment(creep, target);
				} else {
					let target = finder.findBestExcessEnergy(creep.pos);
					if (!target) {
						return;
					}
					assignment = new GetResourceAssignment(creep, target, RESOURCE_ENERGY);
				}
				break;
			case "UPGRADER":
				if (!!creep.carry.energy && creep.carry.energy > 0) {
					let controllers = finder.findControllers(creep.room);
					if (controllers.length < 1) {
						return;
					}
					var target = finder.findClosest(creep.pos, controllers);
					if (!target) {
						return;
					}
					assignment = new UpgradeAssignment(creep, target);
				} else {
					let target = finder.findBestExcessEnergy(creep.pos);
					if (!target) {
						return;
					}
					assignment = new GetResourceAssignment(creep, target, RESOURCE_ENERGY);
				}
				break;
			case "RUNNER":
				if (!!creep.carry.energy && creep.carry.energy > 0) {
					let containers: Structure[] = finder.findDeposits(creep.room, RESOURCE_ENERGY);
					if (containers.length < 1) {
						log.warning("Runner has nothing to get.");
						return;
					}
					let container: Structure | undefined = finder.findClosest(creep.pos, containers);
					if (!container) {
						log.warning("Container not found for depositing for a runner.");
						return;
					}
					assignment = new DepositAssignment(creep, container, RESOURCE_ENERGY);
				}
				else {
					let target = finder.findBestExcessEnergy(creep.pos);
					if (!target) {
						return;
					}
					assignment = new GetResourceAssignment(creep, target, RESOURCE_ENERGY);
				}
				break;
			default:
				log.error("Not implemented role: " + role)
				return;
		}
		assignmentService.addAssignment(assignment);
	}
}

export var assigner = new Assigner();
