<?php
declare(strict_types=1);

namespace Bga\Games\SeaSaltPaper;

require_once(__DIR__.'/framework-prototype/item/item.php');
require_once(__DIR__.'/framework-prototype/item/item-field.php');
require_once(__DIR__.'/framework-prototype/item/item-location.php');
require_once(__DIR__.'/framework-prototype/item/item-manager.php');

use \Bga\GameFrameworkPrototype\Item\ItemManager;
use Bga\Games\SeaSaltPaper\Objects\Card;
use Bga\Games\SeaSaltPaper\Objects\BoatPairCard;
use Bga\Games\SeaSaltPaper\Objects\CollectionCard;
use Bga\Games\SeaSaltPaper\Objects\CrabPairCard;
use Bga\Games\SeaSaltPaper\Objects\FishPairCard;
use Bga\Games\SeaSaltPaper\Objects\JellyfishPairCard;
use Bga\Games\SeaSaltPaper\Objects\LobsterPairCard;
use Bga\Games\SeaSaltPaper\Objects\MermaidCard;
use Bga\Games\SeaSaltPaper\Objects\MultiplierCard;
use Bga\Games\SeaSaltPaper\Objects\SharkPairCard;
use Bga\Games\SeaSaltPaper\Objects\SpecialCard;
use Bga\Games\SeaSaltPaper\Objects\SwimmerPairCard;

class CardManager extends ItemManager {
    public array $CARDS;
    public array $EXTRA_SALT_EXPANSION_CARDS;
    public static array $ALL_CARDS;

    function __construct(
        protected $game,
    ) {
        parent::__construct(
            Card::class,
            [],
        );

        $this->CARDS = [
            new MermaidCard(),

            new CrabPairCard(DARK_BLUE, 2),
            new CrabPairCard(LIGHT_BLUE, 2),
            new CrabPairCard(BLACK),
            new CrabPairCard(YELLOW, 2),
            new CrabPairCard(GREEN),
            new CrabPairCard(GREY),

            new BoatPairCard(DARK_BLUE, 2),
            new BoatPairCard(LIGHT_BLUE, 2),
            new BoatPairCard(BLACK, 2),
            new BoatPairCard(YELLOW, 2),

            new FishPairCard(DARK_BLUE, 2),
            new FishPairCard(LIGHT_BLUE),
            new FishPairCard(BLACK, 2),
            new FishPairCard(YELLOW),
            new FishPairCard(GREEN),

            new SwimmerPairCard(DARK_BLUE),
            new SwimmerPairCard(LIGHT_BLUE),
            new SwimmerPairCard(BLACK),
            new SwimmerPairCard(YELLOW),
            new SwimmerPairCard(LIGHT_ORANGE),

            new SharkPairCard(DARK_BLUE),
            new SharkPairCard(LIGHT_BLUE),
            new SharkPairCard(BLACK),
            new SharkPairCard(GREEN),
            new SharkPairCard(PURPLE),

            new CollectionCard(SHELL, DARK_BLUE),
            new CollectionCard(SHELL, LIGHT_BLUE),
            new CollectionCard(SHELL, BLACK),
            new CollectionCard(SHELL, YELLOW),
            new CollectionCard(SHELL, GREEN),
            new CollectionCard(SHELL, GREY),

            new CollectionCard(OCTOPUS, LIGHT_BLUE),
            new CollectionCard(OCTOPUS, YELLOW),
            new CollectionCard(OCTOPUS, GREEN),
            new CollectionCard(OCTOPUS, PURPLE),
            new CollectionCard(OCTOPUS, GREY),

            new CollectionCard(PENGUIN, PURPLE),
            new CollectionCard(PENGUIN, LIGHT_ORANGE),
            new CollectionCard(PENGUIN, PINK),

            new CollectionCard(SAILOR, PINK),
            new CollectionCard(SAILOR, ORANGE),
            
            new MultiplierCard(LIGHTHOUSE, PAIR, BOAT, PURPLE, 1),
            new MultiplierCard(SHOAL_FISH, PAIR, FISH, GREY, 1),
            new MultiplierCard(PENGUIN_COLONY, COLLECTION, PENGUIN, GREEN, 2),
            new MultiplierCard(CAPTAIN, COLLECTION, SAILOR, LIGHT_ORANGE, 3),
        ];

        $this->EXTRA_SALT_EXPANSION_CARDS = [
            new JellyfishPairCard(PURPLE),
            new JellyfishPairCard(PINK),

            new LobsterPairCard(BLACK),

            new MultiplierCard(CAST_CRAB, PAIR, CRAB, GREEN, 1),

            new SpecialCard(STARFISH, DARK_BLUE),
            new SpecialCard(STARFISH, LIGHT_BLUE),
            new SpecialCard(STARFISH, YELLOW),

            new SpecialCard(SEAHORSE, WHITE),
        ];

        self::$ALL_CARDS = array_merge($this->CARDS, $this->EXTRA_SALT_EXPANSION_CARDS);
    }

    function setup(bool $extraSaltExpansion) {
        $cards = [];
        $cardsTypes = $this->CARDS;
        if ($extraSaltExpansion) {
            $cardsTypes = array_merge($cardsTypes, $this->EXTRA_SALT_EXPANSION_CARDS);
        }
        foreach ($cardsTypes as $cardType) {
            for ($index = 0; $index < $cardType->number; $index++) {
                $type = $cardType->category * 10 + $cardType->family;
                $typeArg = $cardType->color * 10 + $index;
                $cards[] = [ 'location' => 'deck', 'type' => $type, 'typeArg' => $typeArg, 'nbr' => 1 ];
            }
        }
        $this->createItems($cards);
        $this->shuffle('deck');
    }

    function getDeckTopCard() {
        return Card::onlyId($this->getOnTop('deck'));
    }

    function getDiscardTopCard(int $discardNumber) {
        return $this->getOnTop('discard'.$discardNumber);
    }

    /**
     * Because we mix card_location_arg and order during migration, handle both.
     */
    public function getOnTop(string $location): ?Card {
        $locationField = $this->getItemFieldByKind('location');
        $locationArgField = $this->getItemFieldByKind('location_arg');
        $orderField = $this->getItemFieldByKind('order');

        $where = $this->db->sqlEqualValue($locationField, $location);
        $orderBy = "`{$locationArgField->dbField}` DESC, `{$orderField->dbField}` DESC";
        $dbResults = array_values($this->db->sqlGetList("*", $where, orderBy: $orderBy, limit: 1));
        return count($dbResults) > 0 ? $this->getItemFromDb($dbResults[0]) : null;
    }

}
