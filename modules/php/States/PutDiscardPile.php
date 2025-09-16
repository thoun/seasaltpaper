<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;
use Bga\Games\SeaSaltPaper\Objects\Card;

class PutDiscardPile extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_PLAYER_PUT_DISCARD_PILE,
            type: StateType::ACTIVE_PLAYER,
            name: 'putDiscardPile',
            description: clienttranslate('${actplayer} must choose a discard pile for the other card'),
            descriptionMyTurn: clienttranslate('${you} must choose a discard pile for the other card'),
        );
    }

    function getArgs(int $activePlayerId) {
        $cards = $this->game->cards->getItemsInLocation('pick');
        $maskedCards = Card::onlyIds($cards);

        return [
            '_private' => [
                $activePlayerId => [
                    'cards' => $cards,
                ]
            ],
            'cards' => $maskedCards,
            'deckTopCard' => $this->game->cards->getDeckTopCard(),
            'remainingCardsInDeck' => $this->game->getRemainingCardsInDeck(),
        ];
    }

    #[PossibleAction]
    public function actPutDiscardPile(int $discardNumber) {
        if (!in_array($discardNumber, [1, 2])) {
            throw new \BgaUserException("Invalid discard number");
        }

        $this->game->applyPutDiscardPile($discardNumber);

        return AngelfishPower::class;
    }

    function zombie(int $playerId) {
    	return $this->actPutDiscardPile(bga_rand(1, 2));
    }
}
