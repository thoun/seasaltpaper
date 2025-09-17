<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;

class ChooseDiscardPile extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_PLAYER_CHOOSE_DISCARD_PILE,
            type: StateType::ACTIVE_PLAYER,
            name: 'chooseDiscardPile',
            description: clienttranslate('${actplayer} must choose a discard pile'),
            descriptionMyTurn: clienttranslate('${you} must choose a discard pile'),
        );
    }

    #[PossibleAction]
    public function actChooseDiscardPile(int $discardNumber) {
        if (!in_array($discardNumber, [1, 2])) {
            throw new \BgaUserException("Invalid discard number");
        }

        if ($this->game->cards->countItemsInLocation('discard'.$discardNumber) == 0) {
            throw new \BgaUserException("No card in that discard");
        }

        $card = $this->game->cards->getDiscardTopCard($discardNumber);
        if ($card == null) {
            throw new \BgaUserException("No card in that discard");
        }

        $this->game->setGameStateValue(CHOSEN_DISCARD, $discardNumber);

        return ChooseDiscardCard::class;
    }

    function zombie(int $playerId) {
        $sizes = [
            1 => $this->game->cards->countItemsInLocation('discard1'),
            2 => $this->game->cards->countItemsInLocation('discard2'),
        ];

        $zombieChoice = $this->getBestZombieChoice($sizes); // get top choice over possible moves
    	return $this->actChooseDiscardPile($zombieChoice);
    }
}