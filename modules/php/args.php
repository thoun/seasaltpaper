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
        $playerId = intval($this->getActivePlayerId());
        $playersIds = $this->getPlayersIds();

        $cards = $this->getCardsFromDb($this->cards->getCardsInLocation('pick'));
        $maskedCards = Card::onlyIds($cards);

        $private = [];
        foreach ($playersIds as $pId) {
            $private[$pId] = [
                'cards' => ($pId == $playerId) ? $cards : $maskedCards
            ];
        }
    
        return [
            '_private' => $private,
            'remainingCardsInDeck' => $this->getRemainingCardsInDeck(),
        ];
    }
   
    function argPlayCards() {
        $playerId = intval($this->getActivePlayerId());

        $totalPoints = $this->getCardsPoints($playerId)->totalPoints;
        $playableDuoCards = $this->playableDuoCards($playerId);
        $canCallEndRound = $totalPoints >= 7 && intval($this->getGameStateValue(END_ROUND_TYPE)) == 0;
        $hasFourMermaids = count($this->getPlayerMermaids($playerId)) == 4;
    
        return [
            'canDoAction' => count($playableDuoCards) > 0 || $canCallEndRound || $hasFourMermaids,
            'playableDuoCards' => $playableDuoCards,
            'hasFourMermaids' => $hasFourMermaids,
            'canCallEndRound' => $canCallEndRound,
        ];
    }

    function argChooseDiscardCard() {
        $playerId = intval($this->getActivePlayerId());
        $playersIds = $this->getPlayersIds();

        $discardNumber = $this->getGameStateValue(CHOSEN_DISCARD);
        $cards = $this->getCardsFromDb($this->cards->getCardsInLocation('discard'.$discardNumber, null, 'location_arg'));
        $maskedCards = Card::onlyIds($cards);

        $private = [];
        foreach ($playersIds as $pId) {
            $private[$pId] = [
                'cards' => ($pId == $playerId) ? $cards : $maskedCards
            ];
        }
    
        return [
            'discardNumber' => $discardNumber,
            '_private' => $private,
        ];
    }

    function argChooseOpponent() {
        $playerId = intval($this->getActivePlayerId());

        $possibleOpponentsToSteal = $this->getPossibleOpponentsToSteal($playerId);

        return [
            'playersIds' => $possibleOpponentsToSteal,
        ];
    }
    
}
