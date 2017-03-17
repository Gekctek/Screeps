import * as Config from "./config/config";

import { log } from "./components/support/log";

import { assigner } from "./components/assignments/assigner";

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
			notifier.notify("ENEMIES!!!!!");
		}



		try {
			//unassign idle creeps, update assignment every .run(), if no run, kill
			assigner.assignFillSpawn(room);

			assigner.assignBrokenStructures(room);

			//TODO
			assigner.assignDroppedItems(room);


			assigner.assignByRole(room);
			assigner.assignIdle(room);

		} catch (error) {
			notifier.notify("Error when assigning: " + error + " " + error.stack)
		}




		try {
			executeAssignments(room);
		} catch (error) {
			notifier.notify("Error when executing assignments: " + error + " " + error.stack)
		}



		try {
			//balance rooms?
			spawner.run(room);

			spawner.cleanupDead(room);
		} catch (error) {
			notifier.notify("Error when spawning: " + error + " " + error.stack)
		}
	}

	// Clears any non-existing creep memory.
	for (let name in Memory.creeps) {
		let creep: any = Memory.creeps[name];

		if (creep.room === room.name) {
			if (!Game.creeps[name]) {
				log.info("Clearing non-existing creep memory:", name);
				delete Memory.creeps[name];
			}
		}
	}
}
}


var executeAssignments = function (room: Room) {
	var assignments = assignmentService.getAll();
	for (var id in assignments) {
		var assignment = assignments[id];
		var stillRunning;
		try {
			stillRunning = assignmentRunner.run(assignment);
		} catch (error) {
			notifier.notify(error);
		}
		if (!stillRunning) {
			if (!!Memory.creeps[assignment.id] && !Memory.creeps[assignment.id].idle) {
				Memory.creeps[assignment.id].idle = Game.time;
			}
			assignmentService.delete(assignment.id);
		} else {
			Memory.creeps[assignment.id].idle = null;
		}
	}
}
