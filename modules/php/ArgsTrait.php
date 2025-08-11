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
   
    function argTakeCards() {
        $forceTakeOne = intval($this->getGameStateValue(FORCE_TAKE_ONE)) > 0;

        $canTakeFromDeck = $this->cards->countItemsInLocation('deck') > 0;
        $canTakeFromDiscard = [];
        foreach([1, 2] as $discardNumber) {
            if ($this->cards->countItemsInLocation('discard'.$discardNumber) > 0) {
                $canTakeFromDiscard[] = $discardNumber;
            }
        }
        $endRound = intval($this->getGameStateValue(END_ROUND_TYPE));
    
        return [
            'forceTakeOne' => $forceTakeOne,
            'canTakeFromDeck' => !$forceTakeOne && $canTakeFromDeck,
            'canTakeFromDiscard' => $forceTakeOne ? [] : $canTakeFromDiscard,
            'call' => in_array($endRound, [LAST_CHANCE, STOP]) ? $this->ANNOUNCEMENTS[$endRound] : '',
        ];
    }

    function argChooseCard() {        
        $playerId = intval($this->getActivePlayerId());

        $cards = $this->cards->getItemsInLocation('pick');
        $maskedCards = Card::onlyIds($cards);
    
        return [
            '_private' => [
                $playerId => [
                    'cards' => $cards,
                ]
            ],
            'cards' => $maskedCards,
            'deckTopCard' => $this->cards->getDeckTopCard(),
            'remainingCardsInDeck' => $this->getRemainingCardsInDeck(),
        ];
    }
   
    function argPlayCards() {
        $playerId = intval($this->getActivePlayerId());

        $totalPoints = $this->getCardsPoints($playerId)->totalPoints;
        $playableDuoCards = $this->playableDuoCards($playerId);
        $canCallEndRound = $totalPoints >= $this->pointsToEndRound($playerId) && intval($this->getGameStateValue(END_ROUND_TYPE)) == 0;
        $canStop = $canCallEndRound && !$this->eventCards->playerHasEffect($playerId, THE_DIODON_FISH);
        $mermaidsToEndGame = $this->mermaidsToEndGame($playerId);
        $hasFourMermaids = count($this->getPlayerMermaids($playerId)) == $mermaidsToEndGame;
        $canShield = $this->eventCards->playerHasEffect($playerId, THE_CORAL_REEF) && !$this->isProtected($playerId) && Arrays::some($this->getPlayerCards($playerId, 'hand', false), fn($card) => $card->category === COLLECTION && $card->family === SHELL);
    
        return [
            'canDoAction' => count($playableDuoCards) > 0 || $canCallEndRound || $hasFourMermaids || $canShield,
            'playableDuoCards' => $playableDuoCards,
            'hasFourMermaids' => $hasFourMermaids,
            'mermaidsToEndGame' => $mermaidsToEndGame,
            'canCallEndRound' => $canCallEndRound,
            'canStop' => $canStop,
            'canShield' => $canShield,
        ];
    }

    function argChooseDiscardCard() {
        $playerId = intval($this->getActivePlayerId());

        $discardNumber = $this->globals->get(THE_HERMIT_CRAB_CURRENT_PILE) ?? $this->getGameStateValue(CHOSEN_DISCARD);
        $cards = $this->cards->getItemsInLocation('discard'.$discardNumber);
        usort($cards, fn($a, $b) => $a->locationArg <=> $b->locationArg);
        $maskedCards = Card::onlyIds($cards);
    
        return [
            'discardNumber' => $discardNumber,
            '_private' => [
                $playerId => [
                    'cards' => $cards,
                ]
            ],
            'cards' => $maskedCards,
        ];
    }

    function argChooseOpponent() {
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

    function argAngelfishPower(): array {
        $playerId = intval($this->getActivePlayerId());

        $canPlay = false;
        if ($this->eventCards->playerHasEffect($playerId, THE_ANGELFISH)) {
            $cardInDiscard1 = $this->cards->getOnTop('discard1');
            $cardInDiscard2 = $this->cards->getOnTop('discard2');

            $canPlay = $cardInDiscard1 !== null && $cardInDiscard2 !== null && $cardInDiscard1->color === $cardInDiscard2->color;
        }

        return [
            '_no_notify' => !$canPlay,
        ];
    }
    
}
