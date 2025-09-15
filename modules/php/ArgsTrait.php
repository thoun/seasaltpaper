<?php

namespace Bga\Games\SeaSaltPaper;

use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\SeaSaltPaper\Objects\Card;

trait ArgsTrait {

    //public CardManager $cards;
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    function argChooseOpponent() {
        $playerId = intval($this->getActivePlayerId());

        $possibleOpponentsToSteal = $this->getPossibleOpponentsToSteal($playerId);

        return [
            'playersIds' => $possibleOpponentsToSteal,
        ];
    }

    function argChooseOpponentForSwap() {
        $playerId = intval($this->getActivePlayerId());

        $possibleOpponentsToSteal = $this->getPossibleOpponentsToSteal($playerId);

        return [
            'playersIds' => $possibleOpponentsToSteal,
        ];
    }

    function argPlaceShellFaceDown(): array {
        $playerId = intval($this->getActivePlayerId());
        $hand = $this->getPlayerCards($playerId, 'hand', false);

        return [
            'selectableCards' => Arrays::filter($hand, fn($card) => $card->category === COLLECTION && $card->family === SHELL),
        ];
    }

    function argSwapCard(): array {
        $playerId = intval($this->getActivePlayerId());
        $opponentId = $this->globals->get(STOLEN_PLAYER);

        $cards = $this->getPlayerCards($opponentId, 'hand', false);
        usort($cards, fn($a, $b) => $a->locationArg <=> $b->locationArg);
        $maskedCards = Card::onlyIds($cards);
    
        return [
            'opponentId' => $opponentId,
            '_private' => [
                $playerId => [
                    'cards' => $cards,
                ]
            ],
            'cards' => $maskedCards,
        ];
    }

    function argStealPlayedPair(): array {
        $playerId = intval($this->getActivePlayerId());

        $opponentIds = $this->getPossibleOpponentsToStealFromTable($playerId);
        $possiblePairs = [];
        foreach ($opponentIds as $opponentId) {
            $possiblePairs[$opponentId] = $this->getPlayedPairs($opponentId);
        }

        return [
            'possiblePairs' => $possiblePairs,
            'opponentIds' => Arrays::filter($this->getPlayersIds(), fn($pId) => $playerId != $pId),
        ];
    }
}
