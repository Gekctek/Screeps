import {TargetAssignment,AssignmentType,AssignmentResult,Assignment} from "./assignment"

export class DepositAssignment extends TargetAssignment<Structure | Creep> {
	public type: AssignmentType = AssignmentType.Deposit;
	public resourceType: string;

	constructor(creep: Creep, target: Structure | Creep, resourceType: string) {
		super(creep, target);
		this.resourceType = resourceType;
	}

	public execute() : AssignmentResult {
		return this.depositResource(this.target, this.resourceType);
	}


	public serialize() {
		return {
			creepId: this.creep.id,
			targetId: this.target.id,
			type: this.getStringType(),
			resourceType: this.resourceType
		}
	}

	public static deserialize(assignment: any) : DepositAssignment {
		let creep = Assignment.findById<Creep>(assignment.creepId);
		let target = Assignment.findById<Structure | Creep>(assignment.targetId);
		return new DepositAssignment(creep, target, assignment.resourceType);
	}
}
