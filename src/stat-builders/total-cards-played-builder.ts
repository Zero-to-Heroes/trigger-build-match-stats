import { Game, GameTag } from '@firestone-hs/replay-parser';
import { MatchStats } from '../match-stats';
import { ReviewMessage } from '../review-message';
import { StatBuilder } from './_stat-builder';

export class TotalCardPlayedBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, game: Game): Promise<MatchStats> {
		const playerEntityId = game.players[0].id;
		const opponentEntityId = game.players[1].id;
		// cards are tracked on a turn basis
		const lastTurnActions = game.turns.map(turn => turn.actions[turn.actions.length - 1]);
		const playerTotalCardsPlayed: number = lastTurnActions
			.map(action => action.entities.get(playerEntityId).getTag(GameTag.NUM_CARDS_PLAYED_THIS_TURN) || 0)
			.reduce((sum, current) => sum + current, 0);
		const opponentTotalCardsPlayed: number = lastTurnActions
			.map(action => action.entities.get(opponentEntityId).getTag(GameTag.NUM_CARDS_PLAYED_THIS_TURN) || 0)
			.reduce((sum, current) => sum + current, 0);
		console.log('total mana spent built', playerTotalCardsPlayed, opponentTotalCardsPlayed);
		return {
			playerTotalCardsPlayed: playerTotalCardsPlayed,
			opponentTotalCardsPlayed: opponentTotalCardsPlayed,
		} as MatchStats;
	}
}
