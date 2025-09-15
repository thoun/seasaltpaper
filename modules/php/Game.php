<?php
 /**
  *------
  * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
  * SeaSaltPaper implementation : © <Your name here> <Your email address here>
  * 
  * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
  * See http://en.boardgamearena.com/#!doc/Studio for more information.
  * -----
  * 
  * seasaltpaper.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */

namespace Bga\Games\SeaSaltPaper;

use Bga\GameFrameworkPrototype\Counters\PlayerCounter;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\SeaSaltPaper\Objects\Card;

require_once(__DIR__.'/framework-prototype/Helpers/Arrays.php');
require_once(__DIR__.'/framework-prototype/counters/player-counter.php');
require_once(__DIR__.'/framework-prototype/item/item.php');
require_once(__DIR__.'/framework-prototype/item/item-field.php');
require_once(__DIR__.'/framework-prototype/item/item-location.php');
require_once(__DIR__.'/framework-prototype/item/item-manager.php');

require_once('constants.inc.php');

class Game extends \Bga\GameFramework\Table {
    use DebugUtilTrait;

    public CardManager $cards;
    public EventCardManager $eventCards;
    public PlayerCounter $score;

    public array $ANNOUNCEMENTS;
    public array $COLORS;

	function __construct() {
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();

        $this->ANNOUNCEMENTS = [
            LAST_CHANCE => clienttranslate('LAST CHANCE'),
            STOP => clienttranslate('STOP'),
        ];

        $this->COLORS = [
            clienttranslate('White'),
            clienttranslate('Dark blue'),
            clienttranslate('Light blue'),
            clienttranslate('Black'),
            clienttranslate('Yellow'),
            clienttranslate('Green'),
            clienttranslate('Purple'),
            clienttranslate('Gray'),
            clienttranslate('Light orange'),
            clienttranslate('Pink'),
            clienttranslate('Orange'),
        ];

        
        $this->initGameStateLabels([
            CHOSEN_DISCARD => CHOSEN_DISCARD,
            END_ROUND_TYPE => END_ROUND_TYPE,
            LAST_CHANCE_CALLER => LAST_CHANCE_CALLER,
            STOP_CALLER => STOP_CALLER,
            BET_RESULT => BET_RESULT,
            FORCE_TAKE_ONE => FORCE_TAKE_ONE,
            LOBSTER_POWER => LOBSTER_POWER,
        ]);  

        $this->cards = new CardManager($this);
        $this->eventCards = new EventCardManager($this);
        $this->score = new PlayerCounter($this, 'player_score', 'score');
	}

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame($players, $options = []) { 
        $isExtraSaltExpansion = $this->isExtraSaltExpansion();
        $isExtraPepperExpansion = $this->isExtraPepperExpansion();

        $this->cards->initDb();
        if ($isExtraPepperExpansion) {
            $this->eventCards->initDb();
        }

        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES ";
        $values = array();
        foreach( $players as $player_id => $player ) {
            $color = array_shift( $default_colors );
            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."')";
        }
        $sql .= implode(',', $values);
        $this->DbQuery( $sql );
        $this->reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        $this->reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
        $this->setGameStateInitialValue(END_ROUND_TYPE, 0);
        $this->setGameStateInitialValue(LAST_CHANCE_CALLER, 0);
        $this->setGameStateInitialValue(STOP_CALLER, 0);
        $this->setGameStateInitialValue(BET_RESULT, 0);
        $this->setGameStateInitialValue(FORCE_TAKE_ONE, 0);
        $this->setGameStateInitialValue(LOBSTER_POWER, 0);
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        $this->initStat('table', 'roundNumber', 0); 
        foreach(['table', 'player'] as $statType) {
            $this->initStat($statType, 'turnsNumber', 0);
            $this->initStat($statType, 'takeCardFromDeck', 0);
            $this->initStat($statType, 'takeFromDiscard', 0);
            $this->initStat($statType, 'playedDuoCards', 0);
            $possiblePowers = $isExtraSaltExpansion ? [1,2,3,4,5,6] : [1,2,3,4];
            foreach($possiblePowers as $number) {
                $this->initStat($statType, 'playedDuoCards'.$number, 0);
            }
            $this->initStat($statType, 'announce', 0);
            $this->initStat($statType, 'announceStop', 0);
            $this->initStat($statType, 'announceLastChance', 0);
            $this->initStat($statType, 'lastChanceBetWon', 0);
            $this->initStat($statType, 'lastChanceBetLost', 0);
            foreach([1,2,3,4] as $number) {
                $this->initStat($statType, 'cardsCollected'.$number, 0);
            }
            $this->initStat($statType, 'winWithMermaids', 0);
        }

        // setup the initial game situation here
        $this->cards->setup($isExtraSaltExpansion);
        if ($isExtraPepperExpansion) {
            $this->eventCards->setup();
        }

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        /************ End of the game initialization *****/
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas(): array {
        $isExtraPepperExpansion = $this->isExtraPepperExpansion();

        $result = [];
    
        $currentPlayerId = intval($this->getCurrentPlayerId());    // !! We must only return informations visible by this player !!
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_no playerNo FROM player ";
        $result['players'] = $this->getCollectionFromDb( $sql );

        

        $endRound = intval($this->getGameStateValue(END_ROUND_TYPE));
        $endCaller = 0;
        if ($endRound == LAST_CHANCE) {
            $endCaller = intval($this->getGameStateValue(LAST_CHANCE_CALLER));
        } else if ($endRound == STOP) {
            $endCaller = intval($this->getGameStateValue(STOP_CALLER));
        }

        foreach($result['players'] as $playerId => &$player) {
            $player['playerNo'] = intval($player['playerNo']);
            $handCards = $this->getPlayerCards($playerId, 'hand', false);
            $player['handCards'] = $playerId == $currentPlayerId ? $handCards : Card::onlyIds($handCards);
            $player['tableCards'] = $this->getPlayerCards($playerId, 'table', true);
            if ($playerId == $currentPlayerId) {
                $cardsPointsObj = $this->getCardsPoints($playerId);
                $player['cardsPoints'] = $cardsPointsObj->totalPoints;
                $player['detailledPoints'] = $cardsPointsObj->detailledPoints;
            }

            $betResult = intval($this->getGameStateValue(BET_RESULT));
            if ($endCaller == $playerId) {
                $player['endCall'] = [
                    'announcement' => $this->ANNOUNCEMENTS[$endRound],
                    'cardsPoints' => $this->getCardsPoints($playerId)->totalPoints,
                ];
                
                if (in_array($betResult, [1, 2])) {
                    $player['endCall']['betResult'] = $betResult == 2 ? clienttranslate('won') : clienttranslate('lost');
                }
            } else if (count($player['handCards']) == 0 && count($player['tableCards']) > 0) {
                $player['endRoundPoints'] = [
                    'cardsPoints' => $this->getCardsPoints($playerId)->totalPoints,
                ];
            }

            if ($endRound == LAST_CHANCE) {
                $playerScoreDetails = $this->getCardsPoints($playerId);
                if ($betResult == 2) { // won
                    if ($endCaller == $playerId) {
                        $player['scoringDetail'] = [
                            'cardsPoints' => $playerScoreDetails->totalPoints,
                            'colorBonus' => $playerScoreDetails->colorBonus,
                        ];
                    } else {
                        $player['scoringDetail'] = [
                            'cardsPoints' => null,
                            'colorBonus' => $playerScoreDetails->colorBonus,
                        ];
                    }
                } else if ($betResult == 1) { // lost
                    if ($endCaller == $playerId) {
                        $player['scoringDetail'] = [
                            'cardsPoints' => null,
                            'colorBonus' => $playerScoreDetails->colorBonus,
                        ];
                    } else {
                        $player['scoringDetail'] = [
                            'cardsPoints' => $playerScoreDetails->totalPoints,
                            'colorBonus' => null,
                        ];
                    }
                }
            } else if ($endRound == STOP) {
                $player['scoringDetail'] = [
                    'cardsPoints' => $this->getCardsPoints($playerId)->totalPoints,
                    'colorBonus' => null,
                ];
            } else if ($endRound == EMPTY_DECK) {
                $player['scoringDetail'] = [
                    'cardsPoints' => null,
                    'colorBonus' => null,
                ];
            }

            if ($isExtraPepperExpansion) {
                $player['eventCards'] = $this->eventCards->getPlayer($playerId);
            }
        }

        $result['deckTopCard'] = $this->cards->getDeckTopCard();
        $result['remainingCardsInDeck'] = $this->getRemainingCardsInDeck();
        foreach ([1, 2] as $number) {
            $result['discardTopCard'.$number] = $this->cards->getDiscardTopCard($number);
            $result['remainingCardsInDiscard'.$number] = $this->getRemainingCardsInDiscard($number);
        }

        $result['extraSaltExpansion'] = $this->isExtraSaltExpansion();
        $result['extraPepperExpansion'] = $isExtraPepperExpansion;
        $result['doublePoints'] = $this->isDoublePoints();
        if ($isExtraPepperExpansion) {
            $result['tableEventCard'] = $this->eventCards->getTable();
        }
  
        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see states.inc.php)
    */
    function getGameProgression() {
        $maxScore = $this->getMaxScore();
        $topScore = $this->score->getMax();

        return min(100, 100 * $topScore / $maxScore);
    }

    function isLastRound() {
        $maxScore = $this->getMaxScore();
        $topScore = $this->score->getMax();

        return $topScore >= $maxScore;
    }



    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function isExtraSaltExpansion(): bool {
        return $this->tableOptions->get(EXTRA_SALT_EXPANSION) == 2;
    }

    function isExtraPepperExpansion(): bool {
        return $this->tableOptions->get(EXTRA_PEPPER_EXPANSION) == 2;
    }

    function isDoublePoints() {
        return $this->tableOptions->get(DOUBLE_POINTS) == 2;
    }

    function mermaidsToEndGame(int $playerId): int {
        return $this->eventCards->playerHasEffect($playerId, THE_DANCE_OF_THE_MERMAIDS) ? 3 : 4;
    }

    function getMaxScore() {
        $END_GAME_POINTS = [
            2 => 40,
            3 => 35,
            4 => 30,
        ];

        $maxScore = $END_GAME_POINTS[count($this->getPlayersIds())];

        if ($this->isDoublePoints()) {
            $maxScore *= 2;
        }

        return $maxScore;
    }

    // includeTableHandCards are cards from the hand that have been revealed on table, but never played
    function getPlayerCards(int $playerId, string $from /*'hand' | 'table'*/, bool $includeTableHandCards) {
        $cards = $this->cards->getItemsInLocation($from.$playerId);
        if ($from === 'table') {
            usort($cards, fn($a, $b) => $a->locationArg <=> $b->locationArg);
        }

        if ($includeTableHandCards) {
            $cards = array_merge($cards, $this->cards->getItemsInLocation('tablehand'.$playerId));
        }

        return $cards;
    }

    function getCardsPoints(int $playerId) {
        $tableCards = $this->getPlayerCards($playerId, 'table', false);
        $handCards = $this->getPlayerCards($playerId, 'hand', true);

        $cardsScore = new Objects\CardsPoints($tableCards, $handCards, $this->eventCards->getPlayerEffects($playerId));
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

    function isProtected(int $playerId): bool {
        return Arrays::some($this->getPlayerCards($playerId, 'table', true), fn($card) => $card->flipped);
    }

    function getPossibleOpponentsToSteal(int $stealerId) {
        $playersIds = $this->getPlayersIds();

        return Arrays::filter($playersIds, fn($playerId) => 
            $playerId != $stealerId && 
            $this->cards->countItemsInLocation('hand'.$playerId) > 0 &&
            !$this->isProtected($playerId),
        );
    }

    function getPlayedPairs(int $playerId): array {
        $playedCards = $this->getPlayerCards($playerId, 'table', false); // do not include card from call
        $playedPairs = [];

        foreach ($playedCards as $index => $card) {
            $previousCard = $index > 0 ? $playedCards[$index - 1] : null;
            $nextCard = $index < (count($playedCards) - 1) ? $playedCards[$index + 1] : null;
            if (
                $previousCard !== null 
                && !Arrays::some($playedPairs, fn($playedPair) => Arrays::some($playedPair, fn($pc) => $previousCard->id == $pc->id))
                && ($nextCard === null || $nextCard->category === PAIR)
                && $previousCard->category === PAIR
                && $card->category === PAIR
            ) {
                $playedPairs[] = [$previousCard, $card];
            }
        }

        return $playedPairs;
    }

    function getPossibleOpponentsToStealFromTable(int $stealerId) {
        $playersIds = $this->getPlayersIds();

        return Arrays::filter($playersIds, fn($playerId) => 
            $playerId != $stealerId && 
            $this->cards->countItemsInLocation('tablehand'.$playerId) === 0 && // to make sure the player didn't made a call, you can't steal player who laid all their cards
            count($this->getPlayedPairs($playerId)) > 0 &&
            !$this->isProtected($playerId),
        );
    }

    function applyStealRandomCard(int $stealerId, int $robbedPlayerId) {
        $cardsInHand = $this->getPlayerCards($robbedPlayerId, 'hand', false);
        $cardsNumber = count($cardsInHand);
        if ($cardsNumber > 0) {
            $randomCard = $cardsInHand[bga_rand(0, $cardsNumber - 1)];
            $this->applyStealCard($stealerId, $robbedPlayerId, $randomCard);
        }
    }

    function applyStealCard(int $stealerId, int $robbedPlayerId, Card $card) {
        $this->cards->moveItem($card, 'hand'.$stealerId);
        $this->cardCollected($stealerId, $card);

        $args = [
            'playerId' => $stealerId,
            'opponentId' => $robbedPlayerId,
            'player_name' => $this->getPlayerNameById($stealerId),
            'player_name2' => $this->getPlayerNameById($robbedPlayerId),
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

        $this->notify->all('stealCard', clienttranslate('${player_name} steals a card from ${player_name2} hand'), $args + $argMaskedCard);
        $this->notifyPlayer($robbedPlayerId, 'stealCard', clienttranslate('Card ${cardColor} ${cardName} was stolen from your hand'), $args + $argCardName + $argMaskedCard);
        $this->notifyPlayer($stealerId, 'stealCard', clienttranslate('Card ${cardColor} ${cardName} was picked from ${player_name2} hand'), $args + $argCardName + $argCard);

        $this->updateCardsPoints($stealerId);
        $this->updateCardsPoints($robbedPlayerId);
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
        return $this->cards->countItemsInLocation('deck');
    }

    function getRemainingCardsInDiscard(int $number) {
        return $this->cards->countItemsInLocation('discard'.$number);
    }

    function cardCollected(int $playerId, Card $card) {
        $number = $card->category;
        if ($number <= 4) {
            $this->incStat(1, 'cardsCollected'.$number);
            $this->incStat(1, 'cardsCollected'.$number, $playerId);
        }
    }

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
    
///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb($from_version) {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        
        if ($from_version <= 2305281437) {
            // ! important ! Use DBPREFIX_<table_name> for all tables
            $this->applyDbUpgradeToAllDB("ALTER TABLE DBPREFIX_card MODIFY COLUMN `card_location` varchar(25) NOT NULL");
        }

        if ($from_version <= 2508011150) {
            $result = $this->getUniqueValueFromDB("SHOW COLUMNS FROM `card` LIKE 'order'");
            if (is_null($result)) {
                $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_card` ADD `order` INT DEFAULT 0");
                $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_card` ADD `flipped` TINYINT DEFAULT 0");
                $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_card` SET `order` = `card_location_arg` WHERE `card_location_arg` < 100");
            }
        }

    }    
}
