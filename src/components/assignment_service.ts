import {log} from "./support/log";
import {AssignmentType,Assignment} from "./assignments/assignment"
import {BuildAssignment} from "./assignments/assignment.build"
import {HarvestAssignment} from "./assignments/assignment.harvest"
import {TransferAssignment} from "./assignments/assignment.transfer"
import {MoveAssignment} from "./assignments/assignment.move"
import {RepairAssignment} from "./assignments/assignment.repair"
import {DepositAssignment} from "./assignments/assignment.deposit"
import {ItemPickupAssignment} from "./assignments/assignment.pickup"
import {GetResourceAssignment} from "./assignments/assignment.resource"
import {UpgradeAssignment} from "./assignments/assignment.upgrade"


class AssignmentService {
	public addAssignment(assignment: Assignment){
		let id: string = assignment.creep.name;
		if(!!Memory.assignments[id]) {
			log.warning("Assignment '"+assignment.creep+"' already exists, overriding. BEFORE: " + Memory.assignments[id].type + " - AFTER: " + assignment.type)
		}
		// TODO serialize?
		Memory.assignments[assignment.creep.name] = assignment.serialize();
	}

	public getAll() : Assignment[] {
		let assignments:Assignment[] = [];
		for(var i in Memory.assignments) {
			try {
				let a = Memory.assignments[i];
				let assignment: Assignment;
				//hack to convert string to enum
				let type: number = (<any>AssignmentType)[a.type];
				switch(type) {
					case AssignmentType.Build:
					{
						assignment = BuildAssignment.deserialize(a);
						break;
					}
					case AssignmentType.Harvest:
					{
						assignment = HarvestAssignment.deserialize(a);
						break;
					}
					case AssignmentType.Transfer:
					{
						assignment = TransferAssignment.deserialize(a);
						break;
					}
					case AssignmentType.Move:
					{
						assignment = MoveAssignment.deserialize(a);
						break;
					}
					case AssignmentType.Repair:
					{
						assignment = RepairAssignment.deserialize(a);
						break;
					}
					case AssignmentType.Deposit:
					{
						assignment = DepositAssignment.deserialize(a);
						break;
					}
					case AssignmentType.ItemPickup:
					{
						assignment = ItemPickupAssignment.deserialize(a);
						break;
					}
					case AssignmentType.GetResource:
					{
						assignment = GetResourceAssignment.deserialize(a);
						break;
					}
					case AssignmentType.Upgrade:
					{
						assignment = UpgradeAssignment.deserialize(a);
						break;
					}
					default:
						log.warning("Non implemented assignment: " + a.type + " - " + JSON.stringify(a));
						continue;
				}
				assignments.push(assignment);
			} catch (error) {
				log.error("Could not parse assignment: " + error);
				delete Memory.assignments[i];
			}
		}
		return assignments;
	}

	public isTargetAssigned(target: {id: string}, type?: AssignmentType) : boolean {
		let assignmentCount: number = 0;
		for(var id in Memory.assignments) {
			let assignment: any = Memory.assignments[id];
			if(!assignment.target || !assignment.target.id) {
				continue;
			}
			if(assignment.target.id == target.id){
				if(!type) {
					return true;
				}
				if((<any>AssignmentType)[assignment.type] == type) {
					assignmentCount++;
				}
			}
		}
		//console.log(assignmentCount + " " + type);
		if(!!type && assignmentCount > 1) {
			//check to see if the target allows more than one target
			if(!!Memory.targets
			&& !!Memory.targets[target.id]
			&& Memory.targets[target.id].maxAllowed[type] > assignmentCount) {
				return false;
			}
			return true;
		}
		return false;
	}
	public creepHasAssignment(creep: Creep) : boolean {
		return Memory.assignments[creep.name];
	}

	public delete(id: string) : void {
		delete Memory.assignments[id];
	}
}

export var assignmentService = new AssignmentService();
