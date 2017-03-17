var notifier = require('notifier');

function moveToTarget(creep: Creep, target: RoomObject) {
	var moveResult = creep.moveTo(target, {
		reusePath: 5,
		visualizePathStyle: {
			fill: 'transparent',
			stroke: '#fff',
			lineStyle: 'dashed',
			strokeWidth: .15,
			opacity: .1
		}
	});
	switch (moveResult) {
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

function getEnergy(assignment: Assignment, creep: Creep, target: Resource) {
	let getResult: number;
	if (target instanceof Structure) {
		getResult = creep.withdraw(target, RESOURCE_ENERGY);
		switch (getResult) {
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
		if (target instanceof Source || target instanceof Mineral) {
			getResult = creep.harvest(target);
			switch (getResult) {
				case OK:
					return 1;
				case ERR_NOT_IN_RANGE:
					//keep moving
					break;
				case ERR_NOT_ENOUGH_ENERGY:
					return -1;
				default:
					notifier.badAction("Get energy result (withdraw): " + getResult, creep, target, assignment);
					return -1;
			}
		} else {
			getResult = creep.pickup(target);
			switch (getResult) {
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
	let stillMoving = moveToTarget(creep, target);
	if (!stillMoving) {
		return -1;
	}
	return 0;
};

function depositEnergy(assignment: Assignment, creep: Creep, target: Structure) {
	if (creep.pos.isNearTo(target)) {
		var transferResult = creep.transfer(target, RESOURCE_ENERGY);
		switch (transferResult) {
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
	if (!stillMoving) {
		return -1;
	}
	return 0;
}


export function run(assignment: Assignment) {
	let creep = Game.getObjectById<Creep>(assignment.creepId);
	if (!creep) {
		notifier.notify("Creep was not found while running assignment: " + JSON.stringify(assignment));
		return false;
	}

	if (assignment.type == 'IDLE') {
		if (!creep.pos.isNearTo(assignment.idlePos)) {
			return moveToTarget(creep, assignment.idlePos);
		}
		return false;
	}

	let target = Game.getObjectById<RoomObject>(assignment.targetId);
	if (!target) {
		notifier.notify("Target was not found while running assignment: " + JSON.stringify(assignment));
		return false;
	}

	switch (assignment.type) {
		case AssignmentType.ItemPickup:
			if(!(target instanceof Resource)) {
				notifier.notify("A pickup assignment has a non resource target: " + JSON.stringify(target));
				return false;
			}
			if (creep.pos.isNearTo(target.pos)) {
				let pickupResult = creep.pickup(target);
				switch (pickupResult) {
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
			if(!(target instanceof Mineral && target instanceof Source)) {
				notifier.notify("A harvest assignment has a non source/mineral target: " + JSON.stringify(target));
				return false;
			}
			var harvestResult = creep.harvest(target);
			switch (harvestResult) {
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
			if(!(target instanceof Resource)) {
				notifier.notify("A get energy assignment has a non resource target: " + JSON.stringify(target));
				return false;
			}
			let energyResult = getEnergy(assignment, creep, target)
			return energyResult == 0;
		case 'BUILD':
			if(!(target instanceof ConstructionSite)) {
				notifier.notify("A build assignment has a non construction site target: " + JSON.stringify(target));
				return false;
			}
			var repairResult = creep.build(target);
			switch (repairResult) {
				case OK:
					return true;
				case ERR_NOT_IN_RANGE:
					//keep moving
					break;
				case ERR_NOT_ENOUGH_RESOURCES:
					return false;
				default:
					notifier.badAction("Bad build: " + repairResult, creep, target, assignment);
					return false;
			}
			return moveToTarget(creep, target);
		case 'DEPOSIT':
			if(!(target instanceof Structure)) {
				notifier.notify("A deposit assignment has a non structure target: " + JSON.stringify(target));
				return false;
			}
			let result : number;
			switch (assignment.resourceType) {
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
			if(!(target instanceof Structure)) {
				notifier.notify("A repair assignment has a non structure target: " + JSON.stringify(target));
				return false;
			}
			var repairResult = creep.repair(target);
			switch (repairResult) {
				case OK:
					return target.hits < target.hitsMax;
				case ERR_NOT_IN_RANGE:
					//keep moving
					break;
				case ERR_NOT_ENOUGH_RESOURCES:
					return false;
				default:
					notifier.badAction("Bad repair: " + repairResult, creep, target, assignment);
					return false;
			}
			return moveToTarget(creep, target);
		case 'UPGRADE':
			if(!(target instanceof StructureController)) {
				notifier.notify("A upgrade assignment has a non controller target: " + JSON.stringify(target));
				return false;
			}
			if (!creep.carry || !creep.carry.energy || creep.carry.energy <= 0) {
				return false;
			}
			var upgradeResult = creep.upgradeController(target);
			switch (upgradeResult) {
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
			if(!(target instanceof Structure)) {
				notifier.notify("A transfer assignment has a non structure target: " + JSON.stringify(target));
				return false;
			}
			if (!!assignment.resourceTargetId && !assignment.gotSource) {
				var targetSource = Game.getObjectById(assignment.resourceTargetId);
				if (!targetSource) {
					notifier.notify("Transfer source target no longer exists: " + assignment.resourceTargetId);
					return false;
				}
				if(!(targetSource instanceof Resource)) {
					notifier.notify("A transfer assignment has a non resource target source: " + JSON.stringify(targetSource));
					return false;
				}
				let result = getEnergy(assignment, creep, targetSource);
				switch (result) {
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

			let depositResult = depositEnergy(assignment, creep, target);
			if (depositResult == -1) {
				notifier.badAction("Transfer (filling target) had a problem.", creep, target, assignment);
			}
			return depositResult == 0;
		default:
			notifier.notify("Not implemented assignment type: " + assignment.type);
			return false;
	}
}
