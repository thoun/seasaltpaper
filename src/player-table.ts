const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;;
const log = isDebug ? console.log.bind(window.console) : function () { };

class PlayerTable {
    public playerId: number;

    constructor(game: SeaSaltPaperGame, player: SeaSaltPaperPlayer) {
        this.playerId = Number(player.id);

        let html = `
        <div id="player-table-${this.playerId}" class="player-table" style="box-shadow: 0 0 3px 3px #${player.color};">
            <div class="name" style="color: #${player.color};">${player.name}</div>
            <div id="player-table-${this.playerId}-cards" class="cards">
            </div>
        </div>
        `;
        dojo.place(html, document.getElementById('full-table'));
    }
}