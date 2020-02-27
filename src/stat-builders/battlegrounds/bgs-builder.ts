import { Replay } from '@firestone-hs/hs-replay-xml-parser';
import { ReviewMessage } from '../../review-message';
import { GlobalBuilder } from '../_global-builder';
import { StatBuilder } from '../_stat-builder';
import { BgsCompsBuilder } from './bgs-comps-builder';

export class BgsBuilder implements GlobalBuilder {
	private static readonly statBuilders: readonly StatBuilder[] = BgsBuilder.initializeBuilders();

	public async buildAndSaveStat(message: ReviewMessage, replay: Replay, replayXml: string): Promise<void> {
		if (message.gameMode !== 'battlegrounds') {
			console.log('not a bgs replay, not processing');
			return null;
		}
		await Promise.all(
			BgsBuilder.statBuilders.map(builder => builder.extractAndSaveStat(message, replay, replayXml)),
		);
		console.log('bgs successful');
	}

	private static initializeBuilders(): readonly StatBuilder[] {
		return [new BgsCompsBuilder()];
	}
}
