import { log } from "./support/log";


class Spawner {

	private roles = [
		{ name: 'HARVESTER', max: 2, body: [MOVE, CARRY, WORK, WORK, WORK, WORK, WORK] },
		{ name: 'BUILDER', max: 5, body: [WORK, WORK, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY] },
		{ name: 'UPGRADER', max: 1, body: [WORK, CARRY, CARRY, MOVE, CARRY, CARRY, CARRY, CARRY, WORK] },
		{ name: 'RUNNER', max: 3, body: [CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE] }
	];

	private spawnCreep(spawn: Spawn) {
		var creepsRoleMap = _.groupBy(spawn.room.find(FIND_MY_CREEPS), 'memory.role');

		var min;
		var roleToSpawn;
		let override = false;
		for (var i in this.roles) {
			var role = this.roles[i];
			var creepsInRole = creepsRoleMap[role.name];
			if (!creepsInRole) {
				roleToSpawn = role;
				override = true; //Need to spawn at least one
				break;
			}
			if ((!min || creepsInRole.length < min) && creepsInRole.length < role.max) {
				min = creepsInRole.length;
				roleToSpawn = role;
			}
		}
		if (!roleToSpawn) {
			return false;
		}
		if (override || spawn.room.energyCapacityAvailable <= spawn.room.energyAvailable) {
			var bodySize = roleToSpawn.body.length;
			while (bodySize > 3) {
				var body = roleToSpawn.body.slice(0, bodySize);
				var newName = spawn.createCreep(body, undefined, { role: roleToSpawn.name });
				if (_.isString(newName)) {
					console.log('Spawning new ' + roleToSpawn.name + ': ' + newName);
					return true;
				} else if (newName == ERR_NOT_ENOUGH_ENERGY) {
					bodySize--;
					continue;
				}
				log.error("Spawn '" + spawn.name + "' had error when spawning: " + newName)
				return false;
			}
			return false;
		}

	}

	public cleanupDead() {
		for (let name in Memory.creeps) {
			if (!Game.creeps[name]) {
				delete Memory.creeps[name];
			}
		}
	}
	public run(room: Room) {
		let spawns = room.find<Spawn>(FIND_MY_SPAWNS);
		for (let i in spawns) {
			let spawn = spawns[i];

			if (!spawn.spawning) {
				this.spawnCreep(spawn);
			} else {
				let spawningCreep = Game.creeps[spawn.spawning.name];
				room.visual.text(
					'🛠️' + spawningCreep.memory.role,
					spawn.pos.x + 1,
					spawn.pos.y,
					{ align: 'left', opacity: 0.8 });
			}
		}
	}
}

export var spawner = new Spawner();
