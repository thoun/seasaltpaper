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

    function getPlayerTopScore() {
        return intval(self::getUniqueValueFromDB("SELECT max(player_score) FROM player"));
    }

    function isExpansion() {
        return intval($this->getGameStateValue(EXPANSION)) == 2;
    }

    function isDoublePoints() {
        return intval($this->getGameStateValue(DOUBLE_POINTS)) == 2;
    }

    function getMaxScore() {
        $maxScore = $this->END_GAME_POINTS[count($this->getPlayersIds())];

        if ($this->isDoublePoints()) {
            $maxScore *= 2;
        }

        return $maxScore;
    }

    function getCardFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Card($dbCard, $this->ALL_CARDS);
    }

    function getCardsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbCards));
    }

    function setupCards(bool $isExpansion) {
        $cards = [];
        $cardsTypes = $this->CARDS;
        if ($isExpansion) {
            $cardsTypes = array_merge($cardsTypes, $this->EXPANSION_CARDS);
        }
        foreach ($cardsTypes as $cardType) {
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

    // includeTableHandCards are cards from the hand that have been revealed on table, but never played
    function getPlayerCards(int $playerId, string $from /*'hand' | 'table'*/, bool $includeTableHandCards) {
        $cards = $this->getCardsFromDb($this->cards->getCardsInLocation($from.$playerId));

        if ($includeTableHandCards) {
            $cards = array_merge($cards, $this->getCardsFromDb($this->cards->getCardsInLocation('tablehand'.$playerId)));
        }

        return $cards;
    }

    function getCardsPoints(int $playerId) {
        $tableCards = $this->getPlayerCards($playerId, 'table', false);
        $handCards = $this->getPlayerCards($playerId, 'hand', true);

        $cardsScore = new CardsPoints($tableCards, $handCards);
        return $cardsScore;
    }

    function updateCardsPoints(int $playerId) {
        $cardsPointsObj = $this->getCardsPoints($playerId);
        $this->notifyPlayer($playerId, 'updateCardsPoints', '', [
            'cardsPoints' => $cardsPointsObj->totalPoints,
            'detailledPoints' => $cardsPointsObj->detailledPoints,
        ]);
    }

    function getPlayerMermaids(int $playerId) {
        $tableCards = $this->getPlayerCards($playerId, 'table', false);
        $handCards = $this->getPlayerCards($playerId, 'hand', true);
        $playerCards = array_merge($tableCards, $handCards);
        $mermaidCards = array_values(array_filter($playerCards, fn($card) => $card->category == MERMAID));

        return $mermaidCards;
    }

    function revealHand(int $playerId) {
        $handCards = $this->getPlayerCards($playerId, 'hand', false);

        if (count($handCards) > 0) {
            $this->cards->moveAllCardsInLocation('hand'.$playerId, 'tablehand'.$playerId);

            $playerPoints = $this->getCardsPoints($playerId)->totalPoints;
            $this->notifyAllPlayers('revealHand', clienttranslate('${player_name} reveals a hand worth ${points} points'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                'cards' => $this->getPlayerCards($playerId, 'table', true),
                'points' => $playerPoints,
                'playerPoints' => $playerPoints,
            ]);
        }
    }

    function getPlayerScore(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_score FROM player where `player_id` = $playerId"));
    }

    function incPlayerScore(int $playerId, int $roundScore, $message = '', $args = []) {
        $this->DbQuery("UPDATE player SET `player_score` = `player_score` + $roundScore,  `player_score_aux` = $roundScore WHERE player_id = $playerId");
            
        $this->notifyAllPlayers('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->getPlayerScore($playerId),
            'incScore' => $roundScore,
        ] + $args);
    }

    function setPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        $this->DbQuery("UPDATE player SET `player_score` = $amount WHERE player_id = $playerId");
            
        $this->notifyAllPlayers('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $amount,
            'preserve' => ['playerId'],
        ] + $args);
    }

    function getPossibleOpponentsToSteal(int $stealerId) {
        $playersIds = $this->getPlayersIds();

        return array_values(array_filter($playersIds, fn($playerId) => 
            $playerId != $stealerId && intval($this->cards->countCardInLocation('hand'.$playerId)) > 0
        ));
    }

    function applySteal(int $stealerId, int $robbedPlayerId) {

        $cardsInHand = $this->getPlayerCards($robbedPlayerId, 'hand', false);
        $card = null;
        $cardsNumber = count($cardsInHand);
        if ($cardsNumber > 0) {
            $card = $cardsInHand[bga_rand(1, $cardsNumber) - 1];
            $this->cards->moveCard($card->id, 'hand'.$stealerId);
            $this->cardCollected($stealerId, $card);

            $args = [
                'playerId' => $stealerId,
                'opponentId' => $robbedPlayerId,
                'player_name' => $this->getPlayerName($stealerId),
                'player_name2' => $this->getPlayerName($robbedPlayerId),
                'preserve' => ['actionPlayerId'],
                'actionPlayerId' => $stealerId,
            ];
            $argCardName = [
                'cardName' => $this->getCardName($card),
                'cardColor' => $this->COLORS[$card->color],
                'i18n' => ['cardName', 'cardColor'],
            ];
            $argCard = [
                'card' => $card,
            ];
            $argMaskedCard = [
                'card' => Card::onlyId($card),
            ];

            $this->notifyAllPlayers('stealCard', clienttranslate('${player_name} steals a card from ${player_name2} hand'), $args + $argMaskedCard);
            $this->notifyPlayer($robbedPlayerId, 'stealCard', clienttranslate('Card ${cardColor} ${cardName} was stolen from your hand'), $args + $argCardName + $argMaskedCard);
            $this->notifyPlayer($stealerId, 'stealCard', clienttranslate('Card ${cardColor} ${cardName} was picked from ${player_name2} hand'), $args + $argCardName + $argCard);

            $this->updateCardsPoints($stealerId);
            $this->updateCardsPoints($robbedPlayerId);
        }
    }

    function playableDuoCards(int $playerId) {
        $familyPairs = [];
        $handCards = $this->getPlayerCards($playerId, 'hand', false);
        $pairCards = array_values(array_filter($handCards, fn($card) => $card->category == PAIR));
        for ($family = CRAB; $family <= LOBSTER; $family++) {
            $familyCards = array_values(array_filter($pairCards, fn($card) => $card->family == $family));
            if (count($familyCards) > 0) {
                $matchFamilies = $familyCards[0]->matchFamilies;

                if ($this->array_some($matchFamilies, fn($matchFamily) => 
                    count(array_filter($pairCards, fn($card) => $card->family == $matchFamily)) >= ($matchFamily == $family ? 2 : 1)
                )) {
                    $familyPairs[] = $family;
                }
            }
        }

        return $familyPairs;
    }

    function getCardName(Card $card) {
        switch ($card->category) {
            case MERMAID: return clienttranslate('Mermaid');
            case PAIR:
                switch ($card->family) {
                    case CRAB: return clienttranslate('Crab');
                    case BOAT: return clienttranslate('Boat');
                    case FISH: return clienttranslate('Fish');
                    case SWIMMER: return clienttranslate('Swimmer');
                    case SHARK: return clienttranslate('Shark');
                    case JELLYFISH: return clienttranslate('Jellyfish');
                    case LOBSTER: return clienttranslate('Lobster');
                }
                break;
            case COLLECTION:
                switch ($card->family) {
                    case SHELL: return clienttranslate('Shell');
                    case OCTOPUS: return clienttranslate('Octopus');
                    case PENGUIN: return clienttranslate('Penguin');
                    case SAILOR: return clienttranslate('Sailor');
                }
                break;
            case MULTIPLIER:
                switch ($card->family) {
                    case LIGHTHOUSE: return clienttranslate('The lighthouse');
                    case SHOAL_FISH: return clienttranslate('The shoal of fish');
                    case PENGUIN_COLONY: return clienttranslate('The penguin colony');
                    case CAPTAIN: return clienttranslate('The captain');
                    case CAST_CRAB: return clienttranslate('The cast of crabs');
                }
                break;
            case SPECIAL:
                switch ($card->family) {
                    case STARFISH: return clienttranslate('Starfish');
                    case SEAHORSE: return clienttranslate('Seahorse');
                }
                break;
        }

        return '';
    }

    function getRemainingCardsInDeck() {
        return intval($this->cards->countCardInLocation('deck'));
    }

    function getRemainingCardsInDiscard(int $number) {
        return intval($this->cards->countCardInLocation('discard'.$number));
    }

    function cardCollected(int $playerId, Card $card) {
        $number = $card->category;
        if ($number <= 4) {
            $this->incStat(1, 'cardsCollected'.$number);
            $this->incStat(1, 'cardsCollected'.$number, $playerId);
        }
    }

    function getDeckTopCard() {
        return Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck')));
    }
}
