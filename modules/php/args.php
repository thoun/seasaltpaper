<?php

trait ArgsTrait {
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */
   
    function argTakeCards() {
        $canTakeFromDeck = intval($this->cards->countCardInLocation('deck')) > 0;
        $canTakeFromDiscard = [];
        foreach([1, 2] as $discardNumber) {
            if (intval($this->cards->countCardInLocation('discard'.$discardNumber)) > 0) {
                $canTakeFromDiscard[] = $discardNumber;
            }
        }
    
        return [
            'canTakeFromDeck' => $canTakeFromDeck,
            'canTakeFromDiscard' => $canTakeFromDiscard,
        ];
    }

    function argChooseCard() {        
        $playerId = $this->getActivePlayerId();

        $cards = $this->getCardsFromDb($this->cards->getCardsInLocation('pick'));
    
        return [
            '_private' => [
                $playerId => [
                    'cards' => $cards,
                ]
            ]
        ];
    }
   
    function argPlayCards() {
        $playerId = $this->getActivePlayerId();

        $totalPoints = $this->getCardsPoints($playerId)->totalPoints;
        $canCallEndRound = $totalPoints >= 7 && intval($this->getGameStateValue(END_ROUND_TYPE)) == 0;
    
        return [
            'totalPoints' => $totalPoints, // TODO remove
            'canCallEndRound' => $canCallEndRound,
        ];
    }

    function argChooseDiscardCard() {
        $playerId = $this->getActivePlayerId();

        $cards = $this->getCardsFromDb($this->cards->getCardsInLocation('discard'.$this->getGameStateValue(CHOSEN_DISCARD)));
    
        return [
            '_private' => [
                $playerId => [
                    'cards' => $cards,
                ]
            ]
        ];
    }
    
}
