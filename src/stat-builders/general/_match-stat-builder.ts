import { MatchStats } from '../../match-stats';
import { Replay } from '../../replay';
import { ReviewMessage } from '../../review-message';

export interface MatchStatBuilder {
	extractStat(message: ReviewMessage, replay: Replay): Promise<MatchStats>;
}
