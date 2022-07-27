<?php

require_once(__DIR__.'/objects/cards-points.php');

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function array_find(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return $value;
            }
        }
        return null;
    }

    function array_find_key(array $array, callable $fn) {
        foreach ($array as $key => $value) {
            if($fn($value)) {
                return $key;
            }
        }
        return null;
    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
    }
    
    function array_every(array $array, callable $fn) {
        foreach ($array as $value) {
            if(!$fn($value)) {
                return false;
            }
        }
        return true;
    }

    function array_identical(array $a1, array $a2) {
        if (count($a1) != count($a2)) {
            return false;
        }
        for ($i=0;$i<count($a1);$i++) {
            if ($a1[$i] != $a2[$i]) {
                return false;
            }
        }
        return true;
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getPlayerName(int $playerId) {
        return self::getUniqueValueFromDB("SELECT player_name FROM player WHERE player_id = $playerId");
    }

    function getCardFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new CARD($dbCard, $this->CARDS);
    }

    function getCardsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbCards));
    }

    function setupCards() {
        $cards = [];
        foreach ($this->CARDS as $cardType) {
            for ($index = 0; $index < $cardType->number; $index++) {
                $type = $cardType->category * 10 + $cardType->family;
                $typeArg = $cardType->color * 10 + $index;
                $cards[] = [ 'type' => $type, 'type_arg' => $typeArg, 'nbr' => 1 ];
            }
        }
        $this->cards->createCards($cards, 'deck');
        $this->cards->shuffle('deck');
    }
    
    function getTotalRoundNumber() {
        return 6 - count($this->getPlayersIds());
    }

    function getCardsPoints(int $playerId) {
        $tableCards = $this->getCardsFromDb($this->cards->getCardsInLocation('table'.$playerId));
        $handCards = $this->getCardsFromDb($this->cards->getCardsInLocation('hand'.$playerId));

        $cardsScore = new CardsPoints($tableCards, $handCards);
        return $cardsScore;
    }

    function updateCardsPoints(int $playerId) {
        $this->notifyPlayer($playerId, 'updateCardsPoints', '', [
            'cardsPoints' => $this->getCardsPoints($playerId)->totalPoints,
        ]);
    }

    function getPlayerSirens(int $playerId) {
        $tableCards = $this->getCardsFromDb($this->cards->getCardsInLocation('table'.$playerId));
        $handCards = $this->getCardsFromDb($this->cards->getCardsInLocation('hand'.$playerId));
        $cards = $tableCards + $handCards;
        $sirenCards = array_values(array_filter($cards, fn($card) => $card->category == SIREN));

        return $sirenCards;
    }

    function revealHand(int $playerId) {
        $handCards = $this->getCardsFromDb($this->cards->getCardsInLocation('hand'.$playerId));

        if (count($handCards) > 0) {
            $this->cards->moveAllCardsInLocation('hand'.$playerId, 'table'.$playerId);

            $this->notifyAllPlayers('playCards', '', [
                'playerId' => $playerId,
                'cards' => $this->getCardsFromDb($this->cards->getCardsInLocation('table'.$playerId)),
            ]);
        }
    }

    function getPlayerScore(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_score FROM player where `player_id` = $playerId"));
    }

    function incPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        $this->DbQuery("UPDATE player SET `player_score` = `player_score` + $amount WHERE player_id = $playerId");
            
        $this->notifyAllPlayers('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->getPlayerScore($playerId),
        ] + $args);
    }

    function setPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        $this->DbQuery("UPDATE player SET `player_score` = $amount WHERE player_id = $playerId");
            
        $this->notifyAllPlayers('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $amount,
        ] + $args);
    }

    function getPossibleOpponentsToSteal(int $stealerId) {
        $playersIds = $this->getPlayersIds();

        return array_filter($playersIds, fn($playerId) => 
            $playerId != $stealerId && intval($this->cards->countCardInLocation('hand'.$playerId)) > 0
        );
    }

    function applySteal(int $stealerId, int $robbedPlayerId) {

        $cardsInHand = $this->getCardsFromDb($this->cards->getCardsInLocation('hand'.$robbedPlayerId));
        $removedCard = null;
        $cardsNumber = count($cardsInHand);
        if ($cardsNumber > 0) {
            $removedCard = $cardsInHand[bga_rand(1, $cardsNumber) - 1];
            $this->cards->moveCard($removedCard->id, 'hand'.$stealerId);

            $this->notifyPlayer($robbedPlayerId, 'removedCard', clienttranslate('Card ${cardName} was removed from your hand'), [
                'playerId' => $robbedPlayerId,
                'animal' => $removedCard,
                'fromPlayerId' => $stealerId,
                'cardName' => $this->getCardName($removedCard),
            ]);

            $this->notifyPlayer($stealerId, 'newCard', clienttranslate('Card ${cardName} was picked from ${player_name2} hand'), [
                'playerId' => $stealerId,
                'player_name2' => $this->getPlayerName($robbedPlayerId),
                'animal' => $removedCard,
                'fromPlayerId' => $robbedPlayerId,
                'cardName' => $this->getCardName($removedCard),
            ]);

            // TODO notif hand counts
        }
    }

    function playableDuoCards(int $playerId) {
        $familyPairs = [];
        $handCards = $this->getCardsFromDb($this->cards->getCardsInLocation('hand'.$playerId));
        $pairCards = array_values(array_filter($handCards, fn($card) => $card->category == PAIR));
        for ($family = CRAB; $family <= FISH; $family++) {
            if (count(array_values(array_filter($pairCards, fn($card) => $card->family == $family))) >= 2) {
                $familyPairs[] = $family;
            }
        }
        if (
            count(array_values(array_filter($pairCards, fn($card) => $card->family == SWIMMER))) >= 1 &&
            count(array_values(array_filter($pairCards, fn($card) => $card->family == SHARK))) >= 1
        ) {
            $familyPairs[] = SWIMMER;
            $familyPairs[] = SHARK;
        }

        return $familyPairs;
    }

    function getCardName(Card $card) {
        return 'TODO';
    }

}
