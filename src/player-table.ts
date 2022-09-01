const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;;
const log = isDebug ? console.log.bind(window.console) : function () { };

const CATEGORY_ORDER = [null, 4, 1, 2, 3];

class PlayerTable {
    public playerId: number;

    private currentPlayer: boolean;
    private cardsPointsCounter: Counter;

    private get handCardsDiv() {
        return document.getElementById(`player-table-${this.playerId}-hand-cards`);
    }
    private get tableCardsDiv() {
        return document.getElementById(`player-table-${this.playerId}-table-cards`);
    }

    constructor(private game: SeaSaltPaperGame, player: SeaSaltPaperPlayer) {
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();

        let html = `
        <div id="player-table-${this.playerId}" class="player-table">
            <div id="player-table-${this.playerId}-hand-cards" class="hand cards" data-player-id="${this.playerId}" data-current-player="${this.currentPlayer.toString()}" data-my-hand="${this.currentPlayer.toString()}"></div>
            <div class="name-wrapper">
                <span class="name" style="color: #${player.color};">${player.name}</span>
                <div class="bubble-wrapper">
                    <div id="player-table-${this.playerId}-discussion-bubble" class="discussion_bubble" data-visible="false"></div>
                </div>
        `;
        if (this.currentPlayer) {
            html += `<span class="counter">
                    (${_('Cards points:')}&nbsp;<span id="cards-points-counter"></span>)
                </span>`;
        }
        html += `</div>
            <div id="player-table-${this.playerId}-table-cards" class="table cards">
            </div>
        </div>
        `;
        dojo.place(html, document.getElementById('tables'));

        if (this.currentPlayer) {
            this.cardsPointsCounter = new ebg.counter();
            this.cardsPointsCounter.create(`cards-points-counter`);
            this.cardsPointsCounter.setValue(player.cardsPoints);
        }

        this.addCardsToHand(player.handCards);
        this.addCardsToTable(player.tableCards);

        if (player.endCall) {
            const args = {
                announcement: player.endCall.announcement,
                result: player.endCall.betResult,
            };
            (this.game as any).format_string_recursive('log', args);
            this.showAnnouncement(args.announcement);
            this.showAnnouncementPoints(player.endCall.cardsPoints);
            if (player.endCall.betResult) {
                this.showAnnouncementBetResult(args.result);
            }
        } else if (player.endRoundPoints) {
            this.showAnnouncementPoints(player.endRoundPoints.cardsPoints);
        }
        if (player.scoringDetail) {
            this.showScoreDetails(player.scoringDetail);
        }
    }
    
    public addCardsToHand(cards: Card[], from?: string) {
        this.addCards(cards, 'hand', from);
    }
    public addCardsToTable(cards: Card[], from?: string) {
        this.addCards(cards, 'table', from);
    }

    public cleanTable(): void {
        const cards = [
            ...Array.from(this.handCardsDiv.getElementsByClassName('card')) as HTMLDivElement[],
            ...Array.from(this.tableCardsDiv.getElementsByClassName('card')) as HTMLDivElement[],
        ];
        
        cards.forEach(cardDiv => this.game.cards.createMoveOrUpdateCard({
            id: Number(cardDiv.dataset.id),
        } as any, `deck`));

        setTimeout(() => cards.forEach(cardDiv => cardDiv?.parentElement.removeChild(cardDiv)), 500);
        this.game.updateTableHeight();
        this.clearAnnouncement();
    }
    
    public setHandPoints(cardsPoints: number) {
        this.cardsPointsCounter.toValue(cardsPoints);
    }

    public showAnnouncementPoints(playerPoints: number) {
        const bubble = document.getElementById(`player-table-${this.playerId}-discussion-bubble`);
        bubble.innerHTML += _('I got ${points} points.').replace('${points}', playerPoints) + ' ';
        bubble.dataset.visible = 'true';
    }

    public showAnnouncement(announcement: string) {
        const bubble = document.getElementById(`player-table-${this.playerId}-discussion-bubble`);
        bubble.innerHTML += _('I announce ${announcement}!').replace('${announcement}', _(announcement)) + ' ';
        bubble.dataset.visible = 'true';
    }

    public clearAnnouncement() {
        const bubble = document.getElementById(`player-table-${this.playerId}-discussion-bubble`);
        bubble.innerHTML = '';
        bubble.dataset.visible = 'false';
    }

    public showAnnouncementBetResult(result: string) {
        const bubble = document.getElementById(`player-table-${this.playerId}-discussion-bubble`);
        bubble.innerHTML += `<div>${_('I ${result} my bet!').replace('${result}', _(result))}</div>`;
        bubble.dataset.visible = 'true';
    }

    public showEmptyDeck(): void {
        const bubble = document.getElementById(`player-table-${this.playerId}-discussion-bubble`);
        bubble.innerHTML += `<div>${_('I score no points, because deck is empty and no one called the end of the round')}</div>`;
        bubble.dataset.visible = 'true';
    }
    
    public showScoreDetails(scoreDetails: ScoreDetails) {
        if (scoreDetails.cardsPoints === null && scoreDetails.colorBonus === null) {
            this.showEmptyDeck();
            return;
        }

        let scoreDetailStr = '<div class="bubble-score">';
        if (scoreDetails.cardsPoints !== null && scoreDetails.colorBonus !== null) {
            scoreDetailStr += _('I score my ${cardPoints} card points plus my color bonus of ${colorBonus}.').replace('${cardPoints}', scoreDetails.cardsPoints).replace('${colorBonus}', scoreDetails.colorBonus);
        } else if (scoreDetails.cardsPoints === null && scoreDetails.colorBonus !== null) {
            scoreDetailStr += _('I only score my color bonus of ${colorBonus}.').replace('${colorBonus}', scoreDetails.colorBonus);
        } else if (scoreDetails.cardsPoints !== null && scoreDetails.colorBonus === null) {
            scoreDetailStr += _('I score my ${cardPoints} card points.').replace('${cardPoints}', scoreDetails.cardsPoints);
        }
        const bubble = document.getElementById(`player-table-${this.playerId}-discussion-bubble`);
        bubble.innerHTML += scoreDetailStr + "</div>";
        bubble.dataset.visible = 'true';
    }
    
    public setSelectable(selectable: boolean) {
        const cards = Array.from(this.handCardsDiv.getElementsByClassName('card')) as HTMLDivElement[];
        if (selectable) {
            cards.forEach(card => card.classList.add('selectable'));
        } else {
            cards.forEach(card => card.classList.remove('selectable', 'selected', 'disabled'));
        }
    }

    public updateDisabledPlayCards(selectedCards: number[], playableDuoCardFamilies: number[]) {
        if (!(this.game as any).isCurrentPlayerActive()) {
            return;
        }

        const cards = Array.from(this.handCardsDiv.getElementsByClassName('card')) as HTMLDivElement[];
        cards.forEach(card => {
            let disabled = false;
            if (card.dataset.category != '2') {
                disabled = true;
            } else {
                if (playableDuoCardFamilies.includes(Number(card.dataset.family))) {
                    if (selectedCards.length >= 2) {
                        disabled = !selectedCards.includes(Number(card.dataset.id));
                    } else if (selectedCards.length == 1) {
                        const family = Number(document.getElementById(`card-${selectedCards[0]}`).dataset.family);
                        const authorizedFamily = ''+(family >= 4 ? 9 - family : family);
                        disabled = Number(card.dataset.id) != selectedCards[0] && card.dataset.family != authorizedFamily;
                    }
                } else {
                    disabled = true;
                }
            }
            card.classList.toggle('disabled', disabled);
        });
    }
    
    private addCards(cards: Card[], to: 'hand' | 'table', from?: string) {
        cards.forEach(card => {
            this.game.cards.createMoveOrUpdateCard(card, `player-table-${this.playerId}-${to}-cards`, false, from);
            document.getElementById(`card-${card.id}`).style.order = ''+(CATEGORY_ORDER[card.category]*100 + card.family * 10 + card.color);
        });
        this.game.updateTableHeight();
    }
}