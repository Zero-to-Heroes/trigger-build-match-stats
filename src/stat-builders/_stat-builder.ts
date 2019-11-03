import { MatchStats } from '../match-stats';
import { Replay } from '../replay';
import { ReviewMessage } from '../review-message';

export interface StatBuilder {
	extractStat(message: ReviewMessage, replay: Replay): Promise<MatchStats>;
}
