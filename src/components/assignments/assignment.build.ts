import {TargetAssignment,AssignmentType,AssignmentDetourType, AssignmentResult} from "./assignment"
export class BuildAssignment extends TargetAssignment<ConstructionSite> {
	public type: AssignmentType = AssignmentType.Build;

	constructor(creep: Creep, target: ConstructionSite) {
		super(creep, target);
	}

	public execute() : AssignmentResult {

			var repairResult = this.creep.build(this.target);
			switch (repairResult) {
				case OK:
					return AssignmentResult.success();
				case ERR_NOT_IN_RANGE:
					return this.move(this.target);
				case ERR_NOT_ENOUGH_RESOURCES:
					return AssignmentResult.detour(AssignmentDetourType.GetMoreResources);
				default:
					return AssignmentResult.fail("Bad build: " + repairResult);
			}
	}

	public serialize() {
		return {
			creepId: this.creep.id,
			target: this.target,
			type: this.type
		}
	}
}
