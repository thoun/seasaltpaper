<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;

class ChooseOpponentForSwap extends GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_PLAYER_CHOOSE_OPPONENT_FOR_SWAP,
            type: StateType::ACTIVE_PLAYER,
            name: 'chooseOpponentForSwap',
            description: clienttranslate('${actplayer} must choose an opponent to swap cards'),
            descriptionMyTurn: clienttranslate('${you} must choose an opponent to swap cards'),
        );
    }

    function getArgs(int $activePlayerId): array
    {
        $possibleOpponentsToSteal = $this->game->getPossibleOpponentsToSteal($activePlayerId);

        return [
            'playersIds' => $possibleOpponentsToSteal,
        ];
    }

    #[PossibleAction]
    public function actChooseOpponent(int $id, int $activePlayerId)
    {
        if ($this->game->globals->get(CAN_CHOOSE_CARD_TO_STEAL, false)) {
            $this->game->globals->set(STOLEN_PLAYER, $id);
            return SwapCard::class;
        } else {
            $this->game->applyStealRandomCard($activePlayerId, $id);

            return PlayCards::class;
        }
    }

    function zombie(int $playerId)
    {
        $args = $this->getArgs($playerId);

        $possibleAnswerPoints = [];
        foreach ($args['playersIds'] as $playerId) {
            $possibleAnswerPoints[$playerId] = count($this->game->getPlayerCards($playerId, 'hand', false));
        }

        $zombieChoice = $this->getBestZombieChoice($possibleAnswerPoints); // get top choice over possible moves
    	return $this->actChooseOpponent($zombieChoice, $playerId);
    }
}
