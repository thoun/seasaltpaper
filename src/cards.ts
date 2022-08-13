class Cards {
    private COLORS: string[];

    constructor(private game: SeaSaltPaperGame) {
        this.COLORS = [
            _('White'),
            _('Dark blue'),
            _('Light blue'),
            _('Black'),
            _('Yellow'),
            _('Green'),
            _('Purple'),
            _('Gray'),
            _('Light orange'),
            _('Pink'),
            _('Orange'),
          ];
    }  

    // gameui.cards.debugSeeAllCards()
    private debugSeeAllCards() {
        document.querySelectorAll('.card').forEach(card => card.remove());
        
        let html = `<div id="all-cards">`;
        html += `</div>`;
        dojo.place(html, 'full-table', 'before');

        [1, 2, 3, 4, 5, 6].forEach(subType => {
            const card = {
                id: 10+subType,
                type: 1,
                subType,
            } as any as Card;
            this.createMoveOrUpdateCard(card, `all-cards`);
        });

        [2, 3, 4, 5, 6].forEach(type => 
            [1, 2, 3].forEach(subType => {
                const card = {
                    id: 10*type+subType,
                    type,
                    subType,
                } as any as Card;
                this.createMoveOrUpdateCard(card, `all-cards`);
            })
        );
    }

    public createMoveOrUpdateCard(card: Card, destinationId: string, init: boolean = false, from: string = null) {
        const existingDiv = document.getElementById(`card-${card.id}`);
        const side = card.category ? 'front' : 'back';
        if (existingDiv) {
            if (existingDiv.parentElement.id == destinationId) {
                return;
            }

            (this.game as any).removeTooltip(`card-${card.id}`);
            const oldType = Number(existingDiv.dataset.category);
            existingDiv.classList.remove('selectable', 'selected', 'disabled');

            if (init) {
                document.getElementById(destinationId).appendChild(existingDiv);
            } else {
                slideToObjectAndAttach(this.game, existingDiv, destinationId);
            }
            existingDiv.dataset.side = ''+side;
            if (!oldType && card.category) {
                this.setVisibleInformations(existingDiv, card);
            } else if (oldType && !card.category) {
                setTimeout(() => this.removeVisibleInformations(existingDiv), 500); // so we don't change face while it is still visible
            }
            if (card.category) {
                this.game.setTooltip(existingDiv.id, this.getTooltip(card.category, card.family) + `<br><br><i>${this.COLORS[card.color]}</i>`);
            }
        } else {
            const div = document.createElement('div');
            div.id = `card-${card.id}`;
            div.classList.add('card');
            div.dataset.id = ''+card.id;
            div.dataset.side = ''+side;

            div.innerHTML = `
                <div class="card-sides">
                    <div class="card-side front">
                    </div>
                    <div class="card-side back">
                    </div>
                </div>
            `;
            document.getElementById(destinationId).appendChild(div);
            div.addEventListener('click', () => this.game.onCardClick(card));

            if (from) {
                const fromCardId = document.getElementById(from).id;
                slideFromObject(this.game, div, fromCardId);
            }

            if (card.category) {
                this.setVisibleInformations(div, card);
                if (!destinationId.startsWith('help-')) {
                    this.game.setTooltip(div.id, this.getTooltip(card.category, card.family) + `<br><br><i>${this.COLORS[card.color]}</i>`);
                }
            }
        }
    }

    private setVisibleInformations(div: HTMLElement, card: Card) {
        div.dataset.category = ''+card.category;
        div.dataset.family = ''+card.family;
        div.dataset.color = ''+card.color;
        div.dataset.index = ''+card.index;
    }

    private removeVisibleInformations(div: HTMLElement) {
        div.removeAttribute('data-category');
        div.removeAttribute('data-family');
        div.removeAttribute('data-color');
        div.removeAttribute('data-index');
    }

    public getTooltip(category: number, family?: number) {
        switch(category) {
            case 1:
                return `
                <div><strong>${_("Mermaid")}</strong></div>
                ${_("1 point for each card of the color the player has the most of. If they have more mermaid cards, they must look at which of the other colors they have more of. The same color cannot be counted for more than one mermaid card.")}
                <br><br>
                <strong>${_("Effect: If they place 4 mermaid cards, the player immediately wins the game.")}</strong>`;
            case 2:
                if (family >= 4) {
                    return `<div><strong>${_("Swimmer")}/${_("Shark")}</strong></div>
                    <div>${_("1 point for each combination of swimmer and shark cards.")}</div><br>
                    <div>${_("Effect:")} ${_("The player steals a random card from another player and adds it to their hand.")}</div>`;
                }
                const duoCards = [
                    [_('Crab'), _("The player chooses a discard pile, consults it without shuffling it, and chooses a card from it to add to their hand. They do not have to show it to the other players.")],
                    [_('Boat'), _("The player immediately takes another turn.")],
                    [_('Fish'), _("The player adds the top card from the deck to their hand.")]
                ];
                const duo = duoCards[family - 1];
                return `<div><strong>${duo[0]}</strong></div>
                <div>${_("1 point for each pair of ${card} cards.").replace('${card}', duo[0])}</div><br>
                <div>${_("Effect:")} ${_(duo[1])}</div>`;
            case 3:
                const collectorCards = [
                    ['0, 2, 4, 6, 8, 10', '1, 2, 3, 4, 5, 6', _('Shell')],
                    ['0, 3, 6, 9, 12', '1, 2, 3, 4, 5', _('Octopus')],
                    ['1, 3, 5', '1, 2, 3', _('Penguin')],
                    ['0, 5', '1,  2', _('Sailor')],
                ];
                const collector = collectorCards[family - 1];
                return `<div><strong>${collector[2]}</strong></div>
                <div>${_("${points} points depending on whether the player has ${numbers} ${card} cards.").replace('${points}', collector[0]).replace('${numbers}', collector[1]).replace('${card}', collector[2])}</div>`;
            case 4:
                const multiplierCards = [
                    [_('The lighthouse'), _('Boat'), 1],
                    [_('The shoal of fish'), _('Fish'), 1],
                    [_('The penguin colony'), _('Penguin'), 2],
                    [_('The captain'), _('Sailor'), 3],
                ];
                const multiplier = multiplierCards[family - 1];
                return `<div><strong>${multiplier[0]}</strong></div>
                <div>${_("${points} point(s) per ${card} card.").replace('${points}', multiplier[2]).replace('${card}', multiplier[1])}</div>
                <div>${_("This card does not count as a ${card} card.").replace('${card}', multiplier[1])}</div>`;
        }
            
    }
}