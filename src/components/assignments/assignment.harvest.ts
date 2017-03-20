import {TargetAssignment,AssignmentType,AssignmentResult,Assignment} from "./assignment"

export class HarvestAssignment extends TargetAssignment<Source | Mineral> {
	public type: AssignmentType = AssignmentType.Harvest;
	public isMineral: boolean;

	constructor(creep: Creep, target: Source | Mineral) {
		super(creep, target);
		this.isMineral = target instanceof Mineral;
	}

	public execute(): AssignmentResult {
		let harvestResult = this.creep.harvest(this.target);
		switch (harvestResult) {
			case OK:
				let hasRoom = _.sum(this.creep.carry) < this.creep.carryCapacity;
				if(hasRoom) {
					return AssignmentResult.inProgress();
				} else {
					return AssignmentResult.success();
				}
			case ERR_NOT_IN_RANGE:
				return this.move(this.target);
			default:
				return AssignmentResult.fail("Bad harvest: " + harvestResult);
		}
	}

	public serialize() {
		return {
			creepId: this.creep.id,
			targetId: this.target.id,
			type: this.getStringType(),
			isMineral: this.isMineral
		}
	}

	public static deserialize(assignment: any) {
		let creep = Assignment.findById<Creep>(assignment.creepId);
		let target = Assignment.findById<Source | Mineral>(assignment.targetId);
		return new HarvestAssignment(creep, target);
	}
}
