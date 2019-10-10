import { Game } from '@firestone-hs/replay-parser';
import { MatchStats } from '../match-stats';
import { ReviewMessage } from '../review-message';

export interface StatBuilder {
	extractStat(message: ReviewMessage, game: Game): Promise<MatchStats>;
}
