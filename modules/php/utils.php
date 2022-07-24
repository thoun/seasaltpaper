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

    function getFirstPlayerId() {
        return intval(self::getGameStateValue(FIRST_PLAYER));
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

    function getHandCount(int $playerId) {
        return intval($this->cards->countCardInLocation('hand'.$playerId));
    }

    function getCardsPoints(int $playerId) {
        $tableCards = $this->getCardsFromDb($this->cards->getCardsInLocation('table'.$playerId));
        $handCards = $this->getCardsFromDb($this->cards->getCardsInLocation('hand'.$playerId));

        $cardsScore = new CardsPoints($tableCards, $handCards);
        return $cardsScore;
    }

    function hasFourSirens(int $playerId) {
        $tableCards = $this->getCardsFromDb($this->cards->getCardsInLocation('table'.$playerId));
        $handCards = $this->getCardsFromDb($this->cards->getCardsInLocation('hand'.$playerId));
        $cards = $tableCards + $handCards;
        $sirenCards = array_values(array_filter($cards, fn($card) => $card->category == SIREN));

        return count($sirenCards) >= 4;
    }

}
