import * as Config from "./config/config";

import { log } from "./components/support/log";

import { assigner } from "./components/assigner";

import {spawner} from "./components/spawner";

import {assignmentService} from "./components/assignment_service"

import {Assignment,AssignmentResult,AssignmentResultType} from "./components/assignments/assignment"

// Any code written outside the `loop()` method is executed only when the
// Screeps system reloads your script.
// Use this bootstrap wisely. You can cache some of your stuff to save CPU.
// You should extend prototypes before the game loop executes here.

// This is an example for using a config variable from `config.ts`.
if (Config.USE_PATHFINDER) {
	PathFinder.use(true);
}

log.info("load");

/**
 * Screeps system expects this "loop" method in main.js to run the
 * application. If we have this line, we can be sure that the globals are
 * bootstrapped properly and the game loop is executed.
 * http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
 *
 * @export
 */
export function loop() {

	if (!Memory.assignments) {
		Memory.assignments = {};
	}
	for (var i in Game.rooms) {
		let room: Room = Game.rooms[i];
		//check for enemies/assign them
		var hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
		if (hostileCreeps.length > 0) {
			log.warning("ENEMIES!!!!!");
		}



		try {
			//unassign idle creeps, update assignment every .run(), if no run, kill

			assigner.assignFillSpawn(room);

			assigner.assignBrokenStructures(room);

			//TODO weird issue with getting game object by id
			//assigner.assignDroppedItems(room);


			assigner.assignByRole(room);
			assigner.assignIdle(room);

		} catch (error) {
			log.error("Error when assigning: " + error + " " + error.stack)
		}






		try {
			//balance rooms?
			spawner.run(room);

		} catch (error) {
			log.error("Error when spawning: " + error + " " + error.stack)
		}
	}
		try {
			executeAssignments();
		} catch (error) {
			log.error("Error when executing assignments: " + error + " " + error.stack)
		}


	spawner.cleanupDead();
}


var executeAssignments = function() : void {
	let assignments: Assignment[] = assignmentService.getAll();
	for (let id in assignments) {
		let assignment: Assignment = assignments[id];
		let assignmentResult: AssignmentResult;
		try {
			assignmentResult = assignment.execute();
		} catch (error) {
			log.error(error);
			return;
		}
		let deleteAssignment: boolean;
		switch(assignmentResult.state) {
			case AssignmentResultType.Success:
				deleteAssignment = true;
				break;
			case AssignmentResultType.Fail:
				deleteAssignment = true;
				log.error("Assignment failed: " + assignmentResult.message + " - " + assignment.creep.name);
				break;
			case AssignmentResultType.InProgress:
				deleteAssignment = false;
				break;
			case AssignmentResultType.Detour:
				//TODO
				deleteAssignment = true;
				break;
			default:
				deleteAssignment = true;
				log.error("Non implemented assignment state.");
				break;
		}
		if (!deleteAssignment) {
			//TODO set idle stuff
		} else {
			//TODO reset idle stuff
			assignmentService.delete(assignment.creep.name);
		}
	}
}
