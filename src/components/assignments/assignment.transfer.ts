import {TargetAssignment,AssignmentType,AssignmentResult, AssignmentResultType} from "./assignment"
export class TransferAssignment extends TargetAssignment<Structure> {
	public type: AssignmentType = AssignmentType.Transfer;
	public resourceType: string;
	public resourceTarget: RoomObject | undefined;
	public gotResource: boolean;

	constructor(creep: Creep, target: Structure, resourceType: string, resourceTarget: RoomObject | undefined) {
		super(creep, target);
		this.resourceType = resourceType;
		this.resourceTarget = resourceTarget;
		this.gotResource = !resourceTarget;
	}

	public execute() : AssignmentResult {
		let needsResource = !!this.resourceTarget && !this.gotResource;
		if (needsResource) {
			let result: AssignmentResult = this.getResource(this.target, this.resourceType);
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
		return {
			creepId: this.creep.id,
			target: this.target,
			type: this.type,
			resourceType: this.resourceType,
			resourceTarget: this.resourceTarget,
			gotResource: this.gotResource
		}
	}
}
