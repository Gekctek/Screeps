import {notifier} from "./support/notifier";

export var assignmentService = new AssignmentService();

class AssignmentService {
	public addAssignment(assignment: Assignment){
		let id: string = assignment.creep.name;
		if(!!Memory.assignments[id]) {
			notifier.notify("Assignment '"+assignment.creep+"' already exists, overriding. BEFORE: " + Memory.assignments[id].type + " - AFTER: " + assignment.type)
		}
		// TODO serialize?
		Memory.assignments[assignment.creep.name] = assignment;
	}

	public getAll() : Assignment[] {
		return Memory.assignments;
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
				if(assignment.type == type) {
					assignmentCount++;
				}
			}
		}
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
