class MoveAssignment extends TargetAssignment<RoomPosition | RoomObject> {
	public type: AssignmentType = AssignmentType.Move;

	constructor(creep: Creep, target: RoomPosition | RoomObject) {
		super(creep, target);
	}

	public execute() : AssignmentResult {
		return this.move(this.target);
	}
}
