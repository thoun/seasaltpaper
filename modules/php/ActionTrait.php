<?php

namespace Bga\Games\SeaSaltPaper;

use Bga\GameFramework\Actions\CheckAction;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
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
    
    

    public function applyPutDiscardPile(int $discardNumber) {        
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

    public function actChooseOpponent(int $id) {

        $playerId = intval($this->getActivePlayerId());

        if ($this->globals->get(CAN_CHOOSE_CARD_TO_STEAL, false)) {
            $this->globals->set(STOLEN_PLAYER, $id);
            $this->gamestate->nextState('swapCard');
        } else {
            $this->applyStealRandomCard($playerId, $id);

            $this->gamestate->nextState('playCards');
        }
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

        $this->updateCardsPoints($playerId);

        $this->gamestate->nextState('playCards');
    }

    public function actCancelPlaceShellFaceDown() {
        $this->gamestate->nextState('playCards');
    }

    public function actSwapCard(int $playerCardId, int $opponentCardId) {
        $playerId = intval($this->getActivePlayerId());
        $opponentId = $this->globals->get(STOLEN_PLAYER);

        $playerCard = Arrays::find($this->getPlayerCards($playerId, 'hand', false), fn($card) => $card->id === $playerCardId);
        $opponentCard = Arrays::find($this->getPlayerCards($opponentId, 'hand', false), fn($card) => $card->id === $opponentCardId);
        if ($playerCard === null || $opponentCard === null) {
            throw new \BgaUserException("Invalid card");
        }

        $this->cards->moveItem($opponentCard, 'hand'.$playerId);
        $this->cardCollected($playerId, $opponentCard);
        $this->cards->moveItem($playerCard, 'hand'.$opponentId);
        $this->cardCollected($opponentId, $playerCard);

        $args = [
            'playerId' => $playerId,
            'opponentId' => $opponentId,
            'player_name' => $this->getPlayerNameById($playerId),
            'player_name2' => $this->getPlayerNameById($opponentId),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
            'opponentCards' => Card::onlyIds($this->getPlayerCards($opponentId, 'hand', false)),
        ];
        $argCardName = [
            'cardName' => $this->getCardName($playerCard),
            'cardColor' => $this->COLORS[$playerCard->color],
            'cardName2' => $this->getCardName($opponentCard),
            'cardColor2' => $this->COLORS[$opponentCard->color],
            'i18n' => ['cardName', 'cardColor', 'cardName2', 'cardColor2'],
        ];
        $argCard = [
            'card' => $playerCard,
            'card2' => $opponentCard,
        ];
        $argMaskedCard = [
            'card' => Card::onlyId($playerCard),
            'card2' => Card::onlyId($opponentCard),
        ];

        $this->notify->all('swapCard', clienttranslate('${player_name} swap a card with one from ${player_name2} hand'), $args + $argMaskedCard);
        $this->notifyPlayer($opponentId, 'swapCard', clienttranslate('Card ${cardColor} ${cardName} was swapped with ${cardColor2} ${cardName2} from your hand'), $args + $argCardName + $argCard);
        $this->notifyPlayer($playerId, 'swapCard', clienttranslate('Card ${cardColor} ${cardName} was swapped with ${cardColor2} ${cardName2} from ${player_name2} hand'), $args + $argCardName + $argCard);

        $this->updateCardsPoints($playerId);
        $this->updateCardsPoints($opponentId);

        $this->gamestate->nextState('playCards');
    }

    public function actPassSwapCard() {
        $playerId = intval($this->getActivePlayerId());
        $opponentId = $this->globals->get(STOLEN_PLAYER);

        $this->notifyPlayer($playerId, 'passSwapCard', '', [
            'playerId' => $playerId,
            'opponentId' => $opponentId,
            'opponentCards' => Card::onlyIds($this->getPlayerCards($opponentId, 'hand', false)),
        ]);

        $this->gamestate->nextState('playCards');
    }

    public function actStealPlayedPair(int $stolenPlayerId, int $id) {
        $args = $this->argStealPlayedPair();
        if (!array_key_exists($stolenPlayerId, $args['possiblePairs'])) {
            throw new \BgaUserException("You can't steal a pair from this player");
        }
        $cards = Arrays::find($args['possiblePairs'][$stolenPlayerId], fn($possiblePair) => Arrays::some($possiblePair, fn($card) => $card->id === $id));
        if ($cards === null) {
            throw new \BgaUserException("Invalid pair");
        }

        $playerId = intval($this->getActivePlayerId());

        $count = $this->cards->countItemsInLocation('table'.$playerId);
        foreach($cards as &$card) {
            $card->location = 'table'.$playerId;
            $card->locationArg = ++$count;
            $this->cards->moveItem($card, $card->location, $card->locationArg);
        }

        $this->notify->all('stealPlayedPair', clienttranslate('${player_name} steals cards ${cardColor1} ${cardName1} and ${cardColor2} ${cardName2} from ${player_name2}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'player_name2' => $this->getPlayerNameById($stolenPlayerId),
            'cards' => $cards,
            'cardName1' => $this->getCardName($cards[0]),
            'cardName2' => $this->getCardName($cards[1]),
            'cardColor1' => $this->COLORS[$cards[0]->color],
            'cardColor2' => $this->COLORS[$cards[1]->color],
            'i18n' => ['cardName1', 'cardName2', 'cardColor1', 'cardColor2'],
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $playerId,
        ]);

        $this->updateCardsPoints($playerId);
        $this->gamestate->nextState('playCards');
    }
}
