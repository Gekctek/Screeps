import {TargetAssignment,AssignmentType,AssignmentResult,AssignmentResultType,Assignment} from "./assignment"

export class TransferAssignment extends TargetAssignment<Structure> {
	public type: AssignmentType = AssignmentType.Transfer;
	public resourceType: string;
	public resourceTarget: {id:string} | undefined;
	public gotResource: boolean;

	constructor(creep: Creep, target: Structure, resourceType: string, resourceTarget: {id:string} | undefined, gotResource: boolean) {
		super(creep, target);
		this.resourceType = resourceType;
		this.resourceTarget = resourceTarget;
		this.gotResource = gotResource;
	}

	public execute() : AssignmentResult {
		if (!this.gotResource) {
			if(!this.resourceTarget) {
				return AssignmentResult.fail("Missing resource target for transfer.")
			}
			let result: AssignmentResult = this.getResource(this.resourceTarget, this.resourceType);
			if(result.state == AssignmentResultType.Success) {
				//TODO update assignment
				this.gotResource = true;
			} else {
				return result;
			}
		}

		return this.depositResource(this.target, this.resourceType);
	}

	public serialize() {
		let resourceT;
		if(!this.resourceTarget) {
			resourceT = undefined;
		} else {
			resourceT = this.resourceTarget.id;
		}
		return {
			creepId: this.creep.id,
			targetId: this.target.id,
			type: this.getStringType(),
			resourceType: this.resourceType,
			resourceTargetId: resourceT,
			gotResource: this.gotResource
		}
	}

	public static deserialize(assignment: any) : TransferAssignment {
		let creep = Assignment.findById<Creep>(assignment.creepId);
		let target = Assignment.findById<Structure>(assignment.targetId);
		let resourceTarget;
		if(!!assignment.resourceTargetId) {
			resourceTarget = Assignment.findById<{id: string}>(assignment.resourceTargetId);
		} else {
			resourceTarget = undefined;
		}
		return new TransferAssignment(creep, target, assignment.resourceType, resourceTarget, assignment.gotResource);
	}
}
