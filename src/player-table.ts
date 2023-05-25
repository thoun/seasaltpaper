const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;;
const log = isDebug ? console.log.bind(window.console) : function () { };

const CATEGORY_ORDER = [null, 4, 1, 2, 3];

const PAIR = 2;
const SPECIAL = 5;

const STARFISH = 1;

function sortCards(a: Card, b: Card) {
    return (CATEGORY_ORDER[a.category]*100 + a.family * 10 + a.color) - (CATEGORY_ORDER[b.category]*100 + b.family * 10 + b.color);
}

class PlayerTable {
    public playerId: number;

    private currentPlayer: boolean;
    private cardsPointsCounter: Counter;

    private handCards: LineStock<Card>;
    private tableCards: LineStock<Card>;

    private get handCardsDiv() {
        return document.getElementById(`player-table-${this.playerId}-hand-cards`);
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
            html += `<span class="counter" id="cards-points-tooltip">
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
            this.setHandPoints(player.cardsPoints, player.detailledPoints);
        }

        const stockSettings: LineStockSettings = {
            gap: '0px',
            sort: sortCards,
        }

        this.handCards = new LineStock<Card>(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-hand-cards`), {
            ...stockSettings,
            wrap: this.currentPlayer ? 'wrap' : 'nowrap',
        });
        this.handCards.onCardClick = card => this.game.onCardClick(card);
        this.tableCards = new LineStock<Card>(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-table-cards`), stockSettings);

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
    
    public addCardsToHand(cards: Card[], fromDeck: boolean = false) {
        cards.forEach(card => {
            this.handCards.addCard(card, {
                fromElement: fromDeck ? document.getElementById('deck') : undefined,
            });
            if (this.currentPlayer) {
                this.game.cardsManager.setCardVisible(card, true);
            }
        });

        //this.tableCards.addCards(cards);
        this.game.updateTableHeight();
    }

    public addCardsToTable(cards: Card[]) {
        cards.forEach(card => this.game.cardsManager.setCardVisible(card, true, { updateData: true, updateFront: true, updateBack: false }));
        this.tableCards.addCards(cards);
        this.game.updateTableHeight();
    }

    public cleanTable(deckStock: CardStock<Card>): void {
        const cards = [
            ...this.tableCards.getCards(),
            ...this.handCards.getCards(),
        ];

        deckStock.addCards(cards, undefined, {
            visible: false,
        });

        this.game.updateTableHeight();
        this.clearAnnouncement();
    }
    
    public setHandPoints(cardsPoints: number, detailledPoints: number[]) {
        this.cardsPointsCounter.toValue(cardsPoints);
        this.game.setTooltip(`cards-points-tooltip`, `
            <div>${_('Mermaid points:')} <strong>${detailledPoints[0]}</strong></div>
            <div>${_('Pair points:')} <strong>${detailledPoints[1]}</strong></div>
            <div>${_('Collection points:')} <strong>${detailledPoints[2]}</strong></div>
            <div>${_('Multiplier points:')} <strong>${detailledPoints[3]}</strong></div>
        `);
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

    public updateDisabledPlayCards(selectedCards: Card[], selectedStarfishCards: Card[], playableDuoCardFamilies: number[]) {
        if (!(this.game as any).isCurrentPlayerActive()) {
            return;
        }

        const cards = this.handCards.getCards();
        cards.forEach(card => {
            let disabled = false;
            if (card.category != PAIR) {
                if (card.category == SPECIAL && card.family == STARFISH) {
                    disabled = selectedStarfishCards.length > 0 && !selectedStarfishCards.some(c => c.id == card.id);
                } else {
                    disabled = true;
                }
            } else {
                if (playableDuoCardFamilies.includes(card.family)) {
                    if (selectedCards.length >= 2) {
                        disabled = !selectedCards.some(c => c.id == card.id);
                    } else if (selectedCards.length == 1) {
                        const matchFamilies = selectedCards[0].matchFamilies;
                        disabled = card.id != selectedCards[0].id && !matchFamilies.includes(card.family);
                    }
                } else {
                    disabled = true;
                }
            }
            this.handCards.getCardElement(card).classList.toggle('disabled', disabled);
        });
    }
}