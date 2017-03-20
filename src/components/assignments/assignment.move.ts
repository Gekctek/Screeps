import {Assignment,AssignmentType,AssignmentResult} from "./assignment"

export class MoveAssignment extends Assignment {
	public type: AssignmentType = AssignmentType.Move;
	public targetPos: RoomPosition;
	public target?: {id: string};

	constructor(creep: Creep, targetPos: RoomPosition, target?: {id: string}) {
		super(creep);
		this.targetPos = targetPos;
		this.target = target;
	}

	public execute() : AssignmentResult {
		return this.move(this.targetPos);
	}


	public serialize() {
		let targetId: string | undefined;
		if(!this.target) {
			targetId = undefined;
		} else {
			targetId = this.target.id;
		}
		return {
			creepId: this.creep.id,
			targetPos: this.targetPos,
			targetId: targetId,
			type: this.getStringType()
		};
	}

	public static deserialize(assignment: any) {
		let creep = Assignment.findById<Creep>(assignment.creepId);
		let target;
		if(!!assignment.targetId) {
			target = Assignment.findById<{id: string}>(assignment.targetId)
		} else {
			target = undefined;
		}
		return new MoveAssignment(creep, assignment.targetPos, target);
	}
}
