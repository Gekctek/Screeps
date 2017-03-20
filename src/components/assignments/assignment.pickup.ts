import {TargetAssignment,AssignmentType,AssignmentResult,Assignment} from "./assignment"

export class ItemPickupAssignment extends TargetAssignment<Resource> {

	public type: AssignmentType = AssignmentType.ItemPickup;

	constructor(creep: Creep, target: Resource) {
		super(creep, target);
	}

	public execute(): AssignmentResult {
		if (!this.creep.pos.isNearTo(this.target)) {
			return this.move(this.target);
		}
		let pickupResult = this.creep.pickup(this.target);
		switch (pickupResult) {
			case OK:
			case ERR_FULL:
				return AssignmentResult.success();
			default:
				return AssignmentResult.fail("Pickup result: " + pickupResult);
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
		let target = Assignment.findById<Resource>(assignment.targetId);
		return new ItemPickupAssignment(creep, target);
	}
}
