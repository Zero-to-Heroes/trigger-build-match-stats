/* eslint-disable @typescript-eslint/no-use-before-define */
import { Game, GameParserService } from '@firestone-hs/replay-parser';
import fetch, { RequestInfo } from 'node-fetch';
// import { fetch } from 'node-fetch';
import { Rds } from './db/rds';
import { MatchStats } from './match-stats';
import { ReviewMessage } from './review-message';
import { TotalCardPlayedBuilder } from './stat-builders/total-cards-played-builder';
import { TotalManaSpentBuilder } from './stat-builders/total-mana-spent-builder';
import { TotalTurnsBuilder } from './stat-builders/total-turns-builder';
import { StatBuilder } from './stat-builders/_stat-builder';

export class StatsBuilder {
	private static parser: GameParserService;
	private static readonly statBuilders: readonly StatBuilder[] = StatsBuilder.initializeBuilders();

	public async buildStats(messages: readonly ReviewMessage[]): Promise<readonly MatchStats[]> {
		return await Promise.all(messages.map(msg => this.buildStat(msg)));
	}

	private async buildStat(message: ReviewMessage): Promise<MatchStats> {
		const replayString = await this.loadReplayString(message.replayKey);
		console.log('loaded replay string', replayString.length);
		const gameStates = await this.getFinalGameState(replayString);
		console.log('parsed game state', gameStates.turns.size);
		const stats = await Promise.all(
			StatsBuilder.statBuilders.map(builder => builder.extractStat(message, gameStates)),
		);
		console.log('built stats', stats);
		const result = Object.assign(
			new MatchStats(),
			{
				reviewId: message.reviewId,
				replayKey: message.replayKey,
			} as MatchStats,
			...stats,
		);
		console.log('saving result', result);
		await this.saveStat(result);
		return result;
	}

	private async getFinalGameState(replayString: string): Promise<Game> {
		return new Promise<Game>(async resolve => {
			const parser = await this.getParser();
			const obs = await parser.parse(replayString);
			const sub = obs.subscribe(([game, status, complete]: [Game, string, boolean]) => {
				if (complete && game) {
					sub.unsubscribe();
					resolve(game);
				}
			});
		});
	}

	private async saveStat(stat: MatchStats): Promise<void> {
		const rds = await Rds.getInstance();
		await rds.runQuery<void>(`
			INSERT INTO match_stats (
				reviewId, 
				replayKey,
				numberOfTurns,
				playerTotalManaSpent,
				opponentTotalManaSpent,
				playerTotalCardsPlayed,
				opponentTotalCardsPlayed
			)
			VALUES (
				'${stat.reviewId}',
				'${stat.replayKey}',
				'${stat.numberOfTurns}',
				'${stat.playerTotalManaSpent}',
				'${stat.opponentTotalManaSpent}',
				'${stat.playerTotalCardsPlayed}',
				'${stat.opponentTotalCardsPlayed}'
			)`);
	}

	private async loadReplayString(replayKey: string): Promise<string> {
		const data = await http(`https://s3-us-west-2.amazonaws.com/com.zerotoheroes.output/${replayKey}`);
		return data;
	}

	private async getParser(): Promise<GameParserService> {
		if (StatsBuilder.parser) {
			console.log('returning cached parser');
			return StatsBuilder.parser;
		}
		StatsBuilder.parser = await GameParserService.create();
		return StatsBuilder.parser;
	}

	private static initializeBuilders(): readonly StatBuilder[] {
		return [new TotalTurnsBuilder(), new TotalManaSpentBuilder(), new TotalCardPlayedBuilder()];
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
