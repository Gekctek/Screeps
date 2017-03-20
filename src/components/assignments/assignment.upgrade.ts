import {TargetAssignment,AssignmentType,AssignmentResult,AssignmentDetourType,Assignment} from "./assignment"

export class UpgradeAssignment extends TargetAssignment<Controller> {
	public type: AssignmentType = AssignmentType.Upgrade;

	constructor(creep: Creep, target: Controller) {
		super(creep, target);
	}

	public execute() : AssignmentResult {
		if (!this.creep.carry.energy || this.creep.carry.energy <= 0) {
			return AssignmentResult.detour(AssignmentDetourType.GetMoreResources);
		}
		var upgradeResult = this.creep.upgradeController(<Controller>this.target);
		switch (upgradeResult) {
			case OK:
				return AssignmentResult.success();
			case ERR_NOT_IN_RANGE:
				return this.move(this.target);
			default:
				return AssignmentResult.fail("Bad upgrade: " + upgradeResult);
		}
	}

	public serialize() {
		return {
			creepId: this.creep.id,
			targetId: this.target.id,
			type: this.getStringType()
		}
	}

	public static deserialize(assignment: any) {
		let creep = Assignment.findById<Creep>(assignment.creepId);
		let target = Assignment.findById<Controller>(assignment.targetId);
		return new UpgradeAssignment(creep, target);
	}
}
