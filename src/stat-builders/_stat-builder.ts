import { ReviewMessage } from '../review-message';

export interface StatBuilder {
	extractStat(message: ReviewMessage): Promise<Stat>;
}

export interface Stat {
	key: string;
	value: string | number;
}
