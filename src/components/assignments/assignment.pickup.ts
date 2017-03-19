import {TargetAssignment,AssignmentType,AssignmentResult} from "./assignment"
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
			target: this.target,
			type: this.type
		}
	}
}
