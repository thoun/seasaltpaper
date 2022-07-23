<?php

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */

    public function takeCardsFromDeck() {
        $this->checkAction('takeCardsFromDeck'); 
        
        $playerId = $this->getActivePlayerId();

        $cards = $this->getCardsFromDb($this->cards->pickCardsForLocation(2, 'deck', 'pick'));

        /*$mapElements = $this->MAP_POSITIONS[$this->getMap()][$position];
        $ticketNumber = $this->array_find($mapElements, fn($element) => $element >= 1 && $element <= 12);

        if ($ticketNumber === null || !$this->array_some($tickets, fn($ticket) => $ticket->type == $ticketNumber)) {
            throw new BgaUserException("Invalid departure");
        }

        $this->DbQuery("UPDATE player SET `player_departure_position` = $position WHERE `player_id` = $playerId");
        
        self::notifyAllPlayers('log', clienttranslate('${player_name} has chose the position for its departure pawn'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
        ]);*/

        $this->gamestate->nextState('chooseCard');
    }

    public function takeCardFromDiscard(int $discardNumber) {
        $this->checkAction('takeCardFromDiscard'); 
        
        $playerId = $this->getActivePlayerId();
        
        if (!in_array($discardNumber, [1, 2])) {
            throw new BgaUserException("Invalid discard number");
        }

        $card = $this->getCardFromDb($this->cards->getCardOnTop('discard'.$discardNumber));
        if ($card == null) {
            throw new BgaUserException("No card in that discard");
        }

        $this->cards->moveCard($card->id, 'hand'.$playerId);

        // TODO notif card in hand
        // TODO notif new card on discard top

        $this->gamestate->nextState('playCards');
    }

    public function chooseCard(int $cardId) {
        $this->checkAction('chooseCard'); 
        
        $playerId = $this->getActivePlayerId();

        $card = $this->getCardFromDb($this->cards->getCard($cardId));
        if ($card->location != 'pick') {
            throw new BgaUserException("Cannot pick this card");
        }

        $this->cards->moveCard($card->id, 'hand'.$playerId);

        // TODO notif card in hand

        // TODO auto-place if 1 or 2 discard piles empty
        $this->gamestate->nextState('putDiscardPile');
    }

    public function putDiscardPile(int $discardNumber) {
        $this->checkAction('putDiscardPile'); 
        
        $playerId = $this->getActivePlayerId();
        
        if (!in_array($discardNumber, [1, 2])) {
            throw new BgaUserException("Invalid discard number");
        }

        $card = $this->getCardsFromDb($this->cards->getCardsInLocation('pick'))[0];
        if ($card == null) {
            throw new BgaUserException("No card in pick");
        }

        $this->cards->moveCard($card->id, 'discard'.$discardNumber, intval($this->cards->countCardInLocation('discard'.$discardNumber)) + 1);

        // TODO notif new card on discard top

        $this->gamestate->nextState('playCards');
    }

    public function endTurn() {
        $this->checkAction('endTurn'); 
        
        $this->gamestate->nextState('endTurn');
    }

    public function endRound() {
        $this->checkAction('endRound'); 

        // TODO
        
        $this->gamestate->nextState('endTurn');
    }

    public function immediateEndRound() {
        $this->checkAction('endTurn'); 

        // TODO
        
        $this->gamestate->nextState('immediateEndRound');
    }
}
