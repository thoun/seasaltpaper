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
        
        $playerId = intval($this->getActivePlayerId());

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
        
        $playerId = intval($this->getActivePlayerId());
        
        if (!in_array($discardNumber, [1, 2])) {
            throw new BgaUserException("Invalid discard number");
        }

        $card = $this->getCardFromDb($this->cards->getCardOnTop('discard'.$discardNumber));
        if ($card == null) {
            throw new BgaUserException("No card in that discard");
        }

        $this->cards->moveCard($card->id, 'hand'.$playerId);

        self::notifyAllPlayers('cardInHandFromDiscard', clienttranslate('${player_name} takes ${cardName} from discard pile ${discardNumber}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'cardName' => $this->getCardName($card),
            'discardId' => $discardNumber,
            'discardNumber' => $discardNumber,
            'newDiscardTopCard' => $this->getCardFromDb($this->cards->getCardOnTop('discard'.$discardNumber)),
            'remainingCardsInDiscard' => $this->getRemainingCardsInDiscard($discardNumber),
        ]);

        $this->updateCardsPoints($playerId);
        $this->gamestate->nextState('playCards');
    }

    public function chooseCard(int $cardId) {
        $this->checkAction('chooseCard'); 
        
        $playerId = intval($this->getActivePlayerId());

        $card = $this->getCardFromDb($this->cards->getCard($cardId));
        if ($card->location != 'pick') {
            throw new BgaUserException("Cannot pick this card");
        }

        $this->cards->moveCard($card->id, 'hand'.$playerId);

        self::notifyPlayer($playerId, 'cardInHandFromPick', clienttranslate('You choose ${cardName} card'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'cardName' => $this->getCardName($card),
        ]);
        self::notifyAllPlayers('cardInHandFromPick', clienttranslate('${player_name} chooses a card'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => Card::onlyId($card),
        ]);

        $this->updateCardsPoints($playerId);
        
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
        $playerId = intval($this->getActivePlayerId());

        $card = $this->getCardsFromDb($this->cards->getCardsInLocation('pick'))[0];
        if ($card == null) {
            throw new BgaUserException("No card in pick");
        }

        $this->cards->moveCard($card->id, 'discard'.$discardNumber, intval($this->cards->countCardInLocation('discard'.$discardNumber)) + 1);

        self::notifyAllPlayers('cardInDiscardFromPick', clienttranslate('${player_name} puts ${cardName} to discard pile ${discardNumber}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'cardName' => $this->getCardName($card),
            'discardId' => $discardNumber,
            'discardNumber' => $discardNumber,
            'remainingCardsInDiscard' => $this->getRemainingCardsInDiscard($discardNumber),
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

    public function playCards(int $id1, int $id2) {
        $this->checkAction('playCards'); 

        if ($id1 == $id2) {
            throw new BgaUserException("Same id");
        }

        $playerId = intval($this->getActivePlayerId());
        $cards = $this->getCardsFromDb($this->cards->getCards([$id1, $id2]));

        if ($this->array_some($cards, fn($card) => $card->location != 'hand'.$playerId || $card->category != PAIR)) {
            throw new BgaUserException("You must select Pair cards from your hand");
        }

        if (
            ($cards[0]->family == SWIMMER && $cards[1]->family != SHARK) ||            
            ($cards[0]->family == SHARK && $cards[1]->family != SWIMMER) ||
            (!in_array($cards[0]->family, [SWIMMER, SHARK]) && $cards[0]->family != $cards[1]->family)
        ) {
            throw new BgaUserException("Invalid pair");
        }

        $count = intval($this->cards->countCardInLocation('table'.$playerId));
        foreach($cards as $card) {
            $this->cards->moveCard($card->id, 'table'.$playerId, ++$count);
        }

        $action = '';
        switch ($cards[0]->family) {
            case CRAB:
                $action = clienttranslate('takes a card from a discard pile');
                break;
            case BOAT:
                $action = clienttranslate('plays a new turn');
                break;
            case FISH:
                $action = clienttranslate('adds the top card from the deck to hand');
                break;
            case SWIMMER:
            case SHARK:
                $action = clienttranslate('steals a random card from another player');
                break;
        }

        self::notifyAllPlayers('playCards', clienttranslate('${player_name} plays cards ${cardName} and ${action}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'cards' => $cards,
            'cardName' => $this->getCardName($card),
            'action' => $action,
            'i18n' => ['action'],
        ]);

        switch ($cards[0]->family) {
            case CRAB:
                if ((intval($this->cards->countCardInLocation('discard1')) + intval($this->cards->countCardInLocation('discard2'))) > 0) {
                    $this->gamestate->nextState('chooseDiscardPile');
                } else {
                    self::notifyAllPlayers('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }
                break;
            case BOAT:
                if ((intval($this->cards->countCardInLocation('deck')) + intval($this->cards->countCardInLocation('discard1')) + intval($this->cards->countCardInLocation('discard2'))) > 0) {
                    $this->gamestate->nextState('newTurn');
                } else {
                    self::notifyAllPlayers('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }
                break;
            case FISH:
                if (intval($this->cards->countCardInLocation('deck')) > 0) {
                    $card = $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'hand'.$playerId));

                    self::notifyPlayer($playerId, 'cardInHandFromPick', clienttranslate('You take ${cardName} card from deck'), [
                        'playerId' => $playerId,
                        'player_name' => $this->getPlayerName($playerId),
                        'card' => $card,
                        'cardName' => $this->getCardName($card),
                    ]);
                    self::notifyAllPlayers('cardInHandFromPick', clienttranslate('${player_name} took a card from deck'), [
                        'playerId' => $playerId,
                        'player_name' => $this->getPlayerName($playerId),
                    ]);
                    
                    $this->updateCardsPoints($playerId);
                    $this->gamestate->nextState('playCards');
                } else {
                    self::notifyAllPlayers('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }
                
                break;
            case SWIMMER:
            case SHARK:
                $possibleOpponentsToSteal = $this->getPossibleOpponentsToSteal($playerId);

                if (count($possibleOpponentsToSteal) > 1) {
                    $this->gamestate->nextState('chooseOpponent');
                } else {
                    if (count($possibleOpponentsToSteal) == 1) {
                        $this->applySteal($playerId, $possibleOpponentsToSteal[0]);
                    } else {
                        self::notifyAllPlayers('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    }
                    $this->gamestate->nextState('playCards');
                }
                break;
        }
    }

    public function endTurn() {
        $this->checkAction('endTurn'); 
        
        $this->gamestate->nextState('endTurn');
    }

    private function applyEndRound(int $type, string $announcement) {
        $playerId = intval($this->getActivePlayerId());

        $this->setGameStateValue(END_ROUND_TYPE, $type);

        self::notifyAllPlayers('announceEndRound', clienttranslate('${player_name} announces ${announcement}!'), [
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

    public function chooseDiscardPile(int $discardNumber) {
        $this->checkAction('chooseDiscardPile'); 
        
        if (!in_array($discardNumber, [1, 2])) {
            throw new BgaUserException("Invalid discard number");
        }

        if (intval($this->cards->countCardInLocation('discard'.$discardNumber)) == 0) {
            throw new BgaUserException("No card in that discard");
        }

        $card = $this->getCardFromDb($this->cards->getCardOnTop('discard'.$discardNumber));
        if ($card == null) {
            throw new BgaUserException("No card in that discard");
        }

        $this->setGameStateValue(CHOSEN_DISCARD, $discardNumber);

        $this->gamestate->nextState('chooseCard');
    }

    public function endGameWithSirens() {
        $playerId = intval($this->getActivePlayerId());

        $sirens = $this->getPlayerSirens($playerId);
        if (count($sirens) == 4) {
            $this->notifyAllPlayers('playCards', '', [
                'playerId' => $playerId,
                'cards' => $sirens,
            ]);

            $this->gamestate->nextState('sirens');
        } else {
            throw new BgaUserException("You need the four sirens");
        }
    }

    public function chooseDiscardCard(int $cardId) {
        $this->checkAction('chooseDiscardCard');

        $card = $this->getCardFromDb($this->cards->getCard($cardId));
        $discardNumber = $this->getGameStateValue(CHOSEN_DISCARD);
        if ($card == null || $card->location != 'discard'.$discardNumber) {
            throw new BgaUserException("Invalid discard card");
        }

        $playerId = intval($this->getActivePlayerId());

        $this->cards->moveCard($card->id, 'hand'.$playerId);

        self::notifyAllPlayers('cardInHandFromDiscard', clienttranslate('${player_name} takes ${cardName} from discard pile ${discardNumber}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'cardName' => $this->getCardName($card),
            'discardId' => $discardNumber,
            'discardNumber' => $discardNumber,
            'newDiscardTopCard' => $this->getCardFromDb($this->cards->getCardOnTop('discard'.$discardNumber)),
            'remainingCardsInDiscard' => $this->getRemainingCardsInDiscard($discardNumber),
        ]);

        $this->updateCardsPoints($playerId);
        $this->gamestate->nextState('playCards');
    }
}
