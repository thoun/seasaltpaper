<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;

class NewRound extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_NEW_ROUND,
            type: StateType::GAME,
        );
    }

    function onEnteringState() {
        $this->game->setGameStateValue(END_ROUND_TYPE, 0);
        $this->game->setGameStateValue(LAST_CHANCE_CALLER, 0);
        $this->game->setGameStateValue(STOP_CALLER, 0);
        $this->game->setGameStateValue(BET_RESULT, 0);

        // init round discard
        $cards = [];
        foreach([1, 2] as $discardNumber) {
            $card = $this->game->cards->pickItemForLocation('deck', null, 'discard'.$discardNumber);
            $cards[] = $card;

            $this->notify->all('cardInDiscardFromDeck', '', [
                'card' => $card,
                'discardId' => $discardNumber,
                'deckTopCard' => $this->game->cards->getDeckTopCard(),
                'remainingCardsInDeck' => $this->game->getRemainingCardsInDeck(),
            ]);
        }

        $this->game->incStat(1, 'roundNumber');

        $this->notify->all('log', clienttranslate('A new round begins!'), []);
        $this->notify->all('log', clienttranslate('The cards ${cardColor1} ${cardName1} and ${cardColor2} ${cardName2} form the discard piles'), [
            'cardName1' => $this->game->getCardName($cards[0]),
            'cardName2' => $this->game->getCardName($cards[1]),
            'cardColor1' => $this->game->COLORS[$cards[0]->color],
            'cardColor2' => $this->game->COLORS[$cards[1]->color],
        ]);

        return TakeCards::class;
    }
}