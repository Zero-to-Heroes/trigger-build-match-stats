import { Game } from '@firestone-hs/replay-parser';
import { MatchStats } from '../match-stats';
import { ReviewMessage } from '../review-message';
import { StatBuilder } from './_stat-builder';

export class TotalTurnsBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, game: Game): Promise<MatchStats> {
		return {
			numberOfTurns: Math.floor(game.turns.size / 2),
		} as MatchStats;
	}
}
