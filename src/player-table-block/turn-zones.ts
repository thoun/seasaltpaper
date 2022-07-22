class PlayerTableTurnZonesBlock extends PlayerTableBlock {
    constructor(playerId: string, scoreSheets: ScoreSheets, visibleScoring: boolean) {
        super(playerId);

        let html = `
        <div id="turn-zones-block-${playerId}" data-tooltip="[92]" class="turn-zones block" data-zone="6">`;
        for(let i=1; i<=5; i++) {
            html += `
                    <div id="player-table-${playerId}-turn-zones-checkmark${i}" class="checkmark" data-number="${i}"></div>`;
        }
        html += `
                    <div id="player-table-${playerId}-turn-zones-total" class="total"></div>
                </div>
        `;
        dojo.place(html, `player-table-${playerId}-main`);

        this.updateScoreSheet(scoreSheets, visibleScoring);
    }

    public updateScoreSheet(scoreSheets: ScoreSheets, visibleScoring: boolean) {
        const current = scoreSheets.current.turnZones;
        const validated = scoreSheets.validated.turnZones;

        for(let i=1; i<=5; i++) {
            this.setContentAndValidation(`turn-zones-checkmark${i}`, current.checked >= i ? '✔' : '', current.checked >= i && validated.checked < i);
        }

        if (visibleScoring) {
            this.setContentAndValidation(`turn-zones-total`, -current.total, current.total !== validated.total);
        }
    }

}