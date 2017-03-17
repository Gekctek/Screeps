declare class Assignment {
	public type : AssignmentType;
	public creepId : string;
	public targetId : string;
}

declare enum AssignmentType {
	Harvest,
	ItemPickup
}

declare class IdleAssignment extends Assignment {
	public idlePos : RoomPosition;
}
