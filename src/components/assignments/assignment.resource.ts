class GetResourceAssignment extends TargetAssignment<RoomObject> {
	public type: AssignmentType = AssignmentType.GetResource;
	public resourceType: string;

	constructor(creep: Creep, target: RoomObject, resourceType: string) {
		super(creep, target);
		this.resourceType = resourceType;
	}

	public execute() : AssignmentResult {
		return this.getResource(this.target, this.resourceType);
	}
}
