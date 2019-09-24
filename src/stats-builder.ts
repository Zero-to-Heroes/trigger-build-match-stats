import { Rds } from './db/rds';
import { MatchStats } from './match-stats';
import { ReviewMessage } from './review-message';
import { StatBuilder } from './stat-builders/_stat-builder';

export class StatsBuilder {
	private readonly statBuilders: readonly StatBuilder[] = this.initializeBuilders();

	public async buildStats(messages: readonly ReviewMessage[]): Promise<readonly MatchStats[]> {
		return await Promise.all(messages.map(msg => this.buildStat(msg)));
	}

	private async buildStat(message: ReviewMessage): Promise<MatchStats> {
		const stats = await Promise.all(this.statBuilders.map(builder => builder.extractStat(message)));
		const result = Object.assign(
			new MatchStats(),
			{
				reviewId: message.reviewId,
				replayKey: message.replayKey,
			} as MatchStats,
			stats,
		);
		await this.saveStat(result);
		return result;
	}

	private async saveStat(stat: MatchStats): Promise<void> {
		const rds = await Rds.getInstance();
		await rds.runQuery<void>(`
			INSERT INTO match_stats (reviewId, replayKey)
			VALUES (
				'${stat.reviewId}',
				'${stat.replayKey}'
			)`);
	}

	private initializeBuilders(): readonly StatBuilder[] {
		return [];
	}
}
