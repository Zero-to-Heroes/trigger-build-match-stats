import { GameTag } from '@firestone-hs/replay-parser';
import { MatchStats } from '../../match-stats';
import { Replay } from '../../replay';
import { ReviewMessage } from '../../review-message';
import { MatchStatBuilder } from './_match-stat-builder';

export class TotalManaSpentBuilder implements MatchStatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<MatchStats> {
		const resourcesSpentChanges = replay.replay
			.findall(`.//TagChange[@tag='${GameTag.NUM_RESOURCES_SPENT_THIS_GAME}']`)
			.filter(tag => parseInt(tag.get('value')) !== 0);
		const playerResourcesSpentChanges = [...resourcesSpentChanges]
			.filter(tagChange => parseInt(tagChange.get('entity')) === replay.mainPlayerId + 1)
			.map(tag => parseInt(tag.get('value')))
			.slice()
			.reverse()
			.find(total => total);
		const opponentResourcesSpentChanges = [...resourcesSpentChanges]
			.filter(tagChange => parseInt(tagChange.get('entity')) !== replay.mainPlayerId + 1)
			.map(tag => parseInt(tag.get('value')))
			.slice()
			.reverse()
			.find(total => total);
		return {
			playerTotalManaSpent: playerResourcesSpentChanges,
			opponentTotalManaSpent: opponentResourcesSpentChanges,
		} as MatchStats;
	}
}
