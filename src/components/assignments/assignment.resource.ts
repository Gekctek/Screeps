import {TargetAssignment,AssignmentType,AssignmentResult,Assignment} from "./assignment"

export class GetResourceAssignment extends TargetAssignment<{id:string}> {
	public type: AssignmentType = AssignmentType.GetResource;
	public resourceType: string;

	constructor(creep: Creep, target: {id:string}, resourceType: string) {
		super(creep, target);
		this.resourceType = resourceType;
	}

	public execute() : AssignmentResult {
		return this.getResource(this.target, this.resourceType);
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
		let target = Assignment.findById<{id: string}>(assignment.targetId);
		return new GetResourceAssignment(creep, target, assignment.resourceType);
	}
}
