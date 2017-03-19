abstract class Assignment {
	public readonly abstract type: AssignmentType;
	public creep: Creep;

	constructor(creep: Creep) {
		this.creep = creep;
	}

	public abstract execute(): AssignmentResult;

	protected move(target: RoomPosition | RoomObject): AssignmentResult {
		var moveResult = this.creep.moveTo(target, {
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
				return AssignmentResult.inProgress();
			case ERR_NO_PATH:
				return AssignmentResult.detour(AssignmentDetourType.FindOtherPath);
			default:
				return AssignmentResult.fail("Creep had problem moving: " + moveResult);
		}
	}

	protected getResource(target: RoomObject | RoomPosition, resourceType: string): AssignmentResult {
		if (target instanceof Structure) {
			let getResult = this.creep.withdraw(target, resourceType);
			switch (getResult) {
				case OK:
					return AssignmentResult.success();
				case ERR_NOT_IN_RANGE:
					return this.move(target);
				case ERR_NOT_ENOUGH_RESOURCES:
					return AssignmentResult.fail("Creep is trying to get energy from something when it has none.");
				case ERR_FULL:
					return AssignmentResult.fail("Creep is trying to get energy from something when the creep is full.");
				default:
					return AssignmentResult.fail("Get energy result (withdraw): " + getResult);
			}
		} else if (target instanceof Source || target instanceof Mineral) {
			let getResult = this.creep.harvest(target);
			switch (getResult) {
				case OK:
					return AssignmentResult.success();
				case ERR_NOT_IN_RANGE:
					return this.move(target);
				case ERR_NOT_ENOUGH_ENERGY:
					//TODO how will it know what to do after it gets more
					return AssignmentResult.detour(AssignmentDetourType.GetMoreResource);
				default:
					return AssignmentResult.fail("Get energy result (withdraw): " + getResult);
			}
		} else if (target instanceof Resource) {
			let getResult = this.creep.pickup(target);
			switch (getResult) {
				case OK:
				case ERR_FULL:
					return AssignmentResult.success();
				case ERR_NOT_IN_RANGE:
					return this.move(target);
				default:
					return AssignmentResult.fail("Get energy result (pickup): " + getResult);
			}
		} else {
			return AssignmentResult.fail("Non implemented get resource action for target.")
		}

	}

	protected depositResource(target: Creep | Structure, resourceType: string) : AssignmentResult {
		if (!this.creep.pos.isNearTo(target)) {
			return this.move(target);
		}
		var transferResult = this.creep.transfer(target, resourceType);
		switch (transferResult) {
			case OK:
				return AssignmentResult.success();
			case ERR_FULL:
				return AssignmentResult.detour(AssignmentDetourType.FindOtherDeposit);
			case ERR_NOT_ENOUGH_RESOURCES:
				return AssignmentResult.fail("Creep is trying to transfer energy when it has none.");
			default:
				return AssignmentResult.fail("Deposit result: " + transferResult);
		}
	}
}

abstract class TargetAssignment<T extends {pos: RoomPosition } | RoomPosition> extends Assignment {
	public abstract type: AssignmentType;
	public target: T;
	constructor(creep: Creep, target: T) {
		super(creep);
		this.target = target;
	}
	public abstract execute() : AssignmentResult;
}

class AssignmentResult {
	public state: AssignmentResultType;
	public message: string | undefined;
	public detour: AssignmentDetourType | undefined;

	private constructor(state: AssignmentResultType, message: string | undefined,
		detour: AssignmentDetourType | undefined) {
		this.state = state;
		this.message = message;
		this.detour = detour;
	}

	public static fail(message: string) {
		return new AssignmentResult(AssignmentResultType.Fail, message, undefined);
	}

	public static success() {
		return new AssignmentResult(AssignmentResultType.Success, undefined, undefined);
	}

	public static inProgress() {
		return new AssignmentResult(AssignmentResultType.InProgress, undefined, undefined);
	}

	public static detour(detour: AssignmentDetourType) {
		return new AssignmentResult(AssignmentResultType.Detour, undefined, detour)
	}
}

declare enum AssignmentResultType {
	InProgress,
	Success,
	Fail,
	Detour
}

declare enum AssignmentDetourType {
	FindOtherPath,
	GetMoreResource,
	FindOtherDeposit
}

declare enum AssignmentType {
	Harvest,
	ItemPickup,
	GetResource,
	Build,
	Deposit,
	Repair,
	Upgrade,
	Transfer,
	Move
}
