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

        self::notifyAllPlayers('log', clienttranslate('${player_name} picks ${number} cards from the deck'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'number' => count($cards),
        ]);

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

        self::notifyAllPlayers('cardInHandFromDiscard', clienttranslate('${player_name} takes ${TODO} from discard pile ${discardNumber}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'TODO' =>'TODO',
            'discardId' => $discardNumber,
            'discardNumber' => $discardNumber,
            'newDiscardTopCard' => $this->getCardFromDb($this->cards->getCardOnTop('discard'.$discardNumber)),
        ]);

        if ($this->hasFourSirens($playerId)) {
            $this->gamestate->nextState('sirens');
        } else {
            $this->gamestate->nextState('playCards');
        }
    }

    public function chooseCard(int $cardId) {
        $this->checkAction('chooseCard'); 
        
        $playerId = $this->getActivePlayerId();

        $card = $this->getCardFromDb($this->cards->getCard($cardId));
        if ($card->location != 'pick') {
            throw new BgaUserException("Cannot pick this card");
        }

        $this->cards->moveCard($card->id, 'hand'.$playerId);

        self::notifyPlayer($playerId, 'cardInHandFromPick', clienttranslate('You choose ${TODO} card'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'TODO' =>'TODO',
        ]);
        self::notifyAllPlayers('cardInHandFromPick', clienttranslate('${player_name} chooses a card'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
        ]);

        if ($this->hasFourSirens($playerId)) {
            $this->gamestate->nextState('sirens');
            return;
        }
        
        $remainingCardsInPick = intval($this->cards->countCardInLocation('pick'));
        if ($remainingCardsInPick == 0) {
            $this->gamestate->nextState('playCards');
            return;
        }

        $remainingCardsInDiscard1 = intval($this->cards->countCardInLocation('discard1'));
        $remainingCardsInDiscard2 = intval($this->cards->countCardInLocation('discard2'));

        if ($remainingCardsInDiscard1 == 0) {
            $this->applyPutDiscardPile(1);
            $this->gamestate->nextState('playCards');
        } else if ($remainingCardsInDiscard2 == 0) {
            $this->applyPutDiscardPile(2);
            $this->gamestate->nextState('playCards');
        } else {
            $this->gamestate->nextState('putDiscardPile');
        }
    }

    private function applyPutDiscardPile(int $discardNumber) {        
        $playerId = $this->getActivePlayerId();

        $card = $this->getCardsFromDb($this->cards->getCardsInLocation('pick'))[0];
        if ($card == null) {
            throw new BgaUserException("No card in pick");
        }

        $this->cards->moveCard($card->id, 'discard'.$discardNumber, intval($this->cards->countCardInLocation('discard'.$discardNumber)) + 1);

        self::notifyAllPlayers('cardInDiscardFromPick', clienttranslate('${player_name} puts ${TODO} to discard pile ${discardNumber}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'TODO' =>'TODO',
            'discardId' => $discardNumber,
            'discardNumber' => $discardNumber,
        ]);
    }

    public function putDiscardPile(int $discardNumber) {
        $this->checkAction('putDiscardPile'); 
        
        if (!in_array($discardNumber, [1, 2])) {
            throw new BgaUserException("Invalid discard number");
        }

        $this->applyPutDiscardPile($discardNumber);

        $this->gamestate->nextState('playCards');
    }

    public function endTurn() {
        $this->checkAction('endTurn'); 
        
        $this->gamestate->nextState('endTurn');
    }

    private function applyEndRound(int $type, string $announcement) {
        $playerId = $this->getActivePlayerId();

        $this->setGameStateValue(END_ROUND_TYPE, $type);

        self::notifyAllPlayers('annouceLastChance', clienttranslate('${player_name} announces ${announcement}!'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'announcement' => $announcement,
            'i18n' => ['announcement'],
        ]);
        
        $this->gamestate->nextState('endTurn');
    }

    public function endRound() {
        $this->checkAction('endRound');

        $this->applyEndRound(LAST_CHANCE, _('LAST CHANCE'));
    }

    public function immediateEndRound() {
        $this->checkAction('endTurn');

        $this->applyEndRound(STOP, _('STOP'));
    }
}
