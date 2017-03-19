class RepairAssignment extends TargetAssignment<Structure> {
	public type: AssignmentType = AssignmentType.Repair;

	constructor(creep: Creep, target: Structure) {
		super(creep, target);
	}

	public execute() : AssignmentResult {
		var repairResult = this.creep.repair(this.target);
		switch (repairResult) {
			case OK:
				let isDamaged = this.target.hits < this.target.hitsMax;
				if(isDamaged) {
					return AssignmentResult.inProgress();
				} else {
					return AssignmentResult.success();
				}
			case ERR_NOT_IN_RANGE:
				return this.move(this.target);
			case ERR_NOT_ENOUGH_RESOURCES:
				return AssignmentResult.detour(AssignmentDetourType.GetMoreResources);
			default:
				return AssignmentResult.fail("Bad repair: " + repairResult);
		}
	}
}
