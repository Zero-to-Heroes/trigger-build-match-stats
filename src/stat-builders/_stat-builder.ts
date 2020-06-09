import { Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { ReviewMessage } from '../review-message';

export interface StatBuilder {
	extractAndSaveStat(message: ReviewMessage, replay: Replay, replayXml: string): Promise<void>;
}
