class PlayerTableTouristsBlock extends PlayerTableBlock {
    constructor(playerId: string, scoreSheets: ScoreSheets, visibleScoring: boolean) {
        super(playerId);

        let html = `
        <div id="tourists-block-${playerId}" data-tooltip="[40,41]" class="tourists block" data-zone="4">`;
        for(let i=1; i<=3; i++) {
            html += `
                    <div id="player-table-${playerId}-tourists-light-checkmark${i}" class="monument light checkmark" data-number="${i}"></div>`;
        }
        for(let i=1; i<=3; i++) {
            html += `
                    <div id="player-table-${playerId}-tourists-dark-checkmark${i}" class="monument dark checkmark" data-number="${i}"></div>`;
        }
        html += `
                    <div id="player-table-${playerId}-tourists-specialLight" class="special" data-style="Light"></div>
                    <div id="player-table-${playerId}-tourists-specialDark" class="special" data-style="Dark"></div>
                    <div id="player-table-${playerId}-tourists-specialMax" class="special"></div>`;
        for(let row=1; row<=3; row++) {
            for(let i=1; i<=4; i++) {
                html += `
                        <div id="player-table-${playerId}-tourists-checkmark${row}-${i}" class="tourists checkmark" data-row="${row}" data-number="${i}"></div>`;
            }
        }
        html += ` 
                    <div id="player-table-${playerId}-tourists-subtotal1" class="subtotal" data-number="1"></div>
                    <div id="player-table-${playerId}-tourists-subtotal2" class="subtotal" data-number="2"></div>
                    <div id="player-table-${playerId}-tourists-subtotal3" class="subtotal" data-number="3"></div>
                    <div id="player-table-${playerId}-tourists-total" class="total"></div>
                </div>
        `;
        dojo.place(html, `player-table-${playerId}-main`);

        this.updateScoreSheet(scoreSheets, visibleScoring);
    }

    public updateScoreSheet(scoreSheets: ScoreSheets, visibleScoring: boolean) {
        const current = scoreSheets.current.tourists;
        const validated = scoreSheets.validated.tourists;

        for(let i=1; i<=3; i++) {
            this.setContentAndValidation(`tourists-light-checkmark${i}`, current.checkedMonumentsLight >= i ? '✔' : '', current.checkedMonumentsLight >= i && validated.checkedMonumentsLight < i);
        }
        for(let i=1; i<=3; i++) {
            this.setContentAndValidation(`tourists-dark-checkmark${i}`, current.checkedMonumentsDark >= i ? '✔' : '', current.checkedMonumentsDark >= i && validated.checkedMonumentsDark < i);
        }

        this.setContentAndValidation(`tourists-specialLight`, current.specialMonumentLight, current.specialMonumentLight !== validated.specialMonumentLight);
        this.setContentAndValidation(`tourists-specialDark`, current.specialMonumentDark, current.specialMonumentDark !== validated.specialMonumentDark);
        if (visibleScoring) {
            this.setContentAndValidation(`tourists-specialMax`, current.specialMonumentMax, current.specialMonumentMax !== validated.specialMonumentMax);
        }
        
        for(let row=1; row<=3; row++) {
            for(let i=1; i<=4; i++) {
                this.setContentAndValidation(`tourists-checkmark${row}-${i}`, current.checkedTourists[row-1] >= i ? '✔' : (current.subTotals[row-1] ? '⎯⎯' : ''), current.checkedTourists[row-1] >= i && validated.checkedTourists[row-1] < i);
            }

            this.setContentAndValidation(`tourists-subtotal${row}`, current.subTotals[row-1], current.subTotals[row-1] != validated.subTotals[row-1]);
        }
        
        if (visibleScoring) {
            this.setContentAndValidation(`tourists-total`, current.total, current.total != validated.total);
        }
    }

}