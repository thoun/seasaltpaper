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
            description: clienttranslate('${actplayer} must choose a discard pile'),
            descriptionMyTurn: clienttranslate('${you} must choose a discard pile'),
            transitions: [
                "chooseCard" => ST_PLAYER_CHOOSE_DISCARD_CARD,
                "zombiePass" => ST_NEXT_PLAYER,
            ],
        );
    }

    #[PossibleAction]
    public function actChooseDiscardPile(int $discardNumber, int $activePlayerId) {
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

        $this->gamestate->nextState('chooseCard');
    }

    function zombie(int $playerId) {
    	return 'zombiePass';
    }
}