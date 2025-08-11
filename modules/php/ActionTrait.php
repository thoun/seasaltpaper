<?php

namespace Bga\Games\SeaSaltPaper;

use Bga\GameFramework\Actions\CheckAction;
use Bga\Games\SeaSaltPaper\Objects\Card;

trait ActionTrait {

    //public CardManager $cards;

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */
    
    public function actTakeCardsFromDeck() {        
        $playerId = intval($this->getActivePlayerId());
        $args = $this->argTakeCards();

        if ($args['forceTakeOne']) {
            $this->takeFirstCardFromDeck($playerId);
            return;
        }

        if (!$args['canTakeFromDeck']) {
            throw new \BgaUserException("You can't take a card from the deck");
        }

        $cards = $this->cards->pickItemsForLocation(2, 'deck', null, 'pick');

        $this->notify->all('log', clienttranslate('${player_name} picks ${number} cards from the deck'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'number' => count($cards),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
        ]);

        $this->incStat(1, 'takeCardFromDeck');
        $this->incStat(1, 'takeCardFromDeck', $playerId);

        $this->gamestate->nextState('chooseCard');
    }

    public function takeFirstCardFromDeck(int $playerId) {

        if (intval($this->cards->countItemsInLocation('deck')) > 0) {
            $card = $this->cards->pickItemForLocation('deck', null, 'hand'.$playerId);
            $this->cardCollected($playerId, $card);

            $this->notify->player($playerId, 'cardInHandFromDeck', clienttranslate('You take ${cardColor} ${cardName} card from deck'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerNameById($playerId),
                'card' => $card,
                'cardName' => $this->getCardName($card),
                'cardColor' => $this->COLORS[$card->color],
                'i18n' => ['cardName', 'cardColor'],
                'preserve' => ['actionPlayerId'],
                'actionPlayerId' => $playerId,
                'deckTopCard' => $this->cards->getDeckTopCard(),
                'remainingCardsInDeck' => $this->getRemainingCardsInDeck(),
            ]);
            $this->notify->all('cardInHandFromDeck', clienttranslate('${player_name} took a card from deck'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerNameById($playerId),
                'card' => Card::onlyId($card),
                'preserve' => ['actionPlayerId'],
                'actionPlayerId' => $playerId,
                'deckTopCard' => $this->cards->getDeckTopCard(),
                'remainingCardsInDeck' => $this->getRemainingCardsInDeck(),
            ]);

            $this->updateCardsPoints($playerId);
        }
            
        $this->gamestate->nextState('zombiePass');

    }

    public function actTakeCardFromDiscard(int $discardNumber) {       

        $args = $this->argTakeCards();        
        
        if (!in_array($discardNumber, $args['canTakeFromDiscard'])) {
            throw new \BgaUserException("You can't take a card from the discard pile");
        }

        $card = $this->cards->getDiscardTopCard($discardNumber);
        if ($card == null) {
            throw new \BgaUserException("No card in that discard");
        }

        $playerId = intval($this->getActivePlayerId());

        $this->cards->moveItem($card, 'hand'.$playerId);
        $this->cardCollected($playerId, $card);

        $this->notify->all('cardInHandFromDiscard', clienttranslate('${player_name} takes ${cardColor} ${cardName} from discard pile ${discardNumber}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => $card,
            'cardName' => $this->getCardName($card),
            'cardColor' => $this->COLORS[$card->color],
            'i18n' => ['cardName', 'cardColor'],
            'discardId' => $discardNumber,
            'discardNumber' => $discardNumber,
            'newDiscardTopCard' => $this->cards->getDiscardTopCard($discardNumber),
            'remainingCardsInDiscard' => $this->getRemainingCardsInDiscard($discardNumber),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
        ]);

        $this->incStat(1, 'takeFromDiscard');
        $this->incStat(1, 'takeFromDiscard', $playerId);

        $this->updateCardsPoints($playerId);
        $this->gamestate->nextState('playCards');
    }

    public function actChooseCard(int $id) {        
        $playerId = intval($this->getActivePlayerId());

        $card = $this->cards->getItemById($id);
        if ($card->location != 'pick') {
            throw new \BgaUserException("Cannot pick this card");
        }

        $this->cards->moveItem($card, 'hand'.$playerId);
        $this->cardCollected($playerId, $card);

        $this->notify->player($playerId, 'cardInHandFromPick', clienttranslate('You choose ${cardColor} ${cardName} card'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => $card,
            'cardName' => $this->getCardName($card),
            'cardColor' => $this->COLORS[$card->color],
            'i18n' => ['cardName', 'cardColor'],
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
        ]);
        $this->notify->all('cardInHandFromPick', clienttranslate('${player_name} chooses a card'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => Card::onlyId($card),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
        ]);

        $this->updateCardsPoints($playerId);
        
        $remainingCardsInPick = $this->cards->countItemsInLocation('pick');
        if ($remainingCardsInPick == 0) {
            $this->gamestate->nextState('playCards');
            return;
        }

        if (boolval($this->getGameStateValue(LOBSTER_POWER))) {
            $this->setGameStateValue(LOBSTER_POWER, 0);

            $cards = $this->cards->getItemsInLocation('pick');
            if (count($cards) > 0) {
                $this->cards->moveAllItemsInLocation('pick', 'deck');
                $this->cards->shuffle('deck');

                $this->notify->all('cardsInDeckFromPick', '', [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerNameById($playerId),
                    'cards' => $cards,
                    'deckTopCard' => $this->cards->getDeckTopCard(),
                    'remainingCardsInDeck' => $this->getRemainingCardsInDeck(),
                    'preserve' => ['actionPlayerId'],
                    'actionPlayerId' => $playerId,
                ]);

                $this->notify->all('reshuffleDeck', '', [
                    'deckTopCard' => $this->cards->getDeckTopCard(),
                ]);
            }

            $this->gamestate->nextState('playCards');
        } else {
            $remainingCardsInDiscard1 = $this->cards->countItemsInLocation('discard1');
            $remainingCardsInDiscard2 = $this->cards->countItemsInLocation('discard2');

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
    }

    private function applyPutDiscardPile(int $discardNumber) {        
        $playerId = intval($this->getActivePlayerId());

        $card = $this->cards->getItemsInLocation('pick')[0];
        if ($card == null) {
            throw new \BgaUserException("No card in pick");
        }

        $location = 'discard'.$discardNumber;
        $maxLocationArg = intval($this->getUniqueValueFromDB("SELECT max(card_location_arg) FROM card where `card_location` = '$location'"));
        $this->cards->moveItem($card, $location, $maxLocationArg + 1);

        $this->notify->all('cardInDiscardFromPick', clienttranslate('${player_name} puts ${cardColor} ${cardName} to discard pile ${discardNumber}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => $card,
            'cardName' => $this->getCardName($card),
            'cardColor' => $this->COLORS[$card->color],
            'i18n' => ['cardName', 'cardColor'],
            'discardId' => $discardNumber,
            'discardNumber' => $discardNumber,
            'remainingCardsInDiscard' => $this->getRemainingCardsInDiscard($discardNumber),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
        ]);

        if (($card->category === COLLECTION || ($card->category === SPECIAL && $card->family === SEAHORSE)) && $this->eventCards->playerHasEffect($playerId, THE_DOLPHINS)) {
            $this->notify->all('log', clienttranslate('${player_name} discarded a collection card and apply The Delphins effect'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerNameById($playerId),
            ]);

            if (!$this->pickTopCardFromDeck($playerId)) {
                $this->notify->all('log', clienttranslate('Impossible to activate The Dolphins effect, it is ignored'), []);
            }
        }
    }
        
    public function actPutDiscardPile(int $discardNumber) {
        if (!in_array($discardNumber, [1, 2])) {
            throw new \BgaUserException("Invalid discard number");
        }

        $this->applyPutDiscardPile($discardNumber);

        $this->gamestate->nextState('playCards');
    }

    public function pickTopCardFromDeck(int $playerId): bool { // return if applied
        if ($this->cards->countItemsInLocation('deck') === 0) {
            return false;
        }

        $card = $this->cards->pickItemForLocation('deck', null, 'hand'.$playerId);
        $this->cardCollected($playerId, $card);

        $this->notify->player($playerId, 'cardInHandFromDeck', clienttranslate('You take ${cardColor} ${cardName} card from deck'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => $card,
            'cardName' => $this->getCardName($card),
            'cardColor' => $this->COLORS[$card->color],
            'i18n' => ['cardName', 'cardColor'],
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
            'deckTopCard' => $this->cards->getDeckTopCard(),
            'remainingCardsInDeck' => $this->getRemainingCardsInDeck(),
        ]);
        $this->notify->all('cardInHandFromDeck', clienttranslate('${player_name} took a card from deck'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => Card::onlyId($card),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
            'deckTopCard' => $this->cards->getDeckTopCard(),
            'remainingCardsInDeck' => $this->getRemainingCardsInDeck(),
        ]);
        
        $this->updateCardsPoints($playerId);
        return true;
    }

    public function actPlayCards(int $id1, int $id2) {

        if ($id1 == $id2) {
            throw new \BgaUserException("Same id");
        }

        $playerId = intval($this->getActivePlayerId());
        $cards = $this->cards->getItemsByIds([$id1, $id2]);

        if ($this->array_some($cards, fn($card) => $card->location != 'hand'.$playerId || $card->category != PAIR)) {
            throw new \BgaUserException("You must select Pair cards from your hand");
        }

        if (!in_array($cards[1]->family, $cards[0]->matchFamilies)) {
            throw new \BgaUserException("Invalid pair");
        }

        $count = $this->cards->countItemsInLocation('table'.$playerId);
        foreach($cards as $card) {
            $this->cards->moveItem($card, 'table'.$playerId, ++$count);
        }

        $families = array_map(fn($card) => $card->family, $cards);
        sort($families);
        $action = '';
        $power = 0;
        switch ($families[0]) {
            case CRAB:
                if ($families[1] == LOBSTER) {
                    $action = clienttranslate('takes the first five cards from the deck and keeps one of them');
                    $power = 6;
                } else {
                    $action = clienttranslate('takes a card from a discard pile');
                    $power = 1;
                }
                break;
            case BOAT:
                $action = clienttranslate('plays a new turn');
                $power = 2;
                break;
            case FISH:
                $action = clienttranslate('adds the top card from the deck to hand');
                $power = 3;
                break;
            case SWIMMER:
            case SHARK:
                if ($families[0] == SWIMMER && $families[1] == JELLYFISH) {
                    $action = clienttranslate('forces the opposing players to only draw the first card from the deck on their next turn');
                    $power = 5;
                } else {
                    $action = clienttranslate('steals a random card from another player');
                    $power = 4;
                }
                break;
        }

        $this->notify->all('playCards', clienttranslate('${player_name} plays cards ${cardColor1} ${cardName1} and ${cardColor2} ${cardName2} and ${action}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'cards' => $cards,
            'cardName1' => $this->getCardName($cards[0]),
            'cardName2' => $this->getCardName($cards[1]),
            'cardColor1' => $this->COLORS[$cards[0]->color],
            'cardColor2' => $this->COLORS[$cards[1]->color],
            'action' => $action,
            'i18n' => ['cardName1', 'cardName2', 'cardColor1', 'cardColor2', 'action'],
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
        ]);

        $this->incStat(1, 'playedDuoCards');
        $this->incStat(1, 'playedDuoCards', $playerId);
        $this->incStat(1, 'playedDuoCards'.$power);
        $this->incStat(1, 'playedDuoCards'.$power, $playerId);

        switch ($power) {
            case 1:
                if (($this->cards->countItemsInLocation('discard1') + $this->cards->countItemsInLocation('discard2')) > 0) {
                    if ($this->eventCards->playerHasEffect($playerId, THE_HERMIT_CRAB)) {
                        $this->globals->set(THE_HERMIT_CRAB_CURRENT_PILE, $this->cards->countItemsInLocation('discard1') > 0 ? 1 : 2);
                        $this->gamestate->nextState('pickFromDiscardPiles');
                    } else {
                        $this->gamestate->nextState('chooseDiscardPile');
                    }
                } else {
                    $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }
                break;
            case 2:
                if (($this->cards->countItemsInLocation('deck') + $this->cards->countItemsInLocation('discard1') + $this->cards->countItemsInLocation('discard2')) > 0) {
                    $this->gamestate->nextState('newTurn');
                } else {
                    $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }
                break;
            case 3:
                if (!$this->pickTopCardFromDeck($playerId)) {
                    $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                } else {
                    if ($this->eventCards->playerHasEffect($playerId, THE_SUNFISH)) {
                        $this->notify->all('log', clienttranslate('${player_name} played a pair of fish and apply The Sunfish effect'), [
                            'playerId' => $playerId,
                            'player_name' => $this->getPlayerNameById($playerId),
                        ]);

                        if (!$this->pickTopCardFromDeck($playerId)) {
                            $this->notify->all('log', clienttranslate('Impossible to activate The Sunfish effect, it is ignored'), []);
                        }
                    }
                }
                $this->gamestate->nextState('playCards');
                break;
            case 4:
                $possibleOpponentsToSteal = $this->getPossibleOpponentsToSteal($playerId);

                if (count($possibleOpponentsToSteal) > 0) {
                    $this->gamestate->nextState('chooseOpponent');
                } else {
                    $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }

                /*if (count($possibleOpponentsToSteal) > 1) {
                    $this->gamestate->nextState('chooseOpponent');
                } else {
                    if (count($possibleOpponentsToSteal) == 1) {
                        $this->applySteal($playerId, $possibleOpponentsToSteal[0]);
                    } else {
                        $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    }
                    $this->gamestate->nextState('playCards');
                }*/
                break;
            case 5:
                $this->setGameStateValue(FORCE_TAKE_ONE, $playerId);
                $this->gamestate->nextState('playCards');
                break;
            case 6:
                if ($this->cards->countItemsInLocation('deck') > 0) {
                    $this->setGameStateValue(LOBSTER_POWER, 1);

                    $cards = $this->cards->pickItemsForLocation(5, 'deck', null, 'pick');
            
                    $this->notify->all('log', clienttranslate('${player_name} picks ${number} cards from the deck'), [
                        'playerId' => $playerId,
                        'player_name' => $this->getPlayerNameById($playerId),
                        'number' => count($cards),
                        'preserve' => ['actionPlayerId'],
                        'actionPlayerId' => $playerId,
                    ]);

                    $this->gamestate->nextState('chooseCard');
                } else {
                    $this->notify->all('log', clienttranslate('Impossible to activate Pair effect, it is ignored'), []);
                    $this->gamestate->nextState('playCards');
                }
                break;
        }
    }

    public function actPlayCardsTrio(int $id1, int $id2, int $starfishId) {

        if ($id1 == $id2) {
            throw new \BgaUserException("Same id");
        }

        $playerId = intval($this->getActivePlayerId());
        $cards = $this->cards->getItemsByIds([$id1, $id2]);

        if ($this->array_some($cards, fn($card) => $card->location != 'hand'.$playerId || $card->category != PAIR)) {
            throw new \BgaUserException("You must select Pair cards from your hand");
        }

        if (!in_array($cards[1]->family, $cards[0]->matchFamilies)) {
            throw new \BgaUserException("Invalid pair");
        }

        $starfishCard = $this->cards->getItemById($starfishId);
        if ($starfishCard->location != 'hand'.$playerId || $starfishCard->category != SPECIAL || $starfishCard->family != STARFISH) {
            throw new \BgaUserException("You must select a Starfish card from your hand");
        }

        $allCards = array_merge($cards, [$starfishCard]);

        $count = $this->cards->countItemsInLocation('table'.$playerId);
        foreach($allCards as $card) {
            $this->cards->moveItem($card, 'table'.$playerId, ++$count);
        }

        $this->notify->all('playCards', clienttranslate('${player_name} plays cards ${cardColor1} ${cardName1} and ${cardColor2} ${cardName2} with a ${cardColor3} ${cardName3}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'cards' => $allCards,
            'cardName1' => $this->getCardName($cards[0]),
            'cardName2' => $this->getCardName($cards[1]),
            'cardName3' => $this->getCardName($starfishCard),
            'cardColor1' => $this->COLORS[$cards[0]->color],
            'cardColor2' => $this->COLORS[$cards[1]->color],
            'cardColor3' => $this->COLORS[$starfishCard->color],
            'i18n' => ['cardName1', 'cardName2', 'cardName3', 'cardColor1', 'cardColor2', 'cardColor3'],
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
        ]);

        $this->updateCardsPoints($playerId);

        /*$this->incStat(1, 'playedDuoCards');
        $this->incStat(1, 'playedDuoCards', $playerId);*/ 
        
        $this->gamestate->nextState('playCards');
    }

    public function actSelectShellFaceDown() {
        $this->gamestate->nextState('placeShellFaceDown');
    }

    public function actEndTurn() {

        $playerId = intval($this->getActivePlayerId());

        $mermaids = $this->getPlayerMermaids($playerId);
        if (count($mermaids) == $this->mermaidsToEndGame($playerId)) {
            $this->endGameWithMermaids($playerId);
            return;
        }
        
        $this->gamestate->nextState('endTurn');
    }

    private function applyEndRound(int $type, string $announcement) {
        $playerId = intval($this->getActivePlayerId());

        $mermaids = $this->getPlayerMermaids($playerId);
        if (count($mermaids) == $this->mermaidsToEndGame($playerId)) {
            $this->endGameWithMermaids($playerId);
            return;
        }

        $this->setGameStateValue(END_ROUND_TYPE, $type);

        $this->notify->all('announceEndRound', clienttranslate('${player_name} announces ${announcement}!'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'announcement' => $announcement,
            'i18n' => ['announcement'],
        ]);
        
        $this->gamestate->nextState('endTurn');
    }

    public function actEndRound() {
        $playerId = intval($this->getActivePlayerId());

        $this->incStat(1, 'announce');
        $this->incStat(1, 'announce', $playerId);
        $this->incStat(1, 'announceLastChance');
        $this->incStat(1, 'announceLastChance', $playerId);

        $this->applyEndRound(LAST_CHANCE, $this->ANNOUNCEMENTS[LAST_CHANCE]);
    }

    public function actImmediateEndRound() {

        $playerId = intval($this->getActivePlayerId());

        $this->incStat(1, 'announce');
        $this->incStat(1, 'announce', $playerId);
        $this->incStat(1, 'announceStop');
        $this->incStat(1, 'announceStop', $playerId);

        $this->setGameStateValue(STOP_CALLER, $playerId);

        $this->applyEndRound(STOP, $this->ANNOUNCEMENTS[STOP]);
    }

    public function actChooseDiscardPile(int $discardNumber) {
        if (!in_array($discardNumber, [1, 2])) {
            throw new \BgaUserException("Invalid discard number");
        }

        if ($this->cards->countItemsInLocation('discard'.$discardNumber) == 0) {
            throw new \BgaUserException("No card in that discard");
        }

        $card = $this->cards->getDiscardTopCard($discardNumber);
        if ($card == null) {
            throw new \BgaUserException("No card in that discard");
        }

        $this->setGameStateValue(CHOSEN_DISCARD, $discardNumber);

        $this->gamestate->nextState('chooseCard');
    }

    public function endGameWithMermaids(/*int | null*/$playerId = null) {
        if ($playerId === null) {
            $playerId = intval($this->getActivePlayerId());
        }

        $mermaids = $this->getPlayerMermaids($playerId);
        if (count($mermaids) == $this->mermaidsToEndGame($playerId)) {
            $count = $this->cards->countItemsInLocation('table'.$playerId);
            foreach($mermaids as $card) {
                $this->cards->moveItem($card, 'table'.$playerId, ++$count);
            }

            $this->notify->all('playCards', '', [
                'playerId' => $playerId,
                'cards' => $mermaids,
            ]);

            $this->gamestate->nextState('mermaids');
        } else {
            throw new \BgaUserException("You need the four Mermaids");
        }
    }

    #[CheckAction(false)]
    public function actEndGameWithMermaids() {
        $this->endGameWithMermaids();
    }

    public function actChooseDiscardCard(int $id) {

        $card = $this->cards->getItemById($id);
        $hermitCrabCurrentPile = $this->globals->get(THE_HERMIT_CRAB_CURRENT_PILE);
        $discardNumber = $hermitCrabCurrentPile ?? $this->getGameStateValue(CHOSEN_DISCARD);
        if ($card == null || $card->location != 'discard'.$discardNumber) {
            throw new \BgaUserException("Invalid discard card");
        }

        $playerId = intval($this->getActivePlayerId());

        $this->cards->moveItem($card, 'hand'.$playerId);
        $this->cardCollected($playerId, $card);

        $this->notify->player($playerId, 'cardInHandFromDiscardCrab', clienttranslate('You take ${cardColor} ${cardName} from discard pile ${discardNumber}'), [
            'playerId' => $playerId,
            'card' => $card,
            'cardName' => $this->getCardName($card),
            'cardColor' => $this->COLORS[$card->color],
            'i18n' => ['cardName', 'cardColor'],
            'discardId' => $discardNumber,
            'discardNumber' => $discardNumber,
            'newDiscardTopCard' => $this->cards->getDiscardTopCard($discardNumber),
            'remainingCardsInDiscard' => $this->getRemainingCardsInDiscard($discardNumber),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
        ]);
        $this->notify->all('cardInHandFromDiscardCrab', clienttranslate('${player_name} takes a card from discard pile ${discardNumber}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => Card::onlyId($card),
            'discardId' => $discardNumber,
            'discardNumber' => $discardNumber,
            'newDiscardTopCard' => $this->cards->getDiscardTopCard($discardNumber),
            'remainingCardsInDiscard' => $this->getRemainingCardsInDiscard($discardNumber),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
        ]);

        $this->updateCardsPoints($playerId);

        if ($hermitCrabCurrentPile === 1) {
            $hermitCrabCurrentPile = $this->cards->countItemsInLocation('discard2') > 0 ? 2 : null;
            $this->globals->set(THE_HERMIT_CRAB_CURRENT_PILE, $hermitCrabCurrentPile);
        } else if ($hermitCrabCurrentPile === 2) {
            $hermitCrabCurrentPile = null;
            $this->globals->set(THE_HERMIT_CRAB_CURRENT_PILE, $hermitCrabCurrentPile);
        }

        if ($hermitCrabCurrentPile === null) {
            $this->gamestate->nextState('playCards');            
        } else {
            $this->gamestate->nextState('stay');
        }
    }

    public function actChooseOpponent(int $id) {

        $playerId = intval($this->getActivePlayerId());

        $this->applySteal($playerId, $id);

        $this->gamestate->nextState('playCards');
    }

    public function actSeen() {
        $playerId = intval($this->getCurrentPlayerId());

        $this->gamestate->setPlayerNonMultiactive($playerId, 'endRound');
    }

    public function actChooseKeptEventCard(int $id) {
        $playerId = intval($this->getCurrentPlayerId());

        $this->eventCards->keepCard($playerId, $id);

        $this->gamestate->nextState('');
    }

    public function actPlaceShellFaceDown(int $id) {
        $playerId = intval($this->getActivePlayerId());
        $card = $this->cards->getItemById($id);

        if ($card->location != 'hand'.$playerId || $card->category != COLLECTION || $card->family != SHELL) {
            throw new \BgaUserException("You must select a Shell card from your hand");
        }

        $count = $this->cards->countItemsInLocation('table'.$playerId);
        $this->cards->moveItem($card, 'table'.$playerId, ++$count);
        $card->flipped = true;
        $this->cards->updateItem($card, ['flipped']);

        $this->notify->all('placeShellFaceDown', clienttranslate('${player_name} places a Shell face down to be immune to attacks'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => $card,
        ]);

        $this->gamestate->nextState('');
    }

    public function actCancelPlaceShellFaceDown() {
        $this->gamestate->nextState('');
    }

    public function actTakeCardAngelfishPower(int $number) {
        $card = $this->cards->getDiscardTopCard($number);
        if ($card == null) {
            throw new \BgaUserException("No card in that discard");
        }

        $playerId = intval($this->getActivePlayerId());

        $this->cards->moveItem($card, 'hand'.$playerId);
        $this->cardCollected($playerId, $card);

        $this->notify->all('cardInHandFromDiscard', clienttranslate('${player_name} takes ${cardColor} ${cardName} from discard pile ${discardNumber} (The angelfish power)'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => $card,
            'cardName' => $this->getCardName($card),
            'cardColor' => $this->COLORS[$card->color],
            'i18n' => ['cardName', 'cardColor'],
            'discardId' => $number,
            'discardNumber' => $number,
            'newDiscardTopCard' => $this->cards->getDiscardTopCard($number),
            'remainingCardsInDiscard' => $this->getRemainingCardsInDiscard($number),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
        ]);

        $this->updateCardsPoints($playerId);
        $this->gamestate->nextState('playCards');
    }
}
