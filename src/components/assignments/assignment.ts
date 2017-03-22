export abstract class Assignment {
	public readonly abstract type: AssignmentType;
	public creep: Creep;

	constructor(creep: Creep) {
		this.creep = creep;
	}

	public abstract execute(): AssignmentResult;

	public abstract serialize() : {creepId:string, type: string};

	protected move(target: RoomPosition | {pos: RoomPosition}): AssignmentResult {
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

	protected getResource(target: {id:string} | RoomPosition, resourceType: string): AssignmentResult {
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
				case ERR_INVALID_ARGS:
					return AssignmentResult.fail("Creep is withdrawing an invalid type or amount of resource. Type: " + resourceType);
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
					return AssignmentResult.detour(AssignmentDetourType.GetMoreResources);
				default:
					return AssignmentResult.fail("Get energy result (harvest): " + getResult);
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
			return AssignmentResult.fail("Non implemented get resource action for target: " + JSON.stringify(target))
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

	public getStringType() : string {
		return (<any>AssignmentType)[this.type];
	}


	protected static findById<T>(id: string) : T {
		var item = Game.getObjectById<T>(id);
		if(item === null) {
			throw new Error("Cound not find the item with id: " + JSON.stringify(id));
		}
		return item;
	}
}

export abstract class TargetAssignment<T extends {id: string}> extends Assignment {
	public abstract type: AssignmentType;
	public target: T;
	constructor(creep: Creep, target: T) {
		super(creep);
		this.target = target;
	}
	public abstract execute() : AssignmentResult;

	public abstract serialize() : {creepId:string, targetId: string, type: string};
}

export class AssignmentResult {
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

export enum AssignmentResultType {
	InProgress,
	Success,
	Fail,
	Detour
}

export enum AssignmentDetourType {
	FindOtherPath,
	GetMoreResources,
	FindOtherDeposit
}

export enum AssignmentType {
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

