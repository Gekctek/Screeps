import {TargetAssignment,AssignmentType,AssignmentDetourType,AssignmentResult,Assignment} from "./assignment"


export class BuildAssignment extends TargetAssignment<ConstructionSite> {
	public type: AssignmentType = AssignmentType.Build;

	constructor(creep: Creep, target: ConstructionSite) {
		super(creep, target);
	}

	public execute() : AssignmentResult {
			let buildResult = this.creep.build(this.target);
			switch (buildResult) {
				case OK:
					return AssignmentResult.inProgress();
				case ERR_NOT_IN_RANGE:
					return this.move(this.target);
				case ERR_NOT_ENOUGH_RESOURCES:
					return AssignmentResult.detour(AssignmentDetourType.GetMoreResources);
				default:
					return AssignmentResult.fail("Bad build: " + buildResult);
			}
	}

	public serialize() {
		return {
			creepId: this.creep.id,
			targetId: this.target.id,
			type: this.getStringType()
		}
	}

	public static deserialize(assignment: any) : BuildAssignment {
		let creep = Assignment.findById<Creep>(assignment.creepId);
		let target = Assignment.findById<ConstructionSite>(assignment.targetId);
		return new BuildAssignment(creep, target);
	}
}
