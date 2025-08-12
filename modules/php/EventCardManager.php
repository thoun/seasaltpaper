<?php
declare(strict_types=1);

namespace Bga\Games\SeaSaltPaper;

require_once(__DIR__.'/framework-prototype/item/item.php');
require_once(__DIR__.'/framework-prototype/item/item-field.php');
require_once(__DIR__.'/framework-prototype/item/item-location.php');
require_once(__DIR__.'/framework-prototype/item/item-manager.php');

use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\GameFrameworkPrototype\Item\ItemLocation;
use \Bga\GameFrameworkPrototype\Item\ItemManager;
use Bga\Games\SeaSaltPaper\Objects\EventCard;

const THE_HERMIT_CRAB = 1;
const THE_SUNFISH = 2;
const THE_WATER_RODEO = 3;
const THE_DANCE_OF_THE_SHELLS = 4;
const THE_KRAKEN = 5; 
const THE_TORNADO = 6;
const THE_DANCE_OF_THE_MERMAIDS = 7;
const THE_TREASURE_CHEST = 8;
const THE_DIODON_FISH = 9;
const THE_ANGELFISH = 10;
const THE_DOLPHINS = 11;
const THE_CORAL_REEF = 12;

class EventCardManager extends ItemManager {
    function __construct(
        protected $game,
    ) {
        parent::__construct(
            EventCard::class,
            [
                new ItemLocation('deck', true, autoReshuffleFrom: 'discard'),
            ],
        );
    }

    function setup(): void {
        $cards = [];
        for ($type = 1; $type < 12; $type++) {
            $cards[] = [ 'location' => 'deck', 'type' => $type, 'nbr' => 1 ];
        }
        $this->createItems($cards);
        $this->shuffle('deck');
        $this->pickItemForLocation('deck', null, 'table');
    }

    public function getTable(): ?EventCard {
        $table = $this->getItemsInLocation('table');
        return count($table) > 0 ? $table[0] : null;
    }

    public function getPlayer(int $playerId): array {
        return $this->getItemsInLocation('player', $playerId);
    }

    function endRoundGiveEventCard(): ?int {
        
        $maxScorePlayerId = null;
        $minScorePlayerId = null;
        $scores = $this->game->score->getAll();

        $valuesCount = array_count_values($scores);

        $max = max($scores);
        if ($valuesCount[$max] === 1) {
            $maxScorePlayerId = array_search($max, $scores);
        }
        $min = min($scores);
        if ($valuesCount[$min] === 1) {
            $minScorePlayerId = array_search($min, $scores);
        }

        // first, check if the players keeps their current event card
        foreach (array_keys($scores) as $playerId) {
            $eventCards = $this->getPlayer($playerId);
            foreach ($eventCards as $eventCard) {
                $remove = ($eventCard->for === 'top' && $playerId !== $maxScorePlayerId) || ($eventCard->for === 'bottom' && $playerId !== $minScorePlayerId);
                if ($remove) {
                    $this->moveItem($eventCard, 'discard');
                    
                    $message = $eventCard->for === 'top' ?
                        clienttranslate('${player_name} discard his event card (${player_name} is not anymore the player with the most points)') :
                        clienttranslate('${player_name} discard his event card (${player_name} is not anymore the player with the fewest points)');
                    $this->game->notify->all('discardEventCard', $message, [
                        'playerId' => $playerId,
                        'player_name' => $this->game->getPlayerNameById($playerId),
                        'card' => $eventCard,
                    ]);
                }
            }
        }

        // then give the new card
        $newEventPlayerId = null;
        $card = $this->getTable();
        if ($card->for === 'top') {
            $newEventPlayerId = $maxScorePlayerId;
        } else if ($card->for === 'bottom') {
            $newEventPlayerId = $minScorePlayerId;
        }

        if ($newEventPlayerId !== null) {
            $this->moveItem($card, 'player', $newEventPlayerId);
            
            $message = $card->for === 'top' ?
                clienttranslate('${player_name} takes the event card (player with the most points)') :
                clienttranslate('${player_name} takes the event card (player with the fewest points)');
            $this->game->notify->all('takeEventCard', $message, [
                'playerId' => $newEventPlayerId,
                'player_name' => $this->game->getPlayerNameById($newEventPlayerId),
                'card' => $card,
            ]);
        } else {
            $this->moveItem($card, 'discard');
            $this->game->notify->all('discardEventCard', clienttranslate('No one take the event card'), [
                'card' => $card,
            ]);
        }
        
        $newEventCard = $this->pickItemForLocation('deck', null, 'table');
        $this->game->notify->all('newTableEventCard', '', [
                'card' => $newEventCard,
            ]);

        return $newEventPlayerId;
    }

    public function keepCard(int $playerId, int $id) {
        $eventCards = $this->getPlayer($playerId);
        foreach ($eventCards as $eventCard) {
            $remove = ($eventCard->id !== $id);
            if ($remove) {
                $this->moveItem($eventCard, 'discard');
                
                $this->game->notify->all('discardEventCard', clienttranslate('${player_name} discard an event card'), [
                    'playerId' => $playerId,
                    'player_name' => $this->game->getPlayerNameById($playerId),
                    'card' => $eventCard,
                ]);
            }
        }
    }

    public function getActiveEventsForPlayer(int $playerId): array {
        if (!$this->game->isExtraPepperExpansion()) {
            return [];
        }
        
        $activeEventsForPlayer = $this->getPlayer($playerId);
        $activeEventsForPlayer[] = $this->getTable();
        return $activeEventsForPlayer;
    }

    public function playerHasEffect(int $playerId, int $effect): bool {
        return Arrays::some($this->getActiveEventsForPlayer($playerId), fn($card) => $card->type === $effect);
    }

    public function getPlayerEffects(int $playerId): array {
        return Arrays::map($this->getActiveEventsForPlayer($playerId), fn($card) => $card->type);
    }

}
