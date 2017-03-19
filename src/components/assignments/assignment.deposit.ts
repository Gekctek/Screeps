class DepositAssignment extends TargetAssignment<Structure | Creep> {
	public type: AssignmentType = AssignmentType.Deposit;
	public resourceType: string;

	constructor(creep: Creep, target: Structure | Creep, resourceType: string) {
		super(creep, target);
		this.resourceType = resourceType;
	}

	public execute() : AssignmentResult {
		return this.depositResource(this.target, this.resourceType);
	}

}
