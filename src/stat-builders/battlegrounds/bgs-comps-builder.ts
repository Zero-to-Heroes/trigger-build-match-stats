import { Replay } from '@firestone-hs/hs-replay-xml-parser';
import { CardType, GameTag, Step, Zone } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { Map } from 'immutable';
import { getConnection } from '../../db/rds-stat';
import { ReviewMessage } from '../../review-message';
import { StatBuilder } from '../_stat-builder';

export class BgsCompsBuilder implements StatBuilder {
	public async extractAndSaveStat(message: ReviewMessage, replay: Replay, replayXml: string): Promise<void> {
		// Build a turn-by-turn recap of the composition for the main player
		// For now we don't aggregate that data by tribe - it will be done by the app itself
		// so that we have more flexibility with what to do with the data in the future
		console.log('building comps by turn');
		const compsByTurn: Map<number, readonly any[]> = await this.buildCompsByTurn(replay, replayXml);
		console.log('built comps by turn', compsByTurn.toJS());
		const statsByTurn = compsByTurn.map((value, key) =>
			value.reduce((acc, obj) => acc + obj.attack || 0 + obj.health || 0, 0),
		);
		console.log('statsByTurn', statsByTurn.toJS());
		const mysql = await getConnection();
		const query = `
			INSERT INTO bgs_comps
			(
				reviewId,
				compsByTurn
			)
			VALUES 
			(
				'${message.reviewId}',
				'${JSON.stringify(compsByTurn.toJS())}'
			)
		`;
		console.log('will execute query', query);
		await mysql.query(query);
	}

	public async buildCompsByTurn(replay: Replay, replayXml: string): Promise<Map<number, readonly string[]>> {
		const elementTree = replay.replay;
		const opponentPlayerElement = elementTree
			.findall('.//Player')
			.find(player => player.get('isMainPlayer') === 'false');
		const opponentPlayerEntityId = opponentPlayerElement.get('id');
		console.log('mainPlayerEntityId', opponentPlayerEntityId);
		const structure = {
			entities: {},
			boardByTurn: Map.of(),
			currentTurn: 0,
		};
		this.parseElement(elementTree.getroot(), replay.mainPlayerId, opponentPlayerEntityId, null, structure);
		return structure.boardByTurn;
	}

	private parseElement(
		element: Element,
		mainPlayerId: number,
		opponentPlayerEntityId: string,
		parent: Element,
		structure,
	) {
		if (element.tag === 'FullEntity') {
			structure.entities[element.get('id')] = {
				cardId: element.get('cardID'),
				controller: parseInt(element.find(`.Tag[@tag='${GameTag.CONTROLLER}']`)?.get('value') || '-1'),
				zone: parseInt(element.find(`.Tag[@tag='${GameTag.ZONE}']`)?.get('value') || '-1'),
				zonePosition: parseInt(element.find(`.Tag[@tag='${GameTag.ZONE_POSITION}']`)?.get('value') || '-1'),
				cardType: parseInt(element.find(`.Tag[@tag='${GameTag.CARDTYPE}']`)?.get('value') || '-1'),
				attack: parseInt(element.find(`.Tag[@tag='${GameTag.ATK}']`)?.get('value') || '-1'),
				health: parseInt(element.find(`.Tag[@tag='${GameTag.HEALTH}']`)?.get('value') || '-1'),
			};
		}
		if (element.tag === 'TagChange') {
			if (parseInt(element.get('tag')) === GameTag.CONTROLLER) {
				structure.entities[element.get('entity')].controller = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.ZONE) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].zone = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.ATK) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].attack = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.HEALTH) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].health = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.ZONE_POSITION) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].zonePosition = parseInt(element.get('value'));
			}
			if (
				parseInt(element.get('tag')) === GameTag.NEXT_STEP &&
				parseInt(element.get('value')) === Step.MAIN_START_TRIGGERS
			) {
				// console.log('considering parent', parent.get('entity'), parent);
				if (parent && parent.get('entity') === opponentPlayerEntityId) {
					const playerEntitiesOnBoard = Object.values(structure.entities)
						.map(entity => entity as any)
						.filter(entity => entity.controller === mainPlayerId)
						.filter(entity => entity.zone === Zone.PLAY)
						.filter(entity => entity.cardType === CardType.MINION)
						.sort((a, b) => a.zonePosition - b.zonePosition)
						.map(entity => ({
							cardId: entity.cardId,
							attack: entity.attack,
							health: entity.health,
						}));
					structure.boardByTurn = structure.boardByTurn.set(structure.currentTurn, playerEntitiesOnBoard);
					structure.currentTurn++;
				}
				// console.log('board for turn', structure.currentTurn, mainPlayerId, '\n', playerEntitiesOnBoard);
			}
		}

		const children = element.getchildren();
		if (children && children.length > 0) {
			for (const child of children) {
				this.parseElement(child, mainPlayerId, opponentPlayerEntityId, element, structure);
				// console.log('iterating', child.attrib);
			}
		}
	}
}
