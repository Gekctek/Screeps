import { log } from "./log";

export class Notifier {
	public notify(message: string) {
		log.warning(message);
	}

	public badAction(message: string, creep: Creep, target: RoomObject, assignment: Assignment) {
		message = message + '\n' +
			"Creep: " + JSON.stringify(creep) + '\n' +
			"Target: " + JSON.stringify(target) + '\n' +
			"Assignment: " + JSON.stringify(assignment);
		log.warning(message)
	}
}

export var notifier = new Notifier();
