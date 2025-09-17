<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\SeaSaltPaper\Game;

class ChooseKeptEventCard extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_MULTIPLAYER_CHOOSE_KEPT_EVENT_CARD,
            type: StateType::MULTIPLE_ACTIVE_PLAYER,
            name: 'chooseKeptEventCard',
            description: clienttranslate('A player must choose the event card to keep'),
            descriptionMyTurn: clienttranslate('${you} must choose the event card to keep'),
        );
    }

    function getArgs() {
        return [];
    }

    function onEnteringState() {
        // to not show the call bubble
        $this->game->setGameStateValue(END_ROUND_TYPE, 0);
        $this->game->setGameStateValue(LAST_CHANCE_CALLER, 0);
        $this->game->setGameStateValue(STOP_CALLER, 0);
        $this->game->setGameStateValue(BET_RESULT, 0);

        $this->gamestate->setPlayersMultiactive([$this->globals->get(DISCARD_EVENT_CARD_PLAYER_ID)], '', true);
    }

    #[PossibleAction]
    public function actChooseKeptEventCard(int $id, int $currentPlayerId) {
        $this->game->eventCards->keepCard($currentPlayerId, $id);

        return NewRound::class;
    }

    function zombie(int $playerId) {
    	$cards = $this->game->eventCards->getPlayer($playerId);
        $zombieChoice = $this->getRandomZombieChoice(Arrays::map($cards, fn($card) => $card->id)); // random choice over possible moves
    	return $this->actChooseKeptEventCard($zombieChoice, $playerId);
    }
}