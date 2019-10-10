import { Game, GameTag } from '@firestone-hs/replay-parser';
import { MatchStats } from '../match-stats';
import { ReviewMessage } from '../review-message';
import { StatBuilder } from './_stat-builder';

export class TotalManaSpentBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, game: Game): Promise<MatchStats> {
		const playerEntityId = game.players[0].id;
		const opponentEntityId = game.players[1].id;
		const lastTurn = game.turns.get(game.turns.size - 1);
		const lastAction = lastTurn.actions[lastTurn.actions.length - 1];
		const playerTotalManaSpent = lastAction.entities
			.get(playerEntityId)
			.getTag(GameTag.NUM_RESOURCES_SPENT_THIS_GAME);
		const opponentTotalManaSpent = lastAction.entities
			.get(opponentEntityId)
			.getTag(GameTag.NUM_RESOURCES_SPENT_THIS_GAME);
		console.log('total mana spent built', playerTotalManaSpent, opponentTotalManaSpent);
		return {
			playerTotalManaSpent: playerTotalManaSpent,
			opponentTotalManaSpent: opponentTotalManaSpent,
		} as MatchStats;
	}
}
