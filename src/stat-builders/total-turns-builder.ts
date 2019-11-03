import { GameTag } from '@firestone-hs/replay-parser';
import { MatchStats } from '../match-stats';
import { Replay } from '../replay';
import { ReviewMessage } from '../review-message';
import { StatBuilder } from './_stat-builder';

export class TotalTurnsBuilder implements StatBuilder {
	public async extractStat(message: ReviewMessage, replay: Replay): Promise<MatchStats> {
		const lastTurn = replay.replay
			.findall(`.//TagChange[@tag='${GameTag.TURN}']`)
			.slice()
			.reverse()
			.map(tag => tag.get('value'))
			.map(value => parseInt(value))
			.find(value => value);
		return {
			numberOfTurns: Math.floor(lastTurn / 2),
		} as MatchStats;
	}
}
