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
        $possibleDiscardPiles = [];
        foreach ([1, 2] as $number) {
            if ($this->game->cards->countItemsInLocation('discard'.$number) > 0) {
                $possibleDiscardPiles[] = $number;
            }
        }

        return [
            '_private' => [
                $activePlayerId => [
                    'cards' => $cards,
                ]
            ],
            'cards' => $maskedCards,
            'deckTopCard' => $this->game->cards->getDeckTopCard(),
            'remainingCardsInDeck' => $this->game->getRemainingCardsInDeck(),
            'possibleDiscardPiles' => $possibleDiscardPiles,
            '_no_notify' => count($possibleDiscardPiles) < 2,
        ];
    }

    public function onEnteringState(array $args) {
        $possibleDiscardPiles = $args['possibleDiscardPiles'];
        if (count($possibleDiscardPiles) === 0) {
            return $this->actPutDiscardPile(1);
        } else if (count($possibleDiscardPiles) === 1) {
            $emptyPile = 3 - $possibleDiscardPiles[0];
            return $this->actPutDiscardPile($emptyPile);
        }
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
        $args = $this->getArgs($playerId);
        $zombieChoice = $this->getRandomZombieChoice($args['possibleDiscardPiles']);
    	return $this->actPutDiscardPile($zombieChoice);
    }
}
