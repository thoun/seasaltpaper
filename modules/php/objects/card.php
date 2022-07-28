<?php

class CardType {
    public int $category;
    public int $family;
    public int $color;
    public int $number;
  
    public function __construct(int $category, int $family, int $color, int $number) {
        $this->category = $category;
        $this->family = $family;
        $this->color = $color;
        $this->number = $number;
    } 
}

class MermaidCard extends CardType {  
    public function __construct() {
        parent::__construct(MERMAID, 0, 0, 4);
    } 
}

class PairCard extends CardType {
    public int $matchFamily;

    public function __construct(int $family, int $matchFamily,  int $color, int $number) {
        parent::__construct(PAIR, $family, $color, $number);
        $this->matchFamily = $matchFamily;
    } 
}
class CrabPairCard extends PairCard {
    public function __construct(int $color, int $number = 1) {
        parent::__construct(CRAB, CRAB, $color, $number);
    } 
}
class BoatPairCard extends PairCard {
    public function __construct(int $color, int $number = 1) {
        parent::__construct(BOAT, BOAT, $color, $number);
    } 
}
class FishPairCard extends PairCard {
    public function __construct(int $color, int $number = 1) {
        parent::__construct(FISH, FISH, $color, $number);
    } 
}
class SwimmerPairCard extends PairCard {
    public function __construct(int $color, int $number = 1) {
        parent::__construct(SWIMMER, SHARK, $color, $number);
    } 
}
class SharkPairCard extends PairCard {
    public function __construct(int $color, int $number = 1) {
        parent::__construct(SHARK, SWIMMER, $color, $number);
    } 
}

class CollectionCard extends CardType {
    public function __construct(int $family, int $color) {
        parent::__construct(COLLECTION, $family, $color, 1);
    } 
}
class MultiplierCard extends CardType {
    public int $matchCategory;
    public int $matchFamily;
    public int $points;

    public function __construct(int $family, int $matchCategory, int $matchFamily,  int $color, int $points) {
        parent::__construct(MULTIPLIER, $family, $color, 1);
        $this->matchCategory = $matchCategory;
        $this->matchFamily = $matchFamily;
        $this->points = $points;
    } 
}

class Card extends CardType {
    public int $id;
    public string $location;
    public int $locationArg;
    public int $index;
    public /*int|null*/ $matchFamily;

    public function __construct($dbCard, $CARDS_TYPE) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->locationArg = intval($dbCard['location_arg']);
        $type = intval($dbCard['type']);
        if ($type > 0) {
            $typeArg = intval($dbCard['type_arg']);

            $this->category = floor($type / 10);
            $this->family = $type % 10;
            $this->color = floor($typeArg / 10);
            $this->index = $typeArg % 10;

            foreach ($CARDS_TYPE as $cardType) {
                if ($cardType->category == $this->category && $cardType->family == $this->family) {
                    if (property_exists($cardType, 'matchCategory')) {
                        $this->matchCategory = $cardType->matchCategory;
                    }
                    if (property_exists($cardType, 'matchFamily')) {
                        $this->matchFamily = $cardType->matchFamily;
                    }
                    if (property_exists($cardType, 'points')) {
                        $this->points = $cardType->points;
                    }
                    break;
                }
            }
        }
    } 

    public static function onlyId(Card $card) {
        return new Card([
            'id' => $card->id,
            'location' => $card->location,
            'location_arg' => $card->locationArg,
            'type' => null
        ], null);
    }

    public static function onlyIds(array $cards) {
        return array_map(fn($card) => self::onlyId($card), $cards);
    }
}
?>