class Cards {
    constructor(private game: SeaSaltPaperGame) {}  

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
                name: this.getTitle(1, subType)
            } as any as Card;
            this.createMoveOrUpdateCard(card, `all-cards`);
        });

        [2, 3, 4, 5, 6].forEach(type => 
            [1, 2, 3].forEach(subType => {
                const card = {
                    id: 10*type+subType,
                    type,
                    subType,
                    name: this.getTitle(type, subType)
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
                this.removeVisibleInformations(existingDiv);
            }
            //this.game.setTooltip(existingDiv.id, this.getTooltip(card.type, card.subType));
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
            }
            //this.game.setTooltip(div.id, this.getTooltip(card.type, card.subType));
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

    getTitle(type: number, subType: number) {
        switch(type) {
            case 1:
                switch(subType) {
                    case 1: case 2: return _('Infirmary');
                    case 3: case 4: return _('Sacred Place');
                    case 5: case 6: return _('Fortress');
                }
            case 2:
                switch(subType) {
                    case 1: return _('Herbalist');
                    case 2: return _('House');
                    case 3: return _('Prison');
                }
            case 3:
                switch(subType) {
                    case 1: return _('Forge');
                    case 2: return _('Terraced Houses');
                    case 3: return _('Outpost');
                }
            case 4:
                switch(subType) {
                    case 1: return _('Windmill');
                    case 2: return _('Sanctuary');
                    case 3: return _('Bunker');
                }
            case 5:
                switch(subType) {
                    case 1: return _('Power Station');
                    case 2: return _('Apartments');
                    case 3: return _('Radio Tower');
                }
            case 6:
                switch(subType) {
                    case 1: return _('Water Reservoir');
                    case 2: return _('Temple');
                    case 3: return _('Air Base');
                }
        }
            
    }

    getTooltip(type: number, subType: number) {
        if (!type) {
            return _('Common projects deck');
        }
        return `<h3 class="title">${this.getTitle(type, subType)}</h3><div>${this.getTooltipDescription(type)}</div>`;
    }

    getTooltipDescription(type: number) {
        switch(type) {
            case 1: return _('Construct a building with at least 2 floors on an area adjacent to an unoccupied area, respecting the indicated land types (1 copy each).');
            case 2: return _('Construct a building with at least 2 floors on the indicated land type in one of the 6 outside territories (1 copy each).');
            case 3: return _('Construct 2 buildings with at least 1 floor on 2 adjacent areas of the indicated land type (1 copy each).');
            case 4: return _('Construct 2 buildings, 1 with at least 2 floors and 1 with at least 1 floor, on 2 adjacent areas, respecting the indicated land type (1 copy each).');
            case 5: return _('Construct a building with at least 3 floors on the indicated land type in the central territory (1 copy each).');
            case 6: return _('Construct 3 buildings, 1 with at least 2 floors adjacent to 2 buildings with at least 1 floor respecting the indicated land types (1 copy each).');
        }
    }
}