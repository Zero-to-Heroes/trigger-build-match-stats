import { Replay } from '@firestone-hs/hs-replay-xml-parser';
import { ReviewMessage } from '../review-message';

export interface GlobalBuilder {
	buildAndSaveStat(message: ReviewMessage, replay: Replay, replayXml: string): Promise<void>;
}
