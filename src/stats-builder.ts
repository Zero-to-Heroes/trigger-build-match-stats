/* eslint-disable @typescript-eslint/no-use-before-define */
import { parseHsReplayString, Replay } from '@firestone-hs/hs-replay-xml-parser';
import fetch, { RequestInfo } from 'node-fetch';
import { MatchStats } from './match-stats';
import { ReviewMessage } from './review-message';
import { BgsBuilder } from './stat-builders/battlegrounds/bgs-builder';
import { GlobalBuilder } from './stat-builders/_global-builder';

export class StatsBuilder {
	private static readonly globalBuilders: readonly GlobalBuilder[] = StatsBuilder.initializeGlobalBuilders();

	public async buildStats(messages: readonly ReviewMessage[]): Promise<readonly MatchStats[]> {
		return await Promise.all(messages.map(msg => this.buildStat(msg)));
	}

	private async buildStat(message: ReviewMessage): Promise<MatchStats> {
		console.log('processing message');
		if (message.application !== 'firestone') {
			console.log('not a firestone replay, not processing');
			return null;
		}
		// console.log('building stat for', message.reviewId, message.replayKey);
		const replayString = await this.loadReplayString(message.replayKey);
		if (!replayString || replayString.length === 0) {
			console.log('empty replay, returning');
			return null;
		}
		console.log('loaded replay string', replayString.length);
		const replay: Replay = parseHsReplayString(replayString);
		await Promise.all(
			StatsBuilder.globalBuilders.map(builder => builder.buildAndSaveStat(message, replay, replayString)),
		);
		console.log('operation successful');
	}

	private async loadReplayString(replayKey: string): Promise<string> {
		const data = await http(`https://s3-us-west-2.amazonaws.com/com.zerotoheroes.output/${replayKey}`);
		return data;
	}

	private static initializeGlobalBuilders(): readonly GlobalBuilder[] {
		return [new BgsBuilder()];
	}
}

const http = async (request: RequestInfo): Promise<any> => {
	return new Promise(resolve => {
		fetch(request)
			.then(response => {
				// console.log('received response', response);
				return response.text();
			})
			.then(body => {
				resolve(body);
			});
	});
};
