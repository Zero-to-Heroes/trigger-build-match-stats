import { GameTag } from '@firestone-hs/replay-parser';
import { MatchStats } from '../../match-stats';
import { Replay } from '../../replay';
import { ReviewMessage } from '../../review-message';
import { MatchStatBuilder } from './_match-stat-builder';

export class TotalCardPlayedBuilder implements MatchStatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<MatchStats> {
		const cardPlayedChanges = replay.replay
			.findall(`.//TagChange[@tag='${GameTag.NUM_CARDS_PLAYED_THIS_TURN}']`)
			.filter(tag => parseInt(tag.get('value')) !== 0);
		const totalCardsPlayedByPlayer = [...cardPlayedChanges].filter(
			tagChange => parseInt(tagChange.get('entity')) === replay.mainPlayerId + 1,
		).length;
		const totalCardsPlayedByOpponent = [...cardPlayedChanges].filter(
			tagChange => parseInt(tagChange.get('entity')) !== replay.mainPlayerId + 1,
		).length;
		return {
			playerTotalCardsPlayed: totalCardsPlayedByPlayer,
			opponentTotalCardsPlayed: totalCardsPlayedByOpponent,
		} as MatchStats;
	}
}
