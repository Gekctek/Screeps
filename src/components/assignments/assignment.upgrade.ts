class UpgradeAssignment extends TargetAssignment<Controller> {
	public type: AssignmentType = AssignmentType.Upgrade;

	constructor(creep: Creep, target: Controller) {
		super(creep, target);
	}

	public execute() : AssignmentResult {
		if (!this.creep.carry.energy || this.creep.carry.energy <= 0) {
			return AssignmentResult.detour(AssignmentDetourType.GetMoreResources);
		}
		var upgradeResult = this.creep.upgradeController(<Controller>this.target);
		switch (upgradeResult) {
			case OK:
				return AssignmentResult.success();
			case ERR_NOT_IN_RANGE:
				return this.move(this.target);
			default:
				return AssignmentResult.fail("Bad upgrade: " + upgradeResult);
		}
	}
}
