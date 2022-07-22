class PlayerTableTrafficJamBlock extends PlayerTableBlock {
    constructor(playerId: string, scoreSheets: ScoreSheets, visibleScoring: boolean) {
        super(playerId);

        let html = `
        <div id="traffic-jam-block-${playerId}" data-tooltip="[93]" class="traffic-jam block" data-zone="7">`;
        for(let i=1; i<=19; i++) {
            html += `
                    <div id="player-table-${playerId}-traffic-jam-checkmark${i}" class="checkmark" data-number="${i}"></div>`;
        }
        html += `
                    <div id="player-table-${playerId}-traffic-jam-total" class="total"></div>
                </div>
        `;
        dojo.place(html, `player-table-${playerId}-main`);

        this.updateScoreSheet(scoreSheets, visibleScoring);
    }

    public updateScoreSheet(scoreSheets: ScoreSheets, visibleScoring: boolean) {
        const current = scoreSheets.current.trafficJam;
        const validated = scoreSheets.validated.trafficJam;

        for(let i=1; i<=19; i++) {
            this.setContentAndValidation(`traffic-jam-checkmark${i}`, current.checked >= i ? '✔' : '', current.checked >= i && validated.checked < i);
        }

        if (visibleScoring) {
            this.setContentAndValidation(`traffic-jam-total`, -current.total, current.total !== validated.total);
        }
    }

}