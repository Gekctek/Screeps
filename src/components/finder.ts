import {assignmentService} from "./assignment_service"
import {log} from "./support/log";
import {AssignmentType} from "./assignments/assignment"


class Finder {
	private static filterIncludes<T>(value: T, filterValues: T[]) : boolean {
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
	}

	public findClosest<T extends RoomObject>(pos: RoomPosition, items: T[]) : T | undefined {
		//TODO path but better?
		return pos.findClosestByRange(items);
	}
	public findCreepsForAssignment(room: Room, assignmentType: AssignmentType) : Creep[] {
		var creeps = this.findIdleCreeps(room, undefined);
		if(!creeps || creeps.length < 1) {
			return [];
		}

		switch(assignmentType) {
			case AssignmentType.ItemPickup:
				//TODO
				return _.filter(creeps, function(c) {
					return c.memory.role == "RUNNER" && (c.carryCapacity - _.sum(c.carry)) >= 100;
				});
			case AssignmentType.Repair:
				return _.filter(creeps, c => c.memory.role == 'BUILDER' && !!c.carry.energy && c.carry.energy > 100);
			default:
				log.error("Get best creep is not implemented for: " + assignmentType);
				return [];
		}
	}

	public findBestExcessEnergy(pos: RoomPosition, minPercent?: number, excludeSources?: boolean) : {id:string} | undefined {
		//TODO by path
		let target: {id:string} | undefined = pos.findClosestByRange<Resource>(FIND_DROPPED_ENERGY, {
			filter: (s: Structure) => !assignmentService.isTargetAssigned(s)
		});
		if(!!target) {
			return target;
		}
		//TODO by path
		let targets = Game.rooms[pos.roomName].find<Structure>(FIND_STRUCTURES, {
			filter: (s: Structure) => {
				let hasStorage: boolean = false;
				if(s instanceof StructureContainer || s instanceof StructureStorage) {
					hasStorage = !!s.store && !!s.store.energy && s.store.energy > 0;
					if(hasStorage && !!minPercent && (s.store.energy / s.storeCapacity) < minPercent) {
						hasStorage = false;
					}
				}

				if(!hasStorage) {
					return false;
				}
				//TODO change to weight or calculate
				return !assignmentService.isTargetAssigned(s, AssignmentType.GetResource);
		}});


		if(targets.length > 0) {
			_.sortBy(targets, [(t: any) => (t.store.energy / t.storeCapacity) + pos.getRangeTo(t) * .05]);
			return targets[0];
		}
		if(excludeSources) {
			return undefined;
		}
		let sources = this.findSources(Game.rooms[pos.roomName]);
		return this.findClosest(pos, sources);
	}





	public findSources(room: Room) : Source[] {
		return room.find<Source>(FIND_SOURCES, {filter: (s: Source) => s.energy > 0});
	}
	public findMinerals(room: Room) : Mineral[] {
		return room.find<Mineral>(FIND_STRUCTURES, {filter: { structureType: STRUCTURE_EXTRACTOR }});
	}
	public findConstructionSites(room: Room) : ConstructionSite[] {
		return room.find<ConstructionSite>(FIND_CONSTRUCTION_SITES);
	}

	public findDeposits(room: Room, type: string, filter?: DepositFilter) : Structure[] {
		var deposit = room.find<Structure>(FIND_STRUCTURES, {filter: (s: Structure) => {
			if(!!filter) {
				if(!!filter.structureTypes && !Finder.filterIncludes(s.structureType, filter.structureTypes)) {
					return false;
				}
				if(!!filter.excludedTargets && !Finder.filterIncludes(s.id, filter.excludedTargets)) {
					return false;
				}
				if(!!filter.customExp && !filter.customExp(s)){
					return false;
				}
			}
			if(s instanceof StructureStorage || s instanceof StructureContainer) {
				return _.sum(s.store) < s.storeCapacity;
			}
				//TODO tower
			if(s instanceof StructureSpawn || s instanceof StructureExtension || s instanceof StructureTower) {
				if(type != RESOURCE_ENERGY) {
					return false;
				}
				return s.energy < s.energyCapacity;
			}
			return false;
		}});
		return deposit;
	}
	public findControllers(room: Room) : Controller[] {
		return room.find<Controller>(FIND_STRUCTURES, {filter: (s: Structure) => s.structureType == STRUCTURE_CONTROLLER});
	}
	public findDroppedItems(room: Room) : Resource[] {
		return room.find<Resource>(FIND_DROPPED_ENERGY);
	}
	public findBrokenStructures(room: Room) : Structure[] {
		//TODO figure out wall
		return room.find<Structure>(FIND_STRUCTURES, { filter: (s: Structure) => !(s instanceof StructureWall) && s.hits <= (s.hitsMax / 3) });
	}
	///filter {roles}
	public findIdleCreeps(room: Room, filter?: CreepFilter) : Creep[] {
		//TODO optimize, but was having caching issue
		let creeps = room.find<Creep>(FIND_MY_CREEPS);
		return _.filter(creeps, function(c) {
			if(!!filter) {
				if(!!filter.roles && !Finder.filterIncludes(c.memory.role, filter.roles)){
					return false;
				}
			}
			return !assignmentService.creepHasAssignment(c);
		});
	}
}
export var finder = new Finder();

export class DepositFilter {
	public structureTypes: string[] | undefined;
	public excludedTargets: string[] | undefined;
	public customExp: (s: Structure) => boolean | undefined;

	constructor(structureTypes?: string[], excludedTypes?: string[]) {
		this.structureTypes = structureTypes;
		this.excludedTargets = excludedTypes;
	}
}

export class CreepFilter {
	public roles: string[] | undefined;

	constructor(roles?: string[]) {
		this.roles = roles;
	}
}
