class PlayerTablePersonalObjectiveBlock extends PlayerTableBlock {
    constructor(playerId: string, scoreSheets: ScoreSheets, visibleScoring: boolean) {
        super(playerId);

        let html = `
        <div id="personal-objective-block-${playerId}" data-tooltip="[91]" class="personal-objective block">
            <div id="player-table-${playerId}-personal-objective-total" class="total"></div>
        </div>
        `;
        dojo.place(html, `player-table-${playerId}-main`);

        this.updateScoreSheet(scoreSheets, visibleScoring);
    }

    public updateScoreSheet(scoreSheets: ScoreSheets, visibleScoring: boolean) {
        const current = scoreSheets.current.personalObjective;
        const validated = scoreSheets.validated.personalObjective;

        if (visibleScoring) {
            this.setContentAndValidation(`personal-objective-total`, current.total, current.total != validated.total);
        }
    }

}