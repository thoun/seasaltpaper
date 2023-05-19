<?php

function array_find_key(array $array, callable $fn) {
    foreach ($array as $key => $value) {
        if($fn($value)) {
            return $key;
        }
    }
    return null;
}

class CardsPoints {
    public array $detailledPoints;
    public int $totalPoints;
    public int $colorBonus;

    public function __construct(array $tableCards, array $handCards) {
        $cards = array_merge($tableCards, $handCards);

        $numberByColor = [];
        foreach($cards as $card) {
            if (array_key_exists($card->color, $numberByColor)) {
                $numberByColor[$card->color]++;
            } else {
                $numberByColor[$card->color] = 1;
            }
        }
        $this->colorBonus = count($numberByColor) > 0 ? max($numberByColor) : 0;

        if (count(array_filter($handCards, fn($card) => $card->category == SPECIAL && $card->family == SEAHORSE)) > 0) {
            $this->totalPoints = -1;
            foreach ([SHELL, OCTOPUS, PENGUIN, SAILOR] as $collectionBonus) {
                $detailledPoints = $this->getPoints($tableCards, $handCards, $numberByColor, $collectionBonus); // only works for 1, to change if multiple seahorses one day
                $totalPoints = $this->getTotalPoints($detailledPoints);

                if ($totalPoints > $this->totalPoints) {
                    $this->detailledPoints = $detailledPoints;            
                    $this->totalPoints = $totalPoints;
                }
            }
        } else {
            $this->detailledPoints = $this->getPoints($tableCards, $handCards, $numberByColor);            
            $this->totalPoints = $this->getTotalPoints($this->detailledPoints);
        }
    }

    public function getTotalPoints(array $detailledPoints) {
        return array_reduce($detailledPoints, fn($a, $b) => $a + $b, 0);
    }

    public function getPoints(array $tableCards, array $handCards, array $numberByColor, /*int|null*/$collectionBonus = null) {
        $cards = array_merge($tableCards, $handCards);

        $mermaidPoints = 0;
        $pairPoints = 0;
        $collectorPoints = 0;
        $multiplierPoints = 0;

        $mermaidCards = array_values(array_filter($cards, fn($card) => $card->category == MERMAID));
        $pairCardsInHand = array_values(array_filter($handCards, fn($card) => $card->category == PAIR));
        $pairCardsInTable = array_values(array_filter($tableCards, fn($card) => $card->category == PAIR));
        $collectionCards = array_values(array_filter($cards, fn($card) => $card->category == COLLECTION));
        $multiplierCards = array_values(array_filter($cards, fn($card) => $card->category == MULTIPLIER));
        $specialCardsInTable = array_values(array_filter($tableCards, fn($card) => $card->category == SPECIAL));

        // Mermaids
        $mermaidCount = count($mermaidCards);
        while ($mermaidCount > 0) {
            if (count($numberByColor) == 0) {
                break;
            }

            $maxColor = count($numberByColor) > 0 ? max($numberByColor) : 0;
            $mermaidPoints += $maxColor;

            $maxColorIndex = array_find_key($numberByColor, fn($val) => $val == $maxColor);
            unset($numberByColor[$maxColorIndex]);

            $mermaidCount--;
        }

        // Pairs
        $pairPoints += floor(count($pairCardsInTable) / 2);
        for ($family = CRAB; $family <= FISH; $family++) {
            $pairPoints += floor(count(array_values(array_filter($pairCardsInHand, fn($card) => $card->family == $family))) / 2);
        }
        $pairPoints += min( // TODO rework for new pairs
            count(array_values(array_filter($pairCardsInHand, fn($card) => $card->family == SWIMMER))),
            count(array_values(array_filter($pairCardsInHand, fn($card) => $card->family == SHARK))),
        );

        // Collections
        for ($family = SHELL; $family <= SAILOR; $family++) {
            $count = count(array_values(array_filter($collectionCards, fn($card) => $card->family == $family)));
            if ($count > 0) {
                if ($family === $collectionBonus && $count < count(COLLECTION_POINTS[$family])) {
                    $count++;
                }
                $collectorPoints += COLLECTION_POINTS[$family][$count - 1];
            }
        }
        
        // Multipliers
        for ($family = LIGHTHOUSE; $family <= CRAB_CAB; $family++) {
            $multiplierCardsOfFamily = array_values(array_filter($multiplierCards, fn($card) => $card->family == $family));
            if (count($multiplierCardsOfFamily) > 0) {
                $multiplierCard = $multiplierCardsOfFamily[0];
                $collectionCardCount = count(array_values(array_filter($cards, fn($card) => $card->category == $multiplierCard->matchCategory && $card->family == $multiplierCard->matchFamily)));
                if ($family == CRAB_CAB) {
                    //die('ok here '.$collectionCardCount. ' '.json_encode($multiplierCard));
                }
                if ($multiplierCard->matchCategory === COLLECTION && $multiplierCard->matchFamily === $collectionBonus && $collectionCardCount > 0 && $collectionCardCount < count(COLLECTION_POINTS[$family])) {
                    $collectionCardCount++;
                }
                $multiplierPoints += $multiplierCard->points * $collectionCardCount;
            }
        }
        
        // Special
        $pairPoints += count(array_filter($specialCardsInTable, fn($card) => $card->family == STARFISH)) * 2;

        return [$mermaidPoints, $pairPoints, $collectorPoints, $multiplierPoints];
    }
}
?>