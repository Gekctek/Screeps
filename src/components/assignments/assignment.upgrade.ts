class UpgradeAssignment extends Assignment {
	public type: AssignmentType = AssignmentType.Upgrade;

	constructor(creep: Creep, target: Controller) {
		super(creep, target);
	}

	public execute() : AssignmentResult {
		if (!this.creep.carry.energy || this.creep.carry.energy <= 0) {
			return AssignmentResult.;
		}
		var upgradeResult = this.creep.upgradeController(<Controller>this.target);
		switch (upgradeResult) {
			case OK:
				return true;
			case ERR_NOT_IN_RANGE:
				//Keep moving
				break;
			default:
				notifier.badAction("Bad upgrade: " + upgradeResult, creep, target, assignment);
				return false;
		}

		return moveToTarget(creep, target);
	}
}
